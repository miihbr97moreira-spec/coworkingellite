import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Loader2, Monitor, Tablet, Smartphone, Layout,
  MousePointer2, Undo2, Redo2, Send, RotateCcw, Sparkles,
  Plus, FileText, Globe, Download, Trash2,
  ExternalLink, Eye, Copy, Check, Settings, Image, Link2,
  Type, Palette, X, Upload, MessageCircle, Key, Bot, Code
} from "lucide-react";
import { toast } from "sonner";
import { useLPConfig, useUpdateLPConfig } from "@/hooks/useSupabaseQuery";
import { useAIBuilder } from "@/hooks/useAIBuilder";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

/* ───────── types ───────── */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface GenPage {
  id: string;
  slug: string;
  title: string;
  html_content: string;
  status: string;
  created_at: string;
  meta_pixel_id?: string;
  ga_id?: string;
}

interface SelectedElement {
  tagName: string;
  text: string;
  src?: string;
  href?: string;
  classes: string;
  xpath: string;
  isImage: boolean;
  isLink: boolean;
}

type BuilderMode = "edit-lp" | "generate" | "edit-generated";

/* ───────── BYOK storage helpers ───────── */
const BYOK_KEY = "ellite_byok";
interface BYOKConfig {
  enabled: boolean;
  provider: string;
  apiKey: string;
  model: string;
}
const defaultBYOK: BYOKConfig = { enabled: false, provider: "openai", apiKey: "", model: "gpt-4o" };
const loadBYOK = (): BYOKConfig => {
  try { return { ...defaultBYOK, ...JSON.parse(localStorage.getItem(BYOK_KEY) || "{}") }; } catch { return defaultBYOK; }
};
const saveBYOK = (c: BYOKConfig) => localStorage.setItem(BYOK_KEY, JSON.stringify(c));

/* ───────── raw canvas script (no <script> tags) ───────── */
const CANVAS_SCRIPT_RAW = `
(function(){
  if(window.__builderInjected) return;
  window.__builderInjected = true;
  document.addEventListener('click', function(e){
    var el = e.target.closest('a,button,[onclick]');
    if(el){ e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }
    var t = e.target;
    document.querySelectorAll('[data-builder-selected]').forEach(function(s){
      s.style.outline=''; s.removeAttribute('data-builder-selected');
    });
    t.style.outline='2px solid #FBBF24';
    t.setAttribute('data-builder-selected','1');
    function xpath(node){
      if(!node||node===document.body) return '/body';
      var idx=0,sib=node.parentNode?node.parentNode.childNodes:[];
      for(var i=0;i<sib.length;i++){if(sib[i]===node)break;if(sib[i].nodeType===1&&sib[i].tagName===node.tagName)idx++;}
      return xpath(node.parentNode)+'/'+node.tagName.toLowerCase()+'['+idx+']';
    }
    var info={
      tagName:t.tagName,
      text:t.innerText||'',
      src:t.src||t.querySelector('img')?.src||'',
      href:t.href||t.closest('a')?.href||'',
      classes:t.className||'',
      xpath:xpath(t),
      isImage:t.tagName==='IMG'||!!t.querySelector('img'),
      isLink:t.tagName==='A'||t.tagName==='BUTTON'||!!t.closest('a'),
      configPath: t.getAttribute('data-path') || t.closest('[data-path]')?.getAttribute('data-path') || ''
    };
    window.parent.postMessage({type:'BUILDER_SELECT',payload:info},'*');
  }, true);
  window.addEventListener('message', function(e){
    if(!e.data||!e.data.type) return;
    var d=e.data;
    if(d.type==='BUILDER_UPDATE_TEXT'){
      var el=document.querySelector('[data-builder-selected]');
      if(el) el.innerText=d.value;
    }
    if(d.type==='BUILDER_UPDATE_SRC'){
      var el=document.querySelector('[data-builder-selected]');
      if(el){if(el.tagName==='IMG')el.src=d.value;else{var img=el.querySelector('img');if(img)img.src=d.value;}}
    }
    if(d.type==='BUILDER_UPDATE_HREF'){
      var el=document.querySelector('[data-builder-selected]');
      if(el){if(el.tagName==='A')el.href=d.value;else{var a=el.closest('a');if(a)a.href=d.value;}}
    }
    if(d.type==='BUILDER_ADD_CLASS'){
      var el=document.querySelector('[data-builder-selected]');
      if(el) el.classList.add(d.value);
    }
    if(d.type==='BUILDER_REMOVE_CLASS'){
      var el=document.querySelector('[data-builder-selected]');
      if(el) el.classList.remove(d.value);
    }
    if(d.type==='BUILDER_SET_STYLE'){
      var el=document.querySelector('[data-builder-selected]');
      if(el) el.style[d.prop]=d.value;
    }
    if(d.type==='BUILDER_DELETE'){
      var el=document.querySelector('[data-builder-selected]');
      if(el) el.remove();
    }
    if(d.type==='BUILDER_GET_HTML'){
      document.querySelectorAll('[data-builder-selected]').forEach(function(s){
        s.style.outline=''; s.removeAttribute('data-builder-selected');
      });
      window.parent.postMessage({type:'BUILDER_HTML',html:document.documentElement.outerHTML},'*');
    }
  });
})();`;

