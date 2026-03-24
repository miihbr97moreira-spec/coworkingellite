import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Loader2, Monitor, Tablet, Smartphone, Type, Layout, Palette,
  MousePointer2, ChevronRight, ChevronLeft, Undo2, Redo2, Eye, Send,
  Trash2, Plus, Upload, Copy, RotateCcw, Zap, Settings, Image as ImageIcon,
  MessageCircle, Code, Layers, Lock, Unlock, Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { useLPConfig, useUpdateLPConfig } from "@/hooks/useSupabaseQuery";
import { useAIBuilder } from "@/hooks/useAIBuilder";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Index from "@/pages/Index";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface SelectedElement {
  type: string;
  path: string;
  data?: any;
}

const AdminBuilderOmni = () => {
  const { data: config, isLoading } = useLPConfig();
  const updateConfig = useUpdateLPConfig();
  const { processPrompt, isLoading: aiLoading } = useAIBuilder();

  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [localConfig, setLocalConfig] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isEditMode, setIsEditMode] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
      setHistory([config]);
      setHistoryIndex(0);
    }
  }, [config]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleUpdate = (key: string, value: any) => {
    const newConfig = {
      ...localConfig,
      [key]: value,
    };
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
    if (confirm("Deseja restaurar a Landing Page para o padrão original?")) {
      setLocalConfig(config);
      setHistory([config]);
      setHistoryIndex(0);
      toast.success("Landing Page restaurada para o padrão!");
    }
  };

  const saveAll = async () => {
    setIsSaving(true);
    try {
      for (const key of Object.keys(localConfig)) {
        await updateConfig.mutateAsync({ key, value: localConfig[key] });
      }
      toast.success("Landing Page publicada com sucesso!");
    } catch (error) {
      toast.error("Erro ao publicar alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");

    try {
      const aiResponse = await processPrompt(chatInput, localConfig);

      if (aiResponse) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: aiResponse.message,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);

        if (aiResponse.updatedConfig) {
          handleUpdate("_full", aiResponse.updatedConfig);
          toast.success("Alterações aplicadas pela IA!");
        }
      }
    } catch (error) {
      console.error("Erro ao comunicar com IA:", error);
      toast.error("Erro ao processar solicitação da IA");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of files) {
      try {
        const fileName = `${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from("gallery")
          .upload(fileName, file);

        if (error) throw error;

        const { data: publicUrl } = supabase.storage
          .from("gallery")
          .getPublicUrl(fileName);

        const currentGallery = localConfig.gallery || [];
        handleUpdate("gallery", [...currentGallery, { url: publicUrl.publicUrl, alt: file.name }]);

        toast.success("Imagem adicionada com sucesso!");
      } catch (error) {
        toast.error("Erro ao fazer upload da imagem");
      }
    }
  };

  const fonts = ["Inter", "Poppins", "Playfair Display", "Montserrat", "Space Grotesk"];
  const weights = [300, 400, 500, 600, 700, 800];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando Builder...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Barra de Ferramentas Superior */}
      <div className="h-16 border-b border-border bg-background flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/40">
            <button
              onClick={() => setViewport("desktop")}
              className={`p-2 rounded-lg transition-all ${
                viewport === "desktop" ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewport("tablet")}
              className={`p-2 rounded-lg transition-all ${
                viewport === "tablet" ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
              }`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewport("mobile")}
              className={`p-2 rounded-lg transition-all ${
                viewport === "mobile" ? "bg-background shadow-sm text-primary" : "text-muted-foreground"
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          <div className="h-6 w-px bg-border mx-2" />
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="h-6 w-px bg-border mx-2" />
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            onClick={() => setIsEditMode(!isEditMode)}
            className="gap-2 rounded-xl"
          >
            {isEditMode ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {isEditMode ? "Edição Ativa" : "Edição"}
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 rounded-xl"
            onClick={() => setShowChat(!showChat)}
          >
            <Sparkles className="w-4 h-4" /> IA Builder
          </Button>
          <Button
            variant="outline"
            className="gap-2 rounded-xl"
            onClick={restore}
          >
            <RotateCcw className="w-4 h-4" /> Restaurar
          </Button>
          <Button
            onClick={saveAll}
            disabled={isSaving}
            className="gap-2 rounded-xl font-bold min-w-[120px]"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Publicar
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Painel de Propriedades (Esquerda) */}
        <div className="w-80 border-r border-border bg-background overflow-y-auto p-6 custom-scrollbar shrink-0 z-10 shadow-lg">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Layout className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm uppercase tracking-wider">Propriedades</h3>
          </div>

          {!selectedElement ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-border/40 rounded-2xl">
              <MousePointer2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-xs text-muted-foreground font-medium">
                {isEditMode
                  ? "Clique em qualquer elemento no preview para editar suas propriedades."
                  : "Ative o modo de edição para começar."}
              </p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              {/* Edição de Texto */}
              {selectedElement.type === "text" && (
                <section>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-4 block tracking-widest">
                    Conteúdo
                  </label>
                  <textarea
                    value={selectedElement.data?.content || ""}
                    onChange={(e) =>
                      setSelectedElement({
                        ...selectedElement,
                        data: { ...selectedElement.data, content: e.target.value },
                      })
                    }
                    onBlur={() => {
                      if (selectedElement.data?.content) {
                        handleUpdate(selectedElement.path, selectedElement.data.content);
                      }
                    }}
                    className="w-full p-3 rounded-xl bg-secondary/50 border border-border/40 text-sm focus:ring-2 focus:ring-primary/30 outline-none min-h-[100px]"
                  />
                </section>
              )}

              {/* Edição de Cores */}
              {selectedElement.type === "color" && (
                <section>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-4 block tracking-widest">
                    Cor
                  </label>
                  <input
                    type="color"
                    value={selectedElement.data?.color || "#000000"}
                    onChange={(e) => {
                      setSelectedElement({
                        ...selectedElement,
                        data: { ...selectedElement.data, color: e.target.value },
                      });
                      handleUpdate(selectedElement.path, e.target.value);
                    }}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </section>
              )}

              {/* Edição de Tipografia */}
              {selectedElement.type === "typography" && (
                <section>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-4 block tracking-widest">
                    Tipografia
                  </label>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs mb-2 font-medium">Fonte</p>
                      <select className="w-full p-2 rounded-lg bg-secondary border border-border text-sm">
                        {fonts.map((f) => (
                          <option key={f} value={f}>
                            {f}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs mb-2 font-medium">Peso</p>
                      <select className="w-full p-2 rounded-lg bg-secondary border border-border text-sm">
                        {weights.map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="text-xs mb-2 font-medium">Tamanho</p>
                      <Slider
                        defaultValue={[16]}
                        min={12}
                        max={48}
                        step={1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </section>
              )}

              {/* Edição de Imagem */}
              {selectedElement.type === "image" && (
                <section>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-4 block tracking-widest">
                    Imagem
                  </label>
                  <div className="space-y-4">
                    <label className="flex items-center justify-center w-full p-4 border-2 border-dashed border-border/40 rounded-xl cursor-pointer hover:bg-secondary/30 transition-colors">
                      <div className="flex flex-col items-center gap-2">
                        <Upload className="w-5 h-5 text-muted-foreground" />
                        <span className="text-xs font-medium">Clique para fazer upload</span>
                      </div>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Canvas/Preview (Centro) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-secondary/30 relative">
          <div className="flex-1 overflow-auto flex items-center justify-center p-4 md:p-8">
            <div
              className={`bg-background rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 ${
                viewport === "desktop"
                  ? "w-full max-w-6xl"
                  : viewport === "tablet"
                  ? "w-full max-w-2xl"
                  : "w-full max-w-sm"
              }`}
              style={{ height: viewport === "desktop" ? "auto" : "80vh" }}
            >
              <div
                className={`relative ${isEditMode ? "cursor-crosshair" : ""}`}
                onClick={(e) => {
                  if (!isEditMode) return;
                  const target = (e.target as HTMLElement).closest(".editable-element") as HTMLElement;
                  if (target) {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedElement({
                      type: target.dataset.type || "text",
                      path: target.dataset.path || "",
                      data: { content: target.textContent },
                    });
                    toast.info(`Editando: ${target.dataset.path}`);
                  }
                }}
              >
                <div className="pointer-events-auto">
                  <Index />
                </div>
                {isEditMode && (
                  <div className="absolute inset-0 pointer-events-none border-4 border-primary/20 animate-pulse" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat IA (Direita) */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              className="w-96 border-l border-border bg-background flex flex-col shrink-0"
            >
              <div className="h-16 border-b border-border flex items-center justify-between px-6">
                <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> IA Builder
                </h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Descreva as mudanças que deseja fazer na Landing Page</p>
                  </div>
                )}
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-foreground"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <span className="text-xs opacity-70 mt-1 block">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary px-4 py-2 rounded-lg">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="h-20 border-t border-border p-4 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleChatSubmit()}
                  placeholder="Descreva as mudanças..."
                  className="flex-1 p-2 rounded-lg bg-secondary border border-border text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                />
                <button
                  onClick={handleChatSubmit}
                  disabled={aiLoading || !chatInput.trim()}
                  className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminBuilderOmni;
