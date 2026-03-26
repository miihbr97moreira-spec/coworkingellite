import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Loader2, Monitor, Tablet, Smartphone, Layout,
  MousePointer2, Undo2, Redo2, Send, RotateCcw, Sparkles,
  Lock, Unlock, Plus, FileText, Globe, Download, Trash2,
  ExternalLink, Eye, Copy, Check
} from "lucide-react";
import { toast } from "sonner";
import { useLPConfig, useUpdateLPConfig } from "@/hooks/useSupabaseQuery";
import { useAIBuilder } from "@/hooks/useAIBuilder";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface GeneratedPage {
  id: string;
  slug: string;
  title: string;
  html_content: string;
  status: string;
  created_at: string;
}

type BuilderMode = "edit-lp" | "generate" | "edit-generated";

const AdminBuilderOmni = () => {
  const { data: config, isLoading } = useLPConfig();
  const updateConfig = useUpdateLPConfig();
  const { processPrompt, generatePage, isLoading: aiLoading } = useAIBuilder();

  // State
  const [mode, setMode] = useState<BuilderMode>("edit-lp");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [localConfig, setLocalConfig] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isEditMode, setIsEditMode] = useState(false);

  // Generated pages
  const [pages, setPages] = useState<GeneratedPage[]>([]);
  const [activePage, setActivePage] = useState<GeneratedPage | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Load config
  useEffect(() => {
    if (config) {
      setLocalConfig(config);
      setHistory([config]);
      setHistoryIndex(0);
    }
  }, [config]);

  // Load generated pages
  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const loadPages = async () => {
    const { data } = await supabase
      .from("generated_pages")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPages(data as GeneratedPage[]);
  };

  // Config editing
  const handleUpdate = (key: string, value: any) => {
    const newConfig = { ...localConfig, [key]: value };
    setLocalConfig(newConfig);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newConfig);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setLocalConfig(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setLocalConfig(history[historyIndex + 1]);
    }
  };

  const restore = () => {
    if (confirm("Restaurar para o padrão original?")) {
      setLocalConfig(config);
      setHistory([config]);
      setHistoryIndex(0);
      toast.success("Restaurado!");
    }
  };

  const saveLP = async () => {
    setIsSaving(true);
    try {
      for (const key of Object.keys(localConfig)) {
        await updateConfig.mutateAsync({ key, value: localConfig[key] });
      }
      toast.success("Landing Page publicada!");
    } catch {
      toast.error("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  // AI Chat
  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    const input = chatInput;
    setChatInput("");

    if (mode === "generate" || mode === "edit-generated") {
      // Generate new page
      setIsGenerating(true);
      setGeneratedHtml("");
      let fullHtml = "";

      await generatePage(
        input,
        (delta) => {
          fullHtml += delta;
          // Extract HTML from potential JSON wrapper
          const htmlMatch = fullHtml.match(/```html\n?([\s\S]*?)```/) ||
                            fullHtml.match(/"html"\s*:\s*"([\s\S]*?)(?:"\s*[,}])/) ||
                            null;
          const cleanHtml = htmlMatch ? htmlMatch[1] : fullHtml;
          if (cleanHtml.includes("<!DOCTYPE") || cleanHtml.includes("<html") || cleanHtml.includes("<div")) {
            setGeneratedHtml(cleanHtml);
          }
        },
        () => {
          setIsGenerating(false);
          // Final parse
          let finalHtml = fullHtml;
          try {
            const parsed = JSON.parse(fullHtml);
            if (parsed.html) {
              finalHtml = parsed.html;
              if (parsed.title) setNewPageTitle(parsed.title);
            }
          } catch {
            const htmlMatch = finalHtml.match(/```html\n?([\s\S]*?)```/);
            if (htmlMatch) finalHtml = htmlMatch[1];
          }
          setGeneratedHtml(finalHtml);

          const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: "✅ Página gerada! Visualize no canvas e salve quando estiver pronta.",
            timestamp: new Date(),
          };
          setChatMessages((prev) => [...prev, assistantMsg]);
        }
      );
    } else {
      // Edit existing LP
      const aiResponse = await processPrompt(input, localConfig);
      if (aiResponse) {
        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse.message,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
        if (aiResponse.updatedConfig) {
          handleUpdate("_full", aiResponse.updatedConfig);
          toast.success("Alterações aplicadas!");
        }
      }
    }
  };

  // Save generated page
  const saveGeneratedPage = async (publish = false) => {
    if (!generatedHtml) return;
    setIsSaving(true);
    try {
      const slug = (newPageTitle || "pagina")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

      const { data: user } = await supabase.auth.getUser();

      if (activePage) {
        // Update existing
        await supabase
          .from("generated_pages")
          .update({
            html_content: generatedHtml,
            title: newPageTitle || activePage.title,
            status: publish ? "published" : activePage.status,
          })
          .eq("id", activePage.id);
        toast.success(publish ? "Página publicada!" : "Página salva!");
      } else {
        // Create new
        const { error } = await supabase.from("generated_pages").insert({
          slug,
          title: newPageTitle || "Nova Página",
          html_content: generatedHtml,
          status: publish ? "published" : "draft",
          created_by: user?.user?.id,
        });
        if (error) throw error;
        toast.success(publish ? "Página criada e publicada!" : "Rascunho salvo!");
      }
      await loadPages();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar página.");
    } finally {
      setIsSaving(false);
    }
  };

  const deletePage = async (id: string) => {
    if (!confirm("Excluir esta página?")) return;
    await supabase.from("generated_pages").delete().eq("id", id);
    if (activePage?.id === id) {
      setActivePage(null);
      setGeneratedHtml("");
    }
    await loadPages();
    toast.success("Página excluída.");
  };

  const togglePublish = async (page: GeneratedPage) => {
    const newStatus = page.status === "published" ? "draft" : "published";
    await supabase.from("generated_pages").update({ status: newStatus }).eq("id", page.id);
    await loadPages();
    toast.success(newStatus === "published" ? "Publicada!" : "Despublicada.");
  };

  const exportHtml = () => {
    const blob = new Blob([generatedHtml], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${newPageTitle || "pagina"}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySlug = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
    toast.success("Link copiado!");
  };

  const openGeneratedPage = (page: GeneratedPage) => {
    setActivePage(page);
    setGeneratedHtml(page.html_content);
    setNewPageTitle(page.title);
    setMode("edit-generated");
  };

  const viewportWidth = viewport === "desktop" ? "w-full max-w-6xl" : viewport === "tablet" ? "w-full max-w-2xl" : "w-full max-w-sm";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando Builder...
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col -m-6 bg-background">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-border bg-background flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-2">
          {/* Mode Selector */}
          <div className="flex bg-secondary/50 p-0.5 rounded-lg border border-border/40 text-xs">
            <button
              onClick={() => { setMode("edit-lp"); setActivePage(null); setGeneratedHtml(""); }}
              className={`px-3 py-1.5 rounded-md transition-all font-medium ${mode === "edit-lp" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <FileText className="w-3.5 h-3.5 inline mr-1.5" />LP Atual
            </button>
            <button
              onClick={() => setMode("generate")}
              className={`px-3 py-1.5 rounded-md transition-all font-medium ${mode === "generate" || mode === "edit-generated" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />✨ Gerar Nova
            </button>
          </div>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Viewport */}
          <div className="flex bg-secondary/50 p-0.5 rounded-lg border border-border/40">
            {[
              { v: "desktop" as const, Icon: Monitor },
              { v: "tablet" as const, Icon: Tablet },
              { v: "mobile" as const, Icon: Smartphone },
            ].map(({ v, Icon }) => (
              <button key={v} onClick={() => setViewport(v)}
                className={`p-1.5 rounded-md transition-all ${viewport === v ? "bg-background shadow-sm text-primary" : "text-muted-foreground"}`}>
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Undo/Redo */}
          {mode === "edit-lp" && (
            <div className="flex gap-0.5">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={undo} disabled={historyIndex <= 0}>
                <Undo2 className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={redo} disabled={historyIndex >= history.length - 1}>
                <Redo2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          {mode === "edit-lp" && (
            <>
              <div className="h-5 w-px bg-border mx-1" />
              <Button variant={isEditMode ? "default" : "outline"} size="sm" onClick={() => setIsEditMode(!isEditMode)} className="gap-1.5 rounded-lg h-7 text-xs">
                {isEditMode ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {isEditMode ? "Editando" : "Edição"}
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(mode === "generate" || mode === "edit-generated") && generatedHtml && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-lg h-7 text-xs" onClick={exportHtml}>
                <Download className="w-3 h-3" /> Exportar
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-lg h-7 text-xs" onClick={() => saveGeneratedPage(false)} disabled={isSaving}>
                <Save className="w-3 h-3" /> Salvar
              </Button>
              <Button size="sm" className="gap-1.5 rounded-lg h-7 text-xs font-bold" onClick={() => saveGeneratedPage(true)} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
                Publicar
              </Button>
            </>
          )}
          {mode === "edit-lp" && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-lg h-7 text-xs" onClick={restore}>
                <RotateCcw className="w-3 h-3" /> Restaurar
              </Button>
              <Button size="sm" onClick={saveLP} disabled={isSaving} className="gap-1.5 rounded-lg h-7 text-xs font-bold min-w-[90px]">
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Publicar
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel */}
        <div className="w-72 border-r border-border bg-background overflow-y-auto shrink-0 flex flex-col">
          {mode === "edit-lp" ? (
            /* Properties panel for LP editing */
            <div className="p-4 flex-1">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Layout className="w-3.5 h-3.5" /></div>
                <h3 className="font-bold text-xs uppercase tracking-wider">Propriedades</h3>
              </div>
              <div className="text-center py-8 px-3 border-2 border-dashed border-border/40 rounded-xl">
                <MousePointer2 className="w-6 h-6 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-[11px] text-muted-foreground">
                  {isEditMode ? "Clique em qualquer elemento no preview para editar." : "Ative o modo de edição para começar."}
                </p>
              </div>
            </div>
          ) : (
            /* Page Manager for generate mode */
            <div className="flex flex-col h-full">
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Sparkles className="w-3.5 h-3.5" /></div>
                  <h3 className="font-bold text-xs uppercase tracking-wider">Páginas Geradas</h3>
                </div>
                <input
                  type="text"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  placeholder="Título da nova página..."
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-xs focus:ring-2 focus:ring-primary/30 outline-none"
                />
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {pages.map((page) => (
                  <div
                    key={page.id}
                    className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                      activePage?.id === page.id ? "border-primary bg-primary/5" : "border-border/40 hover:border-border"
                    }`}
                    onClick={() => openGeneratedPage(page)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold truncate flex-1">{page.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${page.status === "published" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                        {page.status === "published" ? "LIVE" : "DRAFT"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <button onClick={(e) => { e.stopPropagation(); copySlug(page.slug); }}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
                        {copiedSlug === page.slug ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); togglePublish(page); }}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
                        <Globe className="w-3 h-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); window.open(`/p/${page.slug}`, "_blank"); }}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
                        <ExternalLink className="w-3 h-3" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); deletePage(page.id); }}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-destructive ml-auto">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {pages.length === 0 && (
                  <p className="text-[11px] text-muted-foreground text-center py-6">
                    Nenhuma página gerada ainda. Use o chat para criar!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden bg-secondary/20">
          <div className="flex-1 overflow-auto flex items-center justify-center p-6">
            <div className={`bg-background rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${viewportWidth}`}
              style={{ height: "calc(100vh - 200px)" }}>
              {mode === "edit-lp" ? (
                <iframe src="/" className="w-full h-full border-0" title="Preview LP" ref={iframeRef} />
              ) : generatedHtml ? (
                <iframe srcDoc={generatedHtml} className="w-full h-full border-0" title="Preview Gerada" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                  <Sparkles className="w-12 h-12 opacity-20" />
                  <div className="text-center">
                    <p className="text-sm font-medium mb-1">Nenhuma página no canvas</p>
                    <p className="text-xs opacity-70">Descreva no chat a página que deseja gerar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Chat (Right) */}
        <div className="w-80 border-l border-border bg-background flex flex-col shrink-0">
          <div className="h-12 border-b border-border flex items-center px-4">
            <Sparkles className="w-3.5 h-3.5 text-primary mr-2" />
            <h3 className="font-bold text-xs uppercase tracking-wider">
              {mode === "edit-lp" ? "IA Editor" : "IA Generator"}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-6 h-6 mx-auto mb-2 opacity-40" />
                <p className="text-[11px]">
                  {mode === "edit-lp"
                    ? 'Descreva mudanças para a LP. Ex: "Mude o fundo para azul escuro"'
                    : 'Descreva a página que deseja. Ex: "Landing page para consultoria financeira com tema dark e dourado"'}
                </p>
              </div>
            )}
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
                  msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-xs prose-invert max-w-none">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {(aiLoading || isGenerating) && (
              <div className="flex justify-start">
                <div className="bg-secondary px-3 py-2 rounded-xl">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                    <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="border-t border-border p-3 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleChatSubmit()}
              placeholder={mode === "edit-lp" ? "Descreva mudanças..." : "Descreva a página..."}
              className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-xs focus:ring-2 focus:ring-primary/30 outline-none"
              disabled={aiLoading || isGenerating}
            />
            <button
              onClick={handleChatSubmit}
              disabled={aiLoading || isGenerating || !chatInput.trim()}
              className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBuilderOmni;