const CANVAS_SCRIPT = `<script>${CANVAS_SCRIPT_RAW}<\/script>`;

/* ───────── helper: inject script into HTML ───────── */
function injectScript(html: string): string {
  if (!html) return html;
  if (html.includes("__builderInjected")) return html;
  if (html.includes("</body>")) return html.replace("</body>", CANVAS_SCRIPT + "</body>");
  if (html.includes("</html>")) return html.replace("</html>", CANVAS_SCRIPT + "</html>");
  return html + CANVAS_SCRIPT;
}

/* ───────── helper: clean AI response ───────── */
function cleanAIPayload(raw: string): { html: string; title: string } {
  let s = raw.trim();
  const mdMatch = s.match(/```(?:html|json)?\s*\n?([\s\S]*?)```/);
  if (mdMatch) s = mdMatch[1].trim();
  try {
    const j = JSON.parse(s);
    if (j.html) return { html: j.html, title: j.title || "" };
  } catch {}
  const jsonField = s.match(/"html"\s*:\s*"([\s\S]*?)"\s*[,}]/);
  if (jsonField) {
    try { return { html: JSON.parse(`"${jsonField[1]}"`), title: "" }; } catch {}
  }
  if (s.includes("<") && (s.includes("<!DOCTYPE") || s.includes("<html") || s.includes("<div") || s.includes("<section"))) {
    return { html: s, title: "" };
  }
  return { html: s, title: "" };
}

