import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, Loader2, Monitor, Tablet, Smartphone, Layout,
  MousePointer2, Undo2, Redo2, Send, RotateCcw, Sparkles,
  Plus, FileText, Globe, Download, Trash2,
  ExternalLink, Eye, Copy, Check, Settings, Image, Link2,
  Type, Palette, X, Upload, MessageCircle, Key, Bot, Code, DollarSign,
  PlusCircle, Sparkle, BarChart3, Search
} from "lucide-react";
import { PAGE_TEMPLATES } from "@/data/pageTemplates";
import { toast } from "sonner";
import { useUpdateLPConfig } from "@/hooks/useSupabaseQuery";
import { useAIBuilder } from "@/hooks/useAIBuilder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { CheckoutSidebar } from "@/components/builder/CheckoutSidebar";
import { useCheckoutBlocks } from "@/hooks/useCheckoutBlocks";
import { useAuth } from "@/context/AuthContext";

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

type BuilderMode = "generate" | "edit-generated";

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

/* ───────── raw canvas script ───────── */
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
  });
  window.addEventListener('message',function(e){
    if(!e.data.type) return;
    if(e.data.type==='BUILDER_UPDATE_TEXT'){
      var xpath=e.data.value.xpath;
      var el=document.evaluate(xpath,document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
      if(el) el.innerText=e.data.value.text;
    }
    if(e.data.type==='BUILDER_UPDATE_SRC'){
      var el=document.evaluate(e.data.value.xpath,document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
      if(el&&el.tagName==='IMG') el.src=e.data.value.src;
      else if(el) el.querySelector('img').src=e.data.value.src;
    }
    if(e.data.type==='BUILDER_UPDATE_HREF'){
      var el=document.evaluate(e.data.value.xpath,document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
      if(el&&el.tagName==='A') el.href=e.data.value.href;
      else if(el) el.closest('a').href=e.data.value.href;
    }
    if(e.data.type==='BUILDER_ADD_CLASS'){
      var el=document.evaluate(e.data.value.xpath,document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
      if(el) el.classList.add(e.data.value.cls);
    }
    if(e.data.type==='BUILDER_DELETE'){
      var el=document.evaluate(e.data.value.xpath,document,null,XPathResult.FIRST_ORDERED_NODE_TYPE,null).singleNodeValue;
      if(el) el.remove();
    }
    if(e.data.type==='BUILDER_GET_HTML'){
      window.parent.postMessage({type:'BUILDER_HTML',html:document.documentElement.outerHTML},'*');
    }
  });
})();`;

const CANVAS_SCRIPT = `<script>${CANVAS_SCRIPT_RAW}<\/script>`;

function injectScript(html: string): string {
  if (!html) return html;
  if (html.includes("__builderInjected")) return html;
  if (html.includes("</body>")) return html.replace("</body>", CANVAS_SCRIPT + "</body>");
  if (html.includes("</html>")) return html.replace("</html>", CANVAS_SCRIPT + "</html>");
  return html + CANVAS_SCRIPT;
}

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
  return { html: s, title: "" };
}

interface AdminBuilderOmniProps {
  isLegacyLP?: boolean;
}

const AdminBuilderOmni = ({ isLegacyLP = false }: AdminBuilderOmniProps) => {
  const { role, user } = useAuth();
  const { processPrompt, generatePage, isLoading: aiLoading } = useAIBuilder();
  const pageTitle = isLegacyLP ? "Editar Landing Page Oficial" : "Builder Pages";

  /* ── core state ── */
  const [mode, setMode] = useState<BuilderMode>("generate");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [isSaving, setIsSaving] = useState(false);

  /* ── chat ── */
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");

  /* ── history ── */
  const [htmlHistory, setHtmlHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  /* ── generated pages ── */
  const [pages, setPages] = useState<GenPage[]>([]);
  const [activePage, setActivePage] = useState<GenPage | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");
  const [newPageSlug, setNewPageSlug] = useState("");
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [availableDomains, setAvailableDomains] = useState<any[]>([]);
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

  /* ── checkout sidebar ── */
  const [checkoutSidebarOpen, setCheckoutSidebarOpen] = useState(false);
  const { blocks: checkoutBlocks } = useCheckoutBlocks();

  const chatEndRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    loadPages();
    loadDomains();
  }, []);

  const loadDomains = async () => {
    if (!user) return;
    const { data } = await (supabase.from("custom_domains" as any).select("*").eq("user_id", user.id) as any).eq("is_active", true);
    if (data) setAvailableDomains(data);
  };

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

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
          const m = p.href.match(/wa\.me\/(\d+)\?text=(.*)/);
          if (m) { setWaNumber(m[1]); setWaMessage(decodeURIComponent(m[2])); }
        } else if (p.href?.startsWith("#")) {
          setLinkAction("anchor");
        } else {
          setLinkAction("url");
        }
      }
      if (e.data.type === "BUILDER_HTML") {
        setGeneratedHtml(e.data.html);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const loadPages = async () => {
    if (!user) return;
    const { data } = await supabase.from("generated_pages").select("*").eq("created_by", user.id).order("created_at", { ascending: false });
    if (data) setPages(data);
  };

  const handleUndo = () => {
    if (historyIdx > 0) {
      const prev = htmlHistory[historyIdx - 1];
      setHistoryIdx(historyIdx - 1);
      setGeneratedHtml(prev);
    }
  };

  const handleRedo = () => {
    if (historyIdx < htmlHistory.length - 1) {
      const next = htmlHistory[historyIdx + 1];
      setHistoryIdx(historyIdx + 1);
      setGeneratedHtml(next);
    }
  };

  const updateCanvas = (type: string, value: any) => {
    iframeRef.current?.contentWindow?.postMessage({ type, value }, "*");
    setTimeout(() => {
      iframeRef.current?.contentWindow?.postMessage({ type: "BUILDER_GET_HTML" }, "*");
    }, 100);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || aiLoading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: chatInput, timestamp: new Date() };
    setChatMessages(p => [...p, userMsg]);
    const userPrompt = chatInput;
    setChatInput("");

    try {
      // Se não há HTML gerado ainda, cria uma página nova
      if (!generatedHtml || generatedHtml.trim() === "") {
        setIsGenerating(true);
        const res = await generatePage(userPrompt);
        const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: "Página criada com sucesso! Você pode fazer alterações agora.", timestamp: new Date() };
        setChatMessages(p => [...p, assistantMsg]);
        const { html } = cleanAIPayload(res);
        if (html && html.length > 100) {
          const newHtml = injectScript(html);
          setGeneratedHtml(newHtml);
          setHtmlHistory([newHtml]);
          setHistoryIdx(0);
          toast.success("Página gerada com sucesso!");
        }
        setIsGenerating(false);
      } else {
        // Se já existe HTML, faz alteração incremental
        const res = await processPrompt(userPrompt, generatedHtml);
        const assistantMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: res, timestamp: new Date() };
        setChatMessages(p => [...p, assistantMsg]);
        const { html } = cleanAIPayload(res);
        if (html && html.length > 100) {
          const newHtml = injectScript(html);
          setGeneratedHtml(newHtml);
          setHtmlHistory(p => [...p.slice(0, historyIdx + 1), newHtml]);
          setHistoryIdx(h => h + 1);
          toast.success("Alteração realizada!");
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro ao processar comando da IA");
    }
  };

  const handleGeneratePage = async () => {
    setMode("edit-generated");
    setGeneratedHtml("");
    setHtmlHistory([""]);
    setHistoryIdx(0);
    setChatMessages([{
      id: "welcome",
      role: "assistant",
      content: `Olá! Estou pronto para criar sua Landing Page. Descreva o que você gostaria que a página tivesse. Por exemplo: "Crie uma landing page para um curso de programação com seção de hero, benefícios, depoimentos e CTA".`,
      timestamp: new Date()
    }]);
  };

  const handleSavePage = async () => {
    if (!user || !generatedHtml) return;
    setIsSaving(true);
    try {
      iframeRef.current?.contentWindow?.postMessage({ type: "BUILDER_GET_HTML" }, "*");
      await new Promise(r => setTimeout(r, 500));
      
      const payload = {
        title: activePage?.title || newPageTitle,
        slug: activePage?.slug || newPageSlug,
        html_content: generatedHtml,
        status: "published",
        created_by: user.id,
        meta_pixel_id: pageMetaPixel || null,
        ga_id: pageGaId || null
      };

      if (activePage) {
        await supabase.from("generated_pages").update(payload).eq("id", activePage.id);
      } else {
        const { data, error } = await supabase.from("generated_pages").insert(payload).select().single();
        if (error) throw error;
        setActivePage(data);
      }
      toast.success("Página salva e publicada!");
      loadPages();
    } catch (err) {
      toast.error("Erro ao salvar página");
    } finally {
      setIsSaving(false);
    }
  };

  const deletePage = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta página?")) return;
    await supabase.from("generated_pages").delete().eq("id", id);
    loadPages();
    if (activePage?.id === id) {
      setActivePage(null);
      setGeneratedHtml("");
      setMode("generate");
    }
    toast.success("Página excluída");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("builder-assets").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("builder-assets").getPublicUrl(path);
      setEditSrc(publicUrl);
      updateCanvas("BUILDER_UPDATE_SRC", publicUrl);
      toast.success("Imagem enviada!");
    } catch (err) {
      toast.error("Erro no upload");
    }
  };

  const handleBYOKSave = () => {
    saveBYOK(byok);
    setBYOKOpen(false);
    toast.success("Configuração IA salva localmente");
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
    toast.success("Link copiado!");
  };

  const handleAddCheckoutBlock = (block: any) => {
    const blockHtml = `
      <section class="py-12 bg-white" data-builder-block="checkout">
        <div class="max-w-4xl mx-auto px-4">
          <div class="bg-gray-50 rounded-2xl p-8 border border-gray-200 shadow-sm">
            <h2 class="text-2xl font-bold mb-6">${block.name}</h2>
            <div class="checkout-placeholder bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
              <p class="text-gray-500">O Checkout do ${block.name} será renderizado aqui.</p>
            </div>
          </div>
        </div>
      </section>
    `;
    const newHtml = generatedHtml + blockHtml;
    setGeneratedHtml(newHtml);
    setHtmlHistory(p => [...p, newHtml]);
    setHistoryIdx(h => h + 1);
    setCheckoutSidebarOpen(false);
    toast.success("Bloco de Checkout adicionado!");
  };

  /* ── Template usage ── */
  const [templateFilter, setTemplateFilter] = useState("");
  const [showTemplates, setShowTemplates] = useState(true);

  const handleUseTemplate = async (template: typeof PAGE_TEMPLATES[0]) => {
    const title = template.name;
    const slug = title.toLowerCase().replace(/ /g, "-").replace(/[^\w-]/g, "") + "-" + Date.now();
    setNewPageTitle(title);
    setNewPageSlug(slug);
    const html = injectScript(template.html);
    setGeneratedHtml(html);
    setHtmlHistory([html]);
    setHistoryIdx(0);
    setMode("edit-generated");
    setChatMessages([{
      id: "welcome", role: "assistant",
      content: `Template "${template.name}" carregado! Edite visualmente ou peça alterações no chat.`,
      timestamp: new Date()
    }]);
    toast.success(`Template "${template.name}" carregado!`);
  };

  const filteredTemplates = PAGE_TEMPLATES.filter(t =>
    !templateFilter || t.name.toLowerCase().includes(templateFilter.toLowerCase()) || t.category.toLowerCase().includes(templateFilter.toLowerCase())
  );

  /* ───────── RENDER: EMPTY STATE / TEMPLATE GALLERY ───────── */
  if (mode === "generate" && !isGenerating && pages.length === 0) {
    return (
      <div className="flex-1 flex flex-col bg-[#050505] p-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full space-y-8">
          {/* Header */}
          <div className="text-center space-y-2 pt-8">
            <h2 className="text-3xl font-bold text-white tracking-tight">Crie sua página</h2>
            <p className="text-muted-foreground">Escolha um template pronto ou crie do zero com IA</p>
          </div>

          {/* AI Create Card */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-2xl backdrop-blur-xl space-y-4 max-w-md mx-auto">
            <div className="space-y-2 text-left">
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Título do Projeto</label>
              <input type="text" placeholder="Ex: Minha Nova Landing Page"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary/50 outline-none transition-all"
                value={newPageTitle}
                onChange={e => { setNewPageTitle(e.target.value); setNewPageSlug(e.target.value.toLowerCase().replace(/ /g, "-").replace(/[^\w-]/g, "")); }}
              />
            </div>
            <Button className="w-full py-5 rounded-xl text-base font-bold gap-2 group" onClick={handleGeneratePage} disabled={!newPageTitle.trim()}>
              <Sparkle className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Criar com IA
            </Button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/40 uppercase tracking-widest font-bold">ou escolha um template</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input type="text" placeholder="Buscar templates..." value={templateFilter} onChange={e => setTemplateFilter(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-primary/30"
            />
          </div>

          {/* Template Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-12">
            {filteredTemplates.map(tmpl => (
              <motion.div key={tmpl.id} whileHover={{ scale: 1.02 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-5 cursor-pointer hover:border-primary/40 transition-all group"
                onClick={() => handleUseTemplate(tmpl)}
              >
                <div className="text-4xl mb-3">{tmpl.thumbnail}</div>
                <h3 className="font-bold text-sm text-white mb-1">{tmpl.name}</h3>
                <p className="text-[10px] text-primary/80 font-semibold uppercase tracking-wider mb-2">{tmpl.category}</p>
                <p className="text-xs text-white/40 line-clamp-2">{tmpl.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Renderização do modo Legacy LP
  const renderSidebar = () => {
    if (isLegacyLP) {
      return (
        <aside className="w-72 border-r border-white/10 bg-[#050505] flex flex-col shrink-0">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-bold text-sm tracking-widest uppercase text-white/60">LP Oficial</h2>
            <div className="text-xs px-2 py-1 bg-amber-500/10 text-amber-500 rounded-full font-bold">SUPER ADMIN</div>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 text-center text-white/40 text-sm">
            <p>Editando a Landing Page Oficial do Omni Builder CRM</p>
          </div>
          <div className="p-4 border-t border-white/10 bg-black/40">
            <Button variant="outline" className="w-full text-xs gap-2 border-white/10 hover:bg-white/5" onClick={() => setBYOKOpen(true)}>
              <Key className="h-3 w-3" /> Configurar IA (BYOK)
            </Button>
          </div>
        </aside>
      );
    }
    return (
      <aside className="w-72 border-r border-white/10 bg-[#050505] flex flex-col shrink-0">
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-bold text-sm tracking-widest uppercase text-white/60">Minhas Páginas</h2>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-white/40 hover:text-white" onClick={() => {
            setMode("generate");
            setActivePage(null);
            setGeneratedHtml("");
          }}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {pages.map(p => (
            <div 
              key={p.id}
              onClick={() => {
                setActivePage(p);
                setGeneratedHtml(injectScript(p.html_content));
                setHtmlHistory([injectScript(p.html_content)]);
                setHistoryIdx(0);
                setMode("edit-generated");
                setPageMetaPixel(p.meta_pixel_id || "");
                setPageGaId(p.ga_id || "");
              }}
              className={`group p-3 rounded-xl cursor-pointer border transition-all ${activePage?.id === p.id ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-transparent hover:border-white/10'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.status === 'published' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                  {p.status === 'published' ? 'Ativa' : 'Rascunho'}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); handleCopyLink(p.slug); }} className="p-1 hover:text-primary">
                    {copiedSlug === p.slug ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deletePage(p.id); }} className="p-1 hover:text-red-500">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <p className="font-semibold text-sm truncate">{p.title}</p>
              <p className="text-[10px] text-white/40 font-mono truncate">/p/{p.slug}</p>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-white/10 bg-black/40">
          <Button variant="outline" className="w-full text-xs gap-2 border-white/10 hover:bg-white/5" onClick={() => setBYOKOpen(true)}>
            <Key className="h-3 w-3" /> Configurar IA (BYOK)
          </Button>
        </div>
      </aside>
    );
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden font-sans">
      {renderSidebar()}

      {/* ── Main Layout Container ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── Main Canvas ── */}
        <main className="flex-1 flex flex-col relative bg-[#0a0a0a] border-r border-white/10">
          {/* Toolbar */}
          <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#050505]/80 backdrop-blur-md z-20">
            <div className="flex items-center gap-4">
              <div className="flex bg-white/5 rounded-lg p-1 border border-white/10">
                <button onClick={() => setViewport("desktop")} className={`p-2 rounded-md transition-all ${viewport === 'desktop' ? 'bg-primary text-black shadow-lg' : 'text-white/40 hover:text-white'}`}><Monitor className="h-4 w-4" /></button>
                <button onClick={() => setViewport("tablet")} className={`p-2 rounded-md transition-all ${viewport === 'tablet' ? 'bg-primary text-black shadow-lg' : 'text-white/40 hover:text-white'}`}><Tablet className="h-4 w-4" /></button>
                <button onClick={() => setViewport("mobile")} className={`p-2 rounded-md transition-all ${viewport === 'mobile' ? 'bg-primary text-black shadow-lg' : 'text-white/40 hover:text-white'}`}><Smartphone className="h-4 w-4" /></button>
              </div>
              <div className="h-6 w-px bg-white/10 mx-2" />
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={handleUndo} disabled={historyIdx <= 0} className="h-9 w-9 text-white/60"><Undo2 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={handleRedo} disabled={historyIdx >= htmlHistory.length - 1} className="h-9 w-9 text-white/60"><Redo2 className="h-4 w-4" /></Button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5" onClick={() => setPagePixelOpen(true)}>
                <Code className="h-4 w-4" /> Pixels
              </Button>
              <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5" onClick={() => setCheckoutSidebarOpen(true)}>
                <DollarSign className="h-4 w-4" /> Checkout
              </Button>
              <Button onClick={handleSavePage} disabled={isSaving || !generatedHtml} className="gap-2 px-6 shadow-lg shadow-primary/20">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {activePage ? 'Atualizar' : 'Publicar'}
              </Button>
            </div>
          </header>

          {/* Iframe Container */}
          <div className="flex-1 bg-[#0f0f0f] overflow-hidden flex items-center justify-center p-8 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-30" />
            <AnimatePresence mode="wait">
              {isGenerating ? (
                <motion.div
                  key="gen"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-6 z-10"
                >
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold text-white tracking-tight">Arquitetando sua página...</h3>
                    <p className="text-white/40 animate-pulse">A Inteligência Artificial está escrevendo o código agora.</p>
                  </div>
                </motion.div>
              ) : !generatedHtml ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className="max-w-3xl w-full z-10 space-y-6 overflow-y-auto max-h-full p-4"
                >
                  <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Descreva no chat ou <span className="text-primary">use um template</span></h1>
                    <p className="text-white/60">Escolha um template pronto abaixo para começar instantaneamente</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {PAGE_TEMPLATES.slice(0, 6).map(tmpl => (
                      <div key={tmpl.id} onClick={() => handleUseTemplate(tmpl)}
                        className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-primary/40 transition-all text-left">
                        <span className="text-2xl">{tmpl.thumbnail}</span>
                        <p className="font-bold text-xs text-white mt-2">{tmpl.name}</p>
                        <p className="text-[10px] text-white/40">{tmpl.category}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="canvas"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{ width: viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px' }}
                  className="h-full bg-white rounded-xl shadow-[0_0_100px_rgba(0,0,0,0.5)] transition-all duration-500 overflow-hidden relative"
                >
                  <iframe ref={iframeRef} srcDoc={generatedHtml} className="w-full h-full border-0" title="Canvas" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>

        {/* AI Chat Sidebar (Right Side) */}
        {(mode === "edit-generated" || !generatedHtml) && (
          <aside className="w-[400px] bg-[#050505] border-l border-white/10 flex flex-col z-30 overflow-hidden">
            <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-white/5">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-bold">Assistente Omni AI</h3>
                <p className="text-[10px] text-green-500 flex items-center gap-1">
                  <span className="w-1 h-1 bg-green-500 rounded-full animate-ping" /> Online
                </p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-transparent to-black/20">
              {chatMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <Sparkles className="w-8 h-8 text-primary/40" />
                  </div>
                  <p className="text-sm text-white/40 italic">"Altere o título para vermelho", "Adicione uma seção de depoimentos", "Mude a cor do botão para azul"...</p>
                </div>
              )}
              {chatMessages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-primary text-black font-medium' : 'bg-white/10 text-white border border-white/10'}`}>
                    <ReactMarkdown>{String(m.content || '')}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {aiLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/10 p-3 rounded-2xl flex gap-2 items-center border border-white/10">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-xs text-white/60">IA pensando...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleChatSubmit} className="p-4 bg-black/40 border-t border-white/10">
              <div className="relative">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Peça qualquer alteração..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:border-primary/50 outline-none transition-all pr-12"
                />
                <button type="submit" className="absolute right-2 top-2 p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors">
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </form>
          </aside>
        )}

        {/* ── Element Editor: Now as a floating or integrated panel ── */}
        <AnimatePresence>
          {selectedEl && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="absolute top-20 right-[420px] w-80 border border-white/10 bg-[#050505]/95 backdrop-blur-xl rounded-2xl flex flex-col shrink-0 z-40 shadow-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
                <h3 className="font-bold text-xs uppercase tracking-widest text-white/60">Editor de Elemento</h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedEl(null)} className="h-8 w-8 text-white/40 hover:text-white">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar">
                {/* Text Content */}
                {!selectedEl.isImage && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                      <Type className="w-3 h-3" /> Conteúdo do Texto
                    </label>
                    <textarea 
                      value={editText}
                      onChange={e => { setEditText(e.target.value); updateCanvas("BUILDER_UPDATE_TEXT", e.target.value); }}
                      rows={4}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary/50 outline-none resize-none"
                    />
                  </div>
                )}

                {/* Image Source */}
                {selectedEl.isImage && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                      <Image className="w-3 h-3" /> Fonte da Imagem
                    </label>
                    <div className="flex flex-col gap-3">
                      <div className="w-full aspect-video bg-black/40 rounded-xl border border-white/10 overflow-hidden flex items-center justify-center group relative">
                        <img src={editSrc} alt="Preview" className="w-full h-full object-contain p-2" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button size="sm" variant="secondary" onClick={() => fileInputRef.current?.click()}>Trocar Imagem</Button>
                        </div>
                      </div>
                      <input type="text" value={editSrc} onChange={e => { setEditSrc(e.target.value); updateCanvas("BUILDER_UPDATE_SRC", e.target.value); }} className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs outline-none" placeholder="https://..." />
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                    </div>
                  </div>
                )}

                {/* Link Action */}
                {selectedEl.isLink && (
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                      <Link2 className="w-3 h-3" /> Ação do Link
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                      <button onClick={() => setLinkAction("url")} className={`text-[10px] py-2 rounded-md transition-all ${linkAction === 'url' ? 'bg-primary text-black font-bold' : 'text-white/40 hover:text-white'}`}>URL</button>
                      <button onClick={() => setLinkAction("anchor")} className={`text-[10px] py-2 rounded-md transition-all ${linkAction === 'anchor' ? 'bg-primary text-black font-bold' : 'text-white/40 hover:text-white'}`}>Âncora</button>
                      <button onClick={() => setLinkAction("whatsapp")} className={`text-[10px] py-2 rounded-md transition-all ${linkAction === 'whatsapp' ? 'bg-primary text-black font-bold' : 'text-white/40 hover:text-white'}`}>Whats</button>
                    </div>

                    {linkAction === "url" && (
                      <Input value={editHref} onChange={e => { setEditHref(e.target.value); updateCanvas("BUILDER_UPDATE_HREF", e.target.value); }} placeholder="https://..." className="bg-black/40 border-white/10 rounded-xl" />
                    )}
                    {linkAction === "anchor" && (
                      <Input value={editHref} onChange={e => { setEditHref(e.target.value); updateCanvas("BUILDER_UPDATE_HREF", e.target.value); }} placeholder="#secao" className="bg-black/40 border-white/10 rounded-xl" />
                    )}
                    {linkAction === "whatsapp" && (
                      <div className="space-y-3">
                        <Input placeholder="5511999999999" value={waNumber} onChange={e => {
                          const n = e.target.value; setWaNumber(n);
                          const url = `https://wa.me/${n}?text=${encodeURIComponent(waMessage)}`;
                          setEditHref(url); updateCanvas("BUILDER_UPDATE_HREF", url);
                        }} className="bg-black/40 border-white/10 rounded-xl" />
                        <textarea placeholder="Olá, gostaria de saber mais..." value={waMessage} onChange={e => {
                          const m = e.target.value; setWaMessage(m);
                          const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(m)}`;
                          setEditHref(url); updateCanvas("BUILDER_UPDATE_HREF", url);
                        }} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-primary/50 outline-none resize-none" rows={3} />
                      </div>
                    )}
                  </div>
                )}

                {/* Advanced Styling */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
                    <Palette className="w-3 h-3" /> Estilização Rápida
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" className="text-[10px] border-white/10 h-8" onClick={() => updateCanvas("BUILDER_ADD_CLASS", "rounded-full")}>Arredondar</Button>
                    <Button variant="outline" size="sm" className="text-[10px] border-white/10 h-8" onClick={() => updateCanvas("BUILDER_ADD_CLASS", "shadow-2xl")}>Sombra</Button>
                    <Button variant="outline" size="sm" className="text-[10px] border-white/10 h-8" onClick={() => updateCanvas("BUILDER_ADD_CLASS", "font-bold")}>Negrito</Button>
                    <Button variant="outline" size="sm" className="text-[10px] border-white/10 h-8" onClick={() => updateCanvas("BUILDER_ADD_CLASS", "uppercase")}>Caixa Alta</Button>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="pt-4 border-t border-white/10">
                  <Button variant="destructive" size="sm" className="w-full text-[10px] gap-2 h-9" onClick={() => { if(confirm('Excluir este elemento?')){ updateCanvas("BUILDER_DELETE", null); setSelectedEl(null); } }}>
                    <Trash2 className="h-3 w-3" /> Excluir Elemento
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Modals ── */}
      <Dialog open={byokOpen} onOpenChange={setBYOKOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-primary" /> Configurar sua própria Chave</DialogTitle>
            <DialogDescription className="text-white/40">Use seu próprio provedor de IA para gerar páginas sem limites.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Provedor</label>
              <select value={byok.provider} onChange={e => setBYOK(p => ({ ...p, provider: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50">
                <option value="openai">OpenAI (GPT-4o)</option>
                <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                <option value="groq">Groq (Mixtral 8x7b)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">API Key</label>
              <input type="password" value={byok.apiKey} onChange={e => setBYOK(p => ({ ...p, apiKey: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-primary/50" placeholder="sk-..." />
            </div>
            <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
              <input type="checkbox" checked={byok.enabled} onChange={e => setBYOK(p => ({ ...p, enabled: e.target.checked }))} className="w-5 h-5 rounded border-white/10 bg-black text-primary" />
              <div className="text-xs">
                <p className="font-bold">Ativar BYOK</p>
                <p className="text-white/40">Usar estas credenciais em vez das do sistema.</p>
              </div>
            </div>
            <Button onClick={handleBYOKSave} className="w-full py-6 rounded-xl">Salvar Configurações</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={pagePixelOpen} onOpenChange={setPagePixelOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Code className="h-5 w-5 text-primary" /> Pixels desta Página</DialogTitle>
            <DialogDescription className="text-white/40">Rastreamento específico para esta landing page.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Meta Pixel ID</label>
              <Input value={pageMetaPixel} onChange={e => setPageMetaPixel(e.target.value)} className="bg-black/40 border-white/10 rounded-xl" placeholder="Ex: 123456789" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-white/40">Google Analytics ID (G-XXXX)</label>
              <Input value={pageGaId} onChange={e => setPageGaId(e.target.value)} className="bg-black/40 border-white/10 rounded-xl" placeholder="Ex: G-ABC123XYZ" />
            </div>
            <Button onClick={() => setPagePixelOpen(false)} className="w-full py-6 rounded-xl">Salvar Pixels</Button>
          </div>
        </DialogContent>
      </Dialog>

      <CheckoutSidebar 
        isOpen={checkoutSidebarOpen} 
        onClose={() => setCheckoutSidebarOpen(false)}
      />
    </div>
  );
};

export default AdminBuilderOmni;