/* ═══════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════ */
const AdminBuilderOmni = () => {
  const { data: config, isLoading } = useLPConfig();
  const updateConfig = useUpdateLPConfig();
  const { processPrompt, generatePage, isLoading: aiLoading } = useAIBuilder();

  /* ── core state ── */
  const [mode, setMode] = useState<BuilderMode>("edit-lp");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [localConfig, setLocalConfig] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lpHtml, setLpHtml] = useState<string | null>(null); // captured LP HTML for click-to-edit

  /* ── chat ── */
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");

  /* ── history / time machine ── */
  const [htmlHistory, setHtmlHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [configHistory, setConfigHistory] = useState<any[]>([]);
  const [configIdx, setConfigIdx] = useState(-1);

  /* ── generated pages ── */
  const [pages, setPages] = useState<GenPage[]>([]);
  const [activePage, setActivePage] = useState<GenPage | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  /* ── canvas selection ── */
  const [selectedEl, setSelectedEl] = useState<SelectedElement | null>(null);
  const [editText, setEditText] = useState("");
  const [editSrc, setEditSrc] = useState("");
  const [editHref, setEditHref] = useState("");
  const [linkAction, setLinkAction] = useState<"url" | "anchor" | "whatsapp">("url");
  const [waNumber, setWaNumber] = useState("");
  const [waMessage, setWaMessage] = useState("");

  /* ── BYOK ── */
  const [byokOpen, setBYOKOpen] = useState(false);
  const [byok, setBYOK] = useState<BYOKConfig>(loadBYOK);

  /* ── pixel per page ── */
  const [pagePixelOpen, setPagePixelOpen] = useState(false);
  const [pageMetaPixel, setPageMetaPixel] = useState("");
  const [pageGaId, setPageGaId] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── load config ── */
  useEffect(() => {
    if (config) {
      setLocalConfig(config);
      setConfigHistory([config]);
      setConfigIdx(0);
    }
  }, [config]);

  /* ── load pages ── */
  useEffect(() => { loadPages(); }, []);

  /* ── scroll chat ── */
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  /* ── listen for canvas messages ── */
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e.data?.type) return;
      if (e.data.type === "BUILDER_SELECT") {
        const p = e.data.payload as SelectedElement & { configPath?: string };
        setSelectedEl(p);
        setEditText(p.text || "");
        setEditSrc(p.src || "");
        setEditHref(p.href || "");
        if (p.href?.includes("wa.me")) {
          setLinkAction("whatsapp");
          const m = p.href.match(/wa\.me\/(\d+)/);
          if (m) setWaNumber(m[1]);
          const t = p.href.match(/text=([^&]*)/);
          if (t) setWaMessage(decodeURIComponent(t[1]));
        } else if (p.href?.startsWith("#")) {
          setLinkAction("anchor");
        } else {
          setLinkAction("url");
        }
      }
      if (e.data.type === "BUILDER_HTML") {
        const html = e.data.html as string;
        if (mode === "edit-lp") {
          setLpHtml(html);
        } else {
          setGeneratedHtml(html);
        }
        pushHtmlHistory(html);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [mode]);

  /* ── inject canvas script into LP iframe on load ── */
  const handleLPIframeLoad = useCallback(() => {
    if (mode !== "edit-lp") return;
    try {
      const doc = iframeRef.current?.contentDocument;
      if (doc && !doc.querySelector('[data-builder-script]')) {
        const script = doc.createElement("script");
        script.setAttribute("data-builder-script", "1");
        script.textContent = CANVAS_SCRIPT_RAW;
        doc.body.appendChild(script);
      }
    } catch (err) {
      console.warn("Cannot inject into LP iframe (cross-origin?):", err);
    }
  }, [mode]);

  /* ── push history ── */
  const pushHtmlHistory = useCallback((html: string) => {
    setHtmlHistory(prev => {
      const next = [...prev.slice(0, historyIdx + 1), html];
      setHistoryIdx(next.length - 1);
      return next;
    });
  }, [historyIdx]);

  /* ── undo/redo for generated pages ── */
  const undoHtml = () => {
    if (historyIdx > 0) {
      const idx = historyIdx - 1;
      setHistoryIdx(idx);
      setGeneratedHtml(htmlHistory[idx]);
    }
  };
  const redoHtml = () => {
    if (historyIdx < htmlHistory.length - 1) {
      const idx = historyIdx + 1;
      setHistoryIdx(idx);
      setGeneratedHtml(htmlHistory[idx]);
    }
  };

  /* ── undo/redo for LP config ── */
  const undoConfig = () => {
    if (configIdx > 0) {
      setConfigIdx(configIdx - 1);
      setLocalConfig(configHistory[configIdx - 1]);
    }
  };
  const redoConfig = () => {
    if (configIdx < configHistory.length - 1) {
      setConfigIdx(configIdx + 1);
      setLocalConfig(configHistory[configIdx + 1]);
    }
  };

  const restoreConfig = () => {
    if (confirm("Restaurar configuração original?")) {
      setLocalConfig(config);
      setConfigHistory([config]);
      setConfigIdx(0);
      setLpHtml(null);
      toast.success("Restaurado!");
    }
  };

  /* ── pages CRUD ── */
  const loadPages = async () => {
    const { data } = await supabase
      .from("generated_pages")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setPages(data as GenPage[]);
  };

  const saveGeneratedPage = async (publish = false) => {
    if (!generatedHtml) return;
    setIsSaving(true);
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: "BUILDER_GET_HTML" }, "*");
      await new Promise(r => setTimeout(r, 200));

      const slug = newPageSlug.trim()
        ? newPageSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-|-$/g, "")
        : (newPageTitle || "pagina")
            .toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

      const { data: user } = await supabase.auth.getUser();
      const cleanHtml = generatedHtml.replace(/<script[^>]*data-builder-script[^>]*>[\s\S]*?<\/script>/g, "")
        .replace(/<script>[\s\S]*?__builderInjected[\s\S]*?<\/script>/g, "");

      if (activePage) {
        await supabase.from("generated_pages").update({
          html_content: cleanHtml,
          title: newPageTitle || activePage.title,
          slug: newPageSlug.trim() || activePage.slug,
          status: publish ? "published" : activePage.status,
          meta_pixel_id: pageMetaPixel,
          ga_id: pageGaId,
        }).eq("id", activePage.id);
        toast.success(publish ? "Publicada!" : "Salva!");
      } else {
        const { error } = await supabase.from("generated_pages").insert({
          slug, title: newPageTitle || "Nova Página",
          html_content: cleanHtml,
          status: publish ? "published" : "draft",
          created_by: user?.user?.id,
          meta_pixel_id: pageMetaPixel,
          ga_id: pageGaId,
        });
        if (error) throw error;
        toast.success(publish ? "Criada e publicada!" : "Rascunho salvo!");
      }
      await loadPages();
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar.");
    } finally {
      setIsSaving(false);
    }
  };

  const deletePage = async (id: string) => {
    if (!confirm("Excluir?")) return;
    await supabase.from("generated_pages").delete().eq("id", id);
    if (activePage?.id === id) { setActivePage(null); setGeneratedHtml(""); }
    await loadPages();
    toast.success("Excluída.");
  };

  const togglePublish = async (page: GenPage) => {
    const s = page.status === "published" ? "draft" : "published";
    await supabase.from("generated_pages").update({ status: s }).eq("id", page.id);
    await loadPages();
    toast.success(s === "published" ? "Publicada!" : "Despublicada.");
  };

  const openPage = (page: GenPage) => {
    setActivePage(page);
    const html = injectScript(page.html_content);
    setGeneratedHtml(html);
    setNewPageTitle(page.title);
    setNewPageSlug(page.slug);
    setPageMetaPixel(page.meta_pixel_id || "");
    setPageGaId(page.ga_id || "");
    setHtmlHistory([html]);
    setHistoryIdx(0);
    setMode("edit-generated");
    setSelectedEl(null);
  };

  const copySlug = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
    toast.success("Link copiado!");
  };

  const exportHtml = () => {
    const clean = generatedHtml.replace(/<script[^>]*data-builder-script[^>]*>[\s\S]*?<\/script>/g, "")
      .replace(/<script>[\s\S]*?__builderInjected[\s\S]*?<\/script>/g, "");
    const blob = new Blob([clean], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${newPageTitle || "pagina"}.html`;
    a.click();
  };

  /* ── save LP config ── */
  const saveLP = async () => {
    setIsSaving(true);
    try {
      // 1. Request latest HTML from canvas to ensure we have the most recent edits
      sendToCanvas({ type: 'BUILDER_GET_HTML' });
      
      // 2. Wait for the message to return and update lpHtml
      await new Promise(resolve => setTimeout(resolve, 800));

      // 3. Save structured config (for components like HeroSection)
      const keys = Object.keys(localConfig);
      for (const key of keys) {
        const { error } = await supabase
          .from('landing_page_config')
          .update({ value: localConfig[key] })
          .eq('key', key);
        
        if (error) throw error;
      }

      // 4. Also save the full HTML as a fallback/override if needed
      if (lpHtml) {
        await supabase
          .from('landing_page_config')
          .upsert({ key: 'custom_html', value: lpHtml }, { onConflict: 'key' });
      }

      toast.success("Landing Page publicada com sucesso!");
    } catch (err) { 
      console.error("Erro ao salvar LP:", err);
      toast.error("Erro ao salvar as alterações."); 
    } finally { setIsSaving(false); }
  };

  /* ── canvas mutations ── */
  const sendToCanvas = (msg: any) => iframeRef.current?.contentWindow?.postMessage(msg, "*");

  const updateLocalConfigByPath = (path: string, value: any) => {
    const keys = path.split('.');
    const newConfig = { ...localConfig };
    let current = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setLocalConfig(newConfig);
  };

  const applyText = () => { 
    sendToCanvas({ type: "BUILDER_UPDATE_TEXT", value: editText });
    if ((selectedEl as any)?.configPath) {
      updateLocalConfigByPath((selectedEl as any).configPath, editText);
    }
  };
  const applySrc = () => { 
    sendToCanvas({ type: "BUILDER_UPDATE_SRC", value: editSrc });
    if ((selectedEl as any)?.configPath) {
      updateLocalConfigByPath((selectedEl as any).configPath, editSrc);
    }
  };
  const applyHref = () => {
    let href = editHref;
    if (linkAction === "whatsapp") {
      href = `https://wa.me/${waNumber.replace(/\D/g, "")}?text=${encodeURIComponent(waMessage)}`;
    } else if (linkAction === "anchor") {
      href = editHref.startsWith("#") ? editHref : `#${editHref}`;
    }
    sendToCanvas({ type: "BUILDER_UPDATE_HREF", value: href });
    if ((selectedEl as any)?.configPath) {
      updateLocalConfigByPath((selectedEl as any).configPath, href);
    }
  };
  const applyStyle = (prop: string, value: string) => sendToCanvas({ type: "BUILDER_SET_STYLE", prop, value });
  const deleteEl = () => { sendToCanvas({ type: "BUILDER_DELETE" }); setSelectedEl(null); };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setEditSrc(dataUrl);
      sendToCanvas({ type: "BUILDER_UPDATE_SRC", value: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  /* ── AI chat submit ── */
  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: chatInput, timestamp: new Date() };
    setChatMessages(prev => [...prev, userMsg]);
    const input = chatInput;
    setChatInput("");

    if (mode === "generate" || mode === "edit-generated") {
      setIsGenerating(true);
      let fullRaw = "";
      await generatePage(input, (delta) => {
        fullRaw += delta;
        const { html } = cleanAIPayload(fullRaw);
        if (html.includes("<")) setGeneratedHtml(injectScript(html));
      }, () => {
        setIsGenerating(false);
        const { html, title } = cleanAIPayload(fullRaw);
        const final = injectScript(html);
        setGeneratedHtml(final);
        pushHtmlHistory(final);
        if (title) setNewPageTitle(title);
        setChatMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), role: "assistant",
          content: "✅ Página gerada! Clique em qualquer elemento no canvas para editar, ou salve quando pronta.",
          timestamp: new Date(),
        }]);
      });
    } else {
      // LP edit mode - also use generatePage to get full HTML modifications
      setIsGenerating(true);
      let fullRaw = "";
      const editPrompt = `O usuário quer editar a landing page atual. Pedido: "${input}". 
Gere o HTML COMPLETO atualizado da landing page com as modificações solicitadas. Mantenha o design existente e aplique APENAS as mudanças pedidas.`;
      
      await generatePage(editPrompt, (delta) => {
        fullRaw += delta;
        const { html } = cleanAIPayload(fullRaw);
        if (html.includes("<")) {
          const injected = injectScript(html);
          setLpHtml(injected);
        }
      }, () => {
        setIsGenerating(false);
        const { html } = cleanAIPayload(fullRaw);
        if (html.includes("<")) {
          const injected = injectScript(html);
          setLpHtml(injected);
          pushHtmlHistory(injected);
          setChatMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(), role: "assistant",
            content: "✅ Alterações aplicadas na LP! Clique nos elementos para editar manualmente.",
            timestamp: new Date(),
          }]);
        } else {
          setChatMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(), role: "assistant",
            content: "Não consegui aplicar as mudanças. Tente ser mais específico.",
            timestamp: new Date(),
          }]);
        }
      });
    }
  };

  /* ── BYOK save ── */
  const saveBYOKConfig = () => {
    saveBYOK(byok);
    setBYOKOpen(false);
    toast.success(byok.enabled ? "Chave API própria ativada!" : "Usando IA nativa.");
  };

  /* ── viewport width ── */
  const vpW = viewport === "desktop" ? "w-full max-w-6xl" : viewport === "tablet" ? "w-full max-w-2xl" : "w-full max-w-sm";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando Builder...
      </div>
    );
  }

  /* ── Element Inspector (shared between modes) ── */
  const renderElementInspector = () => {
    if (!selectedEl) return null;
    return (
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs uppercase tracking-wider text-primary">Elemento Selecionado</h4>
          <button onClick={() => setSelectedEl(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
        </div>
        <p className="text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded font-mono">&lt;{selectedEl.tagName.toLowerCase()}&gt;</p>

        {/* Text editing */}
        {!selectedEl.isImage && (
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-1"><Type className="w-3 h-3" /> Texto</label>
            <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2}
              className="w-full px-2 py-1.5 rounded-md bg-secondary/50 border border-border/40 text-xs focus:ring-1 focus:ring-primary/30 outline-none resize-none" />
            <Button size="sm" variant="outline" onClick={applyText} className="w-full mt-1 h-6 text-[10px]">Aplicar Texto</Button>
          </div>
        )}

        {/* Image editing */}
        {selectedEl.isImage && (
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-1"><Image className="w-3 h-3" /> Imagem</label>
            <input value={editSrc} onChange={e => setEditSrc(e.target.value)} placeholder="URL da imagem..."
              className="w-full px-2 py-1.5 rounded-md bg-secondary/50 border border-border/40 text-xs focus:ring-1 focus:ring-primary/30 outline-none mb-1" />
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={applySrc} className="flex-1 h-6 text-[10px]">Aplicar URL</Button>
              <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="h-6 text-[10px] gap-1">
                <Upload className="w-3 h-3" /> Upload
              </Button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>
        )}

        {/* Link/CTA editing */}
        {selectedEl.isLink && (
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-1"><Link2 className="w-3 h-3" /> Ação do Link</label>
            <div className="flex gap-1 mb-2">
              {(["url", "anchor", "whatsapp"] as const).map(a => (
                <button key={a} onClick={() => setLinkAction(a)}
                  className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${linkAction === a ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"}`}>
                  {a === "url" ? "URL" : a === "anchor" ? "Âncora" : "WhatsApp"}
                </button>
              ))}
            </div>
            {linkAction === "url" && (
              <input value={editHref} onChange={e => setEditHref(e.target.value)} placeholder="https://..."
                className="w-full px-2 py-1.5 rounded-md bg-secondary/50 border border-border/40 text-xs outline-none" />
            )}
            {linkAction === "anchor" && (
              <input value={editHref} onChange={e => setEditHref(e.target.value)} placeholder="#secao-id"
                className="w-full px-2 py-1.5 rounded-md bg-secondary/50 border border-border/40 text-xs outline-none" />
            )}
            {linkAction === "whatsapp" && (
              <div className="space-y-1">
                <input value={waNumber} onChange={e => setWaNumber(e.target.value)} placeholder="5511999999999"
                  className="w-full px-2 py-1.5 rounded-md bg-secondary/50 border border-border/40 text-xs outline-none" />
                <textarea value={waMessage} onChange={e => setWaMessage(e.target.value)} placeholder="Mensagem automática..."
                  rows={2} className="w-full px-2 py-1.5 rounded-md bg-secondary/50 border border-border/40 text-xs outline-none resize-none" />
              </div>
            )}
            <Button size="sm" variant="outline" onClick={applyHref} className="w-full mt-1 h-6 text-[10px]">Aplicar Link</Button>
          </div>
        )}

        {/* Style controls */}
        <div>
          <label className="text-[10px] font-semibold text-muted-foreground flex items-center gap-1 mb-1"><Palette className="w-3 h-3" /> Estilos Rápidos</label>
          <div className="grid grid-cols-2 gap-1">
            <div>
              <span className="text-[9px] text-muted-foreground">Cor texto</span>
              <input type="color" defaultValue="#ffffff" onChange={e => applyStyle("color", e.target.value)}
                className="w-full h-6 rounded cursor-pointer bg-transparent" />
            </div>
            <div>
              <span className="text-[9px] text-muted-foreground">Cor fundo</span>
              <input type="color" defaultValue="#000000" onChange={e => applyStyle("backgroundColor", e.target.value)}
                className="w-full h-6 rounded cursor-pointer bg-transparent" />
            </div>
            <div>
              <span className="text-[9px] text-muted-foreground">Font Size</span>
              <select onChange={e => applyStyle("fontSize", e.target.value)} defaultValue=""
                className="w-full px-1 py-1 rounded bg-secondary/50 border border-border/40 text-[10px]">
                <option value="" disabled>—</option>
                {["12px","14px","16px","18px","20px","24px","28px","32px","36px","48px","64px"].map(s =>
                  <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <span className="text-[9px] text-muted-foreground">Font Weight</span>
              <select onChange={e => applyStyle("fontWeight", e.target.value)} defaultValue=""
                className="w-full px-1 py-1 rounded bg-secondary/50 border border-border/40 text-[10px]">
                <option value="" disabled>—</option>
                {["300","400","500","600","700","800","900"].map(w =>
                  <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Delete element */}
        <Button size="sm" variant="destructive" onClick={deleteEl} className="w-full h-6 text-[10px] gap-1">
          <Trash2 className="w-3 h-3" /> Remover Elemento
        </Button>
      </div>
    );
  };

  /* ═══════ RENDER ═══════ */
  return (
    <div className="h-[calc(100vh-120px)] flex flex-col -m-6 bg-background">
      {/* ─── Top Toolbar ─── */}
      <div className="h-14 border-b border-border bg-background flex items-center justify-between px-4 shrink-0 z-10">
        <div className="flex items-center gap-2">
          {/* Mode */}
          <div className="flex bg-secondary/50 p-0.5 rounded-lg border border-border/40 text-xs">
            <button onClick={() => { setMode("edit-lp"); setActivePage(null); setGeneratedHtml(""); setSelectedEl(null); }}
              className={`px-3 py-1.5 rounded-md transition-all font-medium ${mode === "edit-lp" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <FileText className="w-3.5 h-3.5 inline mr-1.5" />LP Atual
            </button>
            <button onClick={() => { setMode("generate"); setSelectedEl(null); setLpHtml(null); }}
              className={`px-3 py-1.5 rounded-md transition-all font-medium ${mode !== "edit-lp" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
              <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />✨ Gerar Nova
            </button>
          </div>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Viewport */}
          <div className="flex bg-secondary/50 p-0.5 rounded-lg border border-border/40">
            {([["desktop", Monitor], ["tablet", Tablet], ["mobile", Smartphone]] as const).map(([v, Icon]) => (
              <button key={v} onClick={() => setViewport(v as any)}
                className={`p-1.5 rounded-md transition-all ${viewport === v ? "bg-background shadow-sm text-primary" : "text-muted-foreground"}`}>
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Undo/Redo */}
          <div className="flex gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={mode === "edit-lp" ? undoConfig : undoHtml}
              disabled={mode === "edit-lp" ? configIdx <= 0 : historyIdx <= 0}>
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7"
              onClick={mode === "edit-lp" ? redoConfig : redoHtml}
              disabled={mode === "edit-lp" ? configIdx >= configHistory.length - 1 : historyIdx >= htmlHistory.length - 1}>
              <Redo2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {mode === "edit-lp" && (
            <>
              <div className="h-5 w-px bg-border mx-1" />
              <Button variant="outline" size="sm" onClick={restoreConfig} className="gap-1.5 rounded-lg h-7 text-xs">
                <RotateCcw className="w-3 h-3" /> Restaurar
              </Button>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setBYOKOpen(true)} title="Configurar IA">
            <Key className="w-3.5 h-3.5" />
          </Button>

          {mode !== "edit-lp" && generatedHtml && (
            <>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-lg h-7 text-xs" onClick={() => setPagePixelOpen(true)}>
                <Code className="w-3 h-3" /> Pixels
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-lg h-7 text-xs" onClick={exportHtml}>
                <Download className="w-3 h-3" /> Exportar
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-lg h-7 text-xs" onClick={() => saveGeneratedPage(false)} disabled={isSaving}>
                <Save className="w-3 h-3" /> Salvar
              </Button>
              <Button size="sm" className="gap-1.5 rounded-lg h-7 text-xs font-bold" onClick={() => saveGeneratedPage(true)} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />} Publicar
              </Button>
            </>
          )}
          {mode === "edit-lp" && (
            <Button size="sm" onClick={saveLP} disabled={isSaving} className="gap-1.5 rounded-lg h-7 text-xs font-bold min-w-[90px]">
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Publicar
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ─── Left Panel: Properties / Page Manager ─── */}
        <div className="w-72 border-r border-border bg-background overflow-y-auto shrink-0 flex flex-col">
          {/* Element inspector - always shown when element selected */}
          {renderElementInspector()}

          {mode === "edit-lp" ? (
            <div className="p-4 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Layout className="w-3.5 h-3.5" /></div>
                <h3 className="font-bold text-xs uppercase tracking-wider">LP Atual</h3>
              </div>
              {!selectedEl && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
                  <p className="text-[11px] text-muted-foreground">
                    <MousePointer2 className="w-3 h-3 inline mr-1 text-primary" />
                    Clique em qualquer elemento no canvas para editar texto, imagens, links, cores e mais.
                  </p>
                </div>
              )}
              <div className="space-y-3">
                {Object.entries(localConfig).slice(0, 8).map(([key, val]) => (
                  <div key={key} className="text-xs">
                    <label className="text-muted-foreground font-medium block mb-1 capitalize">{key.replace(/_/g, " ")}</label>
                    {typeof val === "string" && val.length < 100 ? (
                      <input value={val as string}
                        onChange={e => {
                          const nc = { ...localConfig, [key]: e.target.value };
                          setLocalConfig(nc);
                          const next = [...configHistory.slice(0, configIdx + 1), nc];
                          setConfigHistory(next); setConfigIdx(next.length - 1);
                        }}
                        className="w-full px-2 py-1.5 rounded-md bg-secondary/50 border border-border/40 text-xs focus:ring-1 focus:ring-primary/30 outline-none" />
                    ) : (
                      <p className="text-muted-foreground/50 truncate">{JSON.stringify(val).slice(0, 60)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col flex-1">
              {/* Page title & slug inputs */}
              <div className="p-4 border-b border-border space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-primary/10 rounded-lg text-primary"><Sparkles className="w-3.5 h-3.5" /></div>
                  <h3 className="font-bold text-xs uppercase tracking-wider">Páginas</h3>
                </div>
                <input value={newPageTitle} onChange={e => setNewPageTitle(e.target.value)}
                  placeholder="Título da página..." className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-xs focus:ring-2 focus:ring-primary/30 outline-none" />
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <span>/p/</span>
                  <input value={newPageSlug} onChange={e => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                    placeholder="slug-personalizado" className="flex-1 px-2 py-1 rounded bg-secondary/50 border border-border/40 text-xs focus:ring-1 focus:ring-primary/30 outline-none" />
                </div>
              </div>

              {/* Page list */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {pages.map(page => (
                  <div key={page.id}
                    className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${activePage?.id === page.id ? "border-primary bg-primary/5" : "border-border/40 hover:border-border"}`}
                    onClick={() => openPage(page)}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold truncate flex-1">{page.title}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${page.status === "published" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                        {page.status === "published" ? "LIVE" : "DRAFT"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">/p/{page.slug}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <button onClick={e => { e.stopPropagation(); copySlug(page.slug); }}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
                        {copiedSlug === page.slug ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      </button>
                      <button onClick={e => { e.stopPropagation(); togglePublish(page); }}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
                        {page.status === "published" ? <Eye className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                      </button>
                      <button onClick={e => { e.stopPropagation(); window.open(`/p/${page.slug}`, "_blank"); }}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
                        <ExternalLink className="w-3 h-3" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); deletePage(page.id); }}
                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-destructive ml-auto">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                {pages.length === 0 && (
                  <p className="text-[11px] text-muted-foreground text-center py-6">Use o chat para criar sua primeira página!</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Canvas ─── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-secondary/20">
          <div className="flex-1 overflow-auto flex items-center justify-center p-6">
            <div className={`bg-background rounded-xl shadow-2xl overflow-hidden transition-all duration-300 ${vpW}`}
              style={{ height: "calc(100vh - 200px)" }}>
              {mode === "edit-lp" ? (
                lpHtml ? (
                  <iframe srcDoc={lpHtml} className="w-full h-full border-0" title="Preview LP" ref={iframeRef}
                    sandbox="allow-scripts allow-same-origin" />
                ) : (
                  <iframe src="/" className="w-full h-full border-0" title="Preview LP" ref={iframeRef}
                    onLoad={handleLPIframeLoad} />
                )
              ) : generatedHtml ? (
                <iframe srcDoc={generatedHtml} className="w-full h-full border-0" title="Preview" ref={iframeRef}
                  sandbox="allow-scripts allow-same-origin" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground gap-4">
                  <Sparkles className="w-12 h-12 opacity-20" />
                  <div className="text-center">
                    <p className="text-sm font-medium mb-1">Nenhuma página no canvas</p>
                    <p className="text-xs opacity-70 mb-4">Descreva no chat a página que deseja gerar</p>
                    {mode === "edit-lp" && (
                      <Button variant="outline" size="sm" onClick={() => setLpHtml(null)} className="gap-2">
                        <RotateCcw className="w-3 h-3" /> Recarregar LP Original
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── AI Chat (Right) ─── */}
        <div className="w-80 border-l border-border bg-background flex flex-col shrink-0">
          <div className="h-12 border-b border-border flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <h3 className="font-bold text-xs uppercase tracking-wider">
                {mode === "edit-lp" ? "IA Editor" : "IA Builder"}
              </h3>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
              {byok.enabled ? byok.provider : "Nativa"}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Bot className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-xs font-medium mb-2">
                  {mode === "edit-lp" ? "Editor de LP via IA" : "Gerador de Páginas"}
                </p>
                <p className="text-[11px] opacity-70">
                  {mode === "edit-lp"
                    ? 'Ex: "Mude o fundo para azul escuro"'
                    : 'Ex: "Landing page para clínica odontológica premium com tema dark, animações e seção de depoimentos"'}
                </p>
                {mode !== "edit-lp" && (
                  <div className="mt-4 space-y-1">
                    {["Landing page para consultoria financeira", "Loja de roupas com catálogo visual", "Site para restaurante com cardápio"].map(s => (
                      <button key={s} onClick={() => setChatInput(s)}
                        className="block w-full text-left px-3 py-2 rounded-lg bg-secondary/50 text-[10px] text-foreground hover:bg-secondary transition-colors">
                        ✨ {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-xs prose-invert max-w-none [&_p]:mb-1 [&_ul]:mb-1">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : <p>{msg.content}</p>}
                </div>
              </div>
            ))}
            {(aiLoading || isGenerating) && (
              <div className="flex justify-start">
                <div className="bg-secondary px-3 py-2 rounded-xl flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  <span className="text-[10px] text-muted-foreground">{isGenerating ? "Gerando..." : "Processando..."}</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="border-t border-border p-3">
            <div className="flex gap-2">
              <textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSubmit(); } }}
                placeholder={mode === "edit-lp" ? "Descreva mudanças na LP..." : "Descreva a página que deseja criar..."}
                rows={2}
                className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-xs focus:ring-2 focus:ring-primary/30 outline-none resize-none"
                disabled={aiLoading || isGenerating} />
              <button onClick={handleChatSubmit} disabled={aiLoading || isGenerating || !chatInput.trim()}
                className="self-end p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── BYOK Modal ─── */}
      <Dialog open={byokOpen} onOpenChange={setBYOKOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Key className="w-4 h-4 text-primary" /> Configuração de IA</DialogTitle>
            <DialogDescription>Escolha entre a IA nativa ou sua própria chave API.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Usar chave própria (BYOK)</label>
              <button onClick={() => setBYOK(p => ({ ...p, enabled: !p.enabled }))}
                className={`w-11 h-6 rounded-full transition-colors ${byok.enabled ? "bg-primary" : "bg-secondary"} relative`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform ${byok.enabled ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>
            {byok.enabled && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Provedor</label>
                  <select value={byok.provider} onChange={e => setBYOK(p => ({ ...p, provider: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm">
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="groq">Groq</option>
                    <option value="openrouter">OpenRouter</option>
                    <option value="gemini">Google Gemini</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">API Key</label>
                  <input type="password" value={byok.apiKey} onChange={e => setBYOK(p => ({ ...p, apiKey: e.target.value }))}
                    placeholder="sk-..." className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Modelo</label>
                  <input value={byok.model} onChange={e => setBYOK(p => ({ ...p, model: e.target.value }))}
                    placeholder="gpt-4o" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm" />
                </div>
              </>
            )}
            <Button onClick={saveBYOKConfig} className="w-full">Salvar Configuração</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Pixel per Page Modal ─── */}
      <Dialog open={pagePixelOpen} onOpenChange={setPagePixelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Code className="w-4 h-4 text-primary" /> Pixels desta Página</DialogTitle>
            <DialogDescription>Configure pixels de rastreamento individuais para esta página.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Meta Pixel ID</label>
              <input value={pageMetaPixel} onChange={e => setPageMetaPixel(e.target.value)}
                placeholder="Ex: 123456789012345" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Google Analytics ID</label>
              <input value={pageGaId} onChange={e => setPageGaId(e.target.value)}
                placeholder="Ex: G-XXXXXXXXXX" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm" />
            </div>
            <Button onClick={() => { setPagePixelOpen(false); toast.success("Pixels configurados! Salve a página para aplicar."); }} className="w-full">
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBuilderOmni;
