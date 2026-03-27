import { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, Save, Globe, Loader2, Sparkles, Send, Eye, Copy, Check,
  ExternalLink, GripVertical, Image, Palette, Settings, X, Bot, Code,
  ListChecks, MessageSquare, Phone, Mail, ArrowUp, ArrowDown,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFunnels, useStages } from "@/hooks/useSupabaseQuery";
import { useAIBuilder } from "@/hooks/useAIBuilder";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import ReactMarkdown from "react-markdown";

/* ── types ── */
interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "text" | "phone" | "email";
  title: string;
  options?: string[];
  required?: boolean;
  skipLogic?: { optionIndex: number; goToQuestionId: string }[];
}

interface QuizTheme {
  bgColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontFamily: string;
}

interface Quiz {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  logo_position: string;
  theme: QuizTheme;
  questions: QuizQuestion[];
  status: string;
  crm_funnel_id: string | null;
  crm_stage_id: string | null;
  meta_pixel_id: string;
  ga_id: string;
  created_at: string;
}

interface ChatMsg { id: string; role: "user" | "assistant"; content: string; }

const DEFAULT_THEME: QuizTheme = {
  bgColor: "#0f172a", textColor: "#ffffff", buttonColor: "#FBBF24", buttonTextColor: "#000000", fontFamily: "Inter",
};

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Múltipla Escolha", icon: ListChecks },
  { value: "text", label: "Texto Longo", icon: MessageSquare },
  { value: "phone", label: "Telefone", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
];

const TEMPLATES = [
  { name: "Captação Estética", prompt: "Crie um quiz de captação de leads para clínica de estética com 4 perguntas sobre tipo de pele, tratamentos de interesse, faixa etária e orçamento" },
  { name: "Qualificação B2B", prompt: "Crie um quiz para qualificar leads B2B com perguntas sobre tamanho da empresa, orçamento mensal, principal dor e urgência" },
  { name: "Consultoria Fitness", prompt: "Crie um quiz para personal trainer com perguntas sobre objetivo, frequência de treino, experiência e disponibilidade" },
];

/* ═══════ COMPONENT ═══════ */
const AdminQuizBuilder = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [tab, setTab] = useState<"editor" | "theme" | "integration" | "preview">("editor");
  const [isSaving, setIsSaving] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  /* ── Quiz form state ── */
  const [title, setTitle] = useState("Novo Quiz");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPosition, setLogoPosition] = useState("center");
  const [theme, setTheme] = useState<QuizTheme>(DEFAULT_THEME);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [crmFunnelId, setCrmFunnelId] = useState<string | null>(null);
  const [crmStageId, setCrmStageId] = useState<string | null>(null);
  const [metaPixel, setMetaPixel] = useState("");
  const [gaId, setGaId] = useState("");

  /* ── AI Chat ── */
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const { generatePage, isLoading: aiLoading } = useAIBuilder();
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ── CRM data ── */
  const { data: funnels } = useFunnels();
  const { data: crmStages } = useStages(crmFunnelId);

  useEffect(() => { loadQuizzes(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  const loadQuizzes = async () => {
    const { data } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false });
    if (data) setQuizzes(data as any as Quiz[]);
  };

  const openQuiz = (q: Quiz) => {
    setActiveQuiz(q);
    setTitle(q.title);
    setSlug(q.slug);
    setDescription(q.description || "");
    setLogoUrl(q.logo_url || "");
    setLogoPosition(q.logo_position);
    setTheme(q.theme || DEFAULT_THEME);
    setQuestions(q.questions || []);
    setCrmFunnelId(q.crm_funnel_id);
    setCrmStageId(q.crm_stage_id);
    setMetaPixel(q.meta_pixel_id || "");
    setGaId(q.ga_id || "");
    setTab("editor");
  };

  const resetForm = () => {
    setActiveQuiz(null);
    setTitle("Novo Quiz");
    setSlug("");
    setDescription("");
    setLogoUrl("");
    setLogoPosition("center");
    setTheme(DEFAULT_THEME);
    setQuestions([]);
    setCrmFunnelId(null);
    setCrmStageId(null);
    setMetaPixel("");
    setGaId("");
  };

  const saveQuiz = async (publish = false) => {
    if (!title.trim()) return toast.error("Título obrigatório");
    if (questions.length === 0 && publish) return toast.error("Adicione pelo menos uma pergunta para publicar");
    setIsSaving(true);
    try {
      const finalSlug = slug.trim()
        ? slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/^-|-$/g, "")
        : title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);

      const payload: any = {
        title, slug: finalSlug, description: description || null,
        logo_url: logoUrl || null, logo_position: logoPosition,
        theme: theme as any, questions: questions as any,
        status: publish ? "published" : (activeQuiz?.status || "draft"),
        crm_funnel_id: crmFunnelId || null, crm_stage_id: crmStageId || null,
        meta_pixel_id: metaPixel, ga_id: gaId,
      };

      if (activeQuiz) {
        const { error } = await supabase.from("quizzes").update(payload).eq("id", activeQuiz.id);
        if (error) throw error;
        toast.success(publish ? "Quiz publicado!" : "Quiz salvo!");
      } else {
        const { data: user } = await supabase.auth.getUser();
        payload.created_by = user?.user?.id;
        const { data, error } = await supabase.from("quizzes").insert(payload).select().single();
        if (error) {
          if (error.message?.includes("duplicate") || error.code === "23505") {
            payload.slug = finalSlug + "-" + Date.now().toString(36);
            const { error: e2 } = await supabase.from("quizzes").insert(payload).select().single();
            if (e2) throw e2;
          } else throw error;
        }
        toast.success(publish ? "Quiz criado e publicado!" : "Quiz salvo!");
      }
      setSlug(payload.slug || finalSlug);
      await loadQuizzes();
      // Re-open the quiz to set activeQuiz
      if (!activeQuiz) {
        const { data: latest } = await supabase.from("quizzes").select("*").eq("slug", payload.slug || finalSlug).single();
        if (latest) openQuiz(latest as any);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Erro ao salvar quiz");
    } finally {
      setIsSaving(false);
    }
  };

  const deleteQuiz = async (id: string) => {
    if (!confirm("Excluir quiz?")) return;
    await supabase.from("quizzes").delete().eq("id", id);
    if (activeQuiz?.id === id) resetForm();
    await loadQuizzes();
    toast.success("Quiz excluído");
  };

  /* ── Question management ── */
  const addQuestion = (type: QuizQuestion["type"] = "multiple_choice") => {
    setQuestions(prev => [...prev, {
      id: Date.now().toString(),
      type, title: "",
      options: type === "multiple_choice" ? ["Opção 1", "Opção 2"] : undefined,
      required: true,
    }]);
  };

  const updateQuestion = (id: string, updates: Partial<QuizQuestion>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
  };

  const moveQuestion = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= questions.length) return;
    const arr = [...questions];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    setQuestions(arr);
  };

  const addOption = (qId: string) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, options: [...(q.options || []), `Opção ${(q.options?.length || 0) + 1}`] } : q));
  };

  const updateOption = (qId: string, optIdx: number, value: string) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, options: q.options?.map((o, i) => i === optIdx ? value : o) } : q));
  };

  const removeOption = (qId: string, optIdx: number) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, options: q.options?.filter((_, i) => i !== optIdx) } : q));
  };

  /* ── AI Chat ── */
  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content: chatInput };
    setChatMsgs(prev => [...prev, userMsg]);
    const input = chatInput;
    setChatInput("");

    const prompt = `Gere um Quiz interativo de captação de leads em formato JSON. 
O JSON deve ter: { "title": "...", "description": "...", "questions": [{ "id": "q1", "type": "multiple_choice"|"text"|"phone"|"email", "title": "...", "options": ["..."], "required": true }] }
Pedido do usuário: "${input}"
Retorne APENAS o JSON puro, sem markdown.`;

    let fullRaw = "";
    await generatePage(prompt, (delta) => { fullRaw += delta; }, () => {
      try {
        const cleaned = fullRaw.replace(/```json?\s*/g, "").replace(/```/g, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.questions?.length) {
            setQuestions(parsed.questions.map((q: any, i: number) => ({
              id: q.id || `q${i}`, type: q.type || "multiple_choice",
              title: q.title || "", options: q.options, required: q.required !== false,
            })));
          }
          setChatMsgs(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: `✅ Quiz "${parsed.title || title}" gerado com ${parsed.questions?.length || 0} perguntas! Edite no painel à esquerda.` }]);
        } else throw new Error("no json");
      } catch {
        setChatMsgs(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: "Não consegui interpretar. Tente novamente com mais detalhes." }]);
      }
    });
  };

  const copySlug = (s: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/quiz/${s}`);
    setCopiedSlug(s);
    setTimeout(() => setCopiedSlug(null), 2000);
    toast.success("Link copiado!");
  };

  /* ── Preview HTML ── */
  const buildPreviewHtml = () => {
    const t = theme;
    const qs = questions.map((q, i) => {
      let inputHtml = "";
      if (q.type === "multiple_choice") {
        inputHtml = (q.options || []).map((opt, j) =>
          `<button onclick="this.style.background='${t.buttonColor}';this.style.color='${t.buttonTextColor}'" class="opt-btn" style="display:block;width:100%;padding:14px;margin:6px 0;border:1px solid ${t.buttonColor}40;border-radius:12px;background:transparent;color:${t.textColor};font-size:15px;cursor:pointer;transition:all .2s;text-align:left">${opt}</button>`
        ).join("");
      } else if (q.type === "email") {
        inputHtml = `<input type="email" placeholder="seu@email.com" style="width:100%;padding:14px;border:1px solid ${t.buttonColor}40;border-radius:12px;background:transparent;color:${t.textColor};font-size:15px;outline:none" />`;
      } else if (q.type === "phone") {
        inputHtml = `<input type="tel" placeholder="(11) 99999-9999" style="width:100%;padding:14px;border:1px solid ${t.buttonColor}40;border-radius:12px;background:transparent;color:${t.textColor};font-size:15px;outline:none" />`;
      } else {
        inputHtml = `<textarea placeholder="Digite sua resposta..." rows="3" style="width:100%;padding:14px;border:1px solid ${t.buttonColor}40;border-radius:12px;background:transparent;color:${t.textColor};font-size:15px;outline:none;resize:none"></textarea>`;
      }
      return `<div class="q-slide" style="display:${i === 0 ? 'block' : 'none'};animation:fadeIn .4s ease">
        <div style="margin-bottom:24px">
          <p style="font-size:12px;color:${t.buttonColor};font-weight:600;margin-bottom:8px">PERGUNTA ${i + 1} DE ${questions.length}</p>
          <div style="height:4px;background:${t.buttonColor}20;border-radius:99px;overflow:hidden"><div style="height:100%;width:${((i + 1) / questions.length) * 100}%;background:${t.buttonColor};border-radius:99px;transition:width .4s"></div></div>
        </div>
        <h2 style="font-size:22px;font-weight:700;margin-bottom:20px;color:${t.textColor}">${q.title || `Pergunta ${i + 1}`}</h2>
        ${inputHtml}
        <button onclick="nextQ(${i})" style="margin-top:20px;padding:14px 32px;background:${t.buttonColor};color:${t.buttonTextColor};border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;width:100%;transition:transform .2s">${i === questions.length - 1 ? 'Finalizar' : 'Próxima →'}</button>
      </div>`;
    }).join("");

    return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=${t.fontFamily.replace(/ /g, "+")}&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'${t.fontFamily}',sans-serif;background:${t.bgColor};min-height:100vh;display:flex;align-items:center;justify-content:center}
@keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
.container{max-width:520px;width:100%;padding:40px 24px}
</style></head><body>
<div class="container">
${logoUrl ? `<div style="text-align:${logoPosition};margin-bottom:32px"><img src="${logoUrl}" style="max-height:48px;object-fit:contain" /></div>` : ""}
${qs}
${questions.length === 0 ? `<p style="color:${t.textColor};text-align:center;opacity:.5">Adicione perguntas ao quiz</p>` : ""}
</div>
<script>
function nextQ(i){var slides=document.querySelectorAll('.q-slide');if(i<slides.length-1){slides[i].style.display='none';slides[i+1].style.display='block';slides[i+1].style.animation='fadeIn .4s ease';}else{document.querySelector('.container').innerHTML='<div style="text-align:center;animation:fadeIn .5s"><p style="font-size:48px;margin-bottom:16px">🎉</p><h2 style="font-size:24px;font-weight:700;color:${t.textColor};margin-bottom:8px">Obrigado!</h2><p style="color:${t.textColor};opacity:.7">Suas respostas foram enviadas.</p></div>';}}
</script></body></html>`;
  };

  /* ═══════ RENDER ═══════ */
  return (
    <div className="h-[calc(100vh-120px)] flex -m-6 bg-background">
      {/* ── Left: Quiz List + Editor ── */}
      <div className="w-80 border-r border-border flex flex-col shrink-0 overflow-hidden">
        {/* Quiz list header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
            <ListChecks className="w-3.5 h-3.5 text-primary" /> Quizzes
          </h3>
          <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1" onClick={resetForm}>
            <Plus className="w-3 h-3" /> Novo
          </Button>
        </div>

        {/* Quiz list */}
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {quizzes.map(q => (
            <div key={q.id}
              className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${activeQuiz?.id === q.id ? "border-primary bg-primary/5" : "border-border/40 hover:border-border"}`}
              onClick={() => openQuiz(q)}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold truncate flex-1">{q.title}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${q.status === "published" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                  {q.status === "published" ? "LIVE" : "DRAFT"}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground truncate">/quiz/{q.slug}</p>
              <div className="flex items-center gap-1 mt-2">
                <button onClick={e => { e.stopPropagation(); copySlug(q.slug); }}
                  className="p-1 rounded hover:bg-secondary text-muted-foreground" title="Copiar link">
                  {copiedSlug === q.slug ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
                <button onClick={e => { e.stopPropagation(); window.open(`/quiz/${q.slug}`, "_blank"); }}
                  className="p-1 rounded hover:bg-secondary text-muted-foreground" title="Abrir">
                  <ExternalLink className="w-3 h-3" />
                </button>
                <button onClick={e => { e.stopPropagation(); openQuiz(q); }}
                  className="p-1 rounded hover:bg-secondary text-muted-foreground" title="Editar">
                  <Settings className="w-3 h-3" />
                </button>
                {q.status === "published" && (
                  <button onClick={async e => {
                    e.stopPropagation();
                    await supabase.from("quizzes").update({ status: "draft" }).eq("id", q.id);
                    loadQuizzes();
                    toast.success("Quiz despublicado");
                  }} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-amber-500" title="Despublicar">
                    <Eye className="w-3 h-3" />
                  </button>
                )}
                <button onClick={e => { e.stopPropagation(); deleteQuiz(q.id); }}
                  className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-destructive ml-auto" title="Excluir">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
          {quizzes.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <ListChecks className="w-8 h-8 mx-auto mb-2 opacity-20" />
              <p className="text-[11px]">Nenhum quiz ainda. Crie manualmente ou use a IA!</p>
            </div>
          )}

          {/* Templates */}
          <div className="pt-4 border-t border-border/30">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Templates</p>
            {TEMPLATES.map(t => (
              <button key={t.name} onClick={() => { setChatInput(t.prompt); }}
                className="block w-full text-left px-3 py-2 rounded-lg bg-secondary/30 text-[10px] hover:bg-secondary transition-colors mb-1">
                ✨ {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Center: Editor/Theme/Integration/Preview tabs ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="h-12 border-b border-border flex items-center justify-between px-4 shrink-0">
          <div className="flex gap-1 bg-secondary/50 p-0.5 rounded-lg border border-border/40 text-xs">
            {(["editor", "theme", "integration", "preview"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-3 py-1.5 rounded-md font-medium transition-all capitalize ${tab === t ? "bg-background shadow-sm text-primary" : "text-muted-foreground"}`}>
                {t === "editor" ? "Perguntas" : t === "theme" ? "Tema" : t === "integration" ? "CRM" : "Preview"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => saveQuiz(false)} disabled={isSaving}>
              <Save className="w-3 h-3" /> Salvar
            </Button>
            <Button size="sm" className="h-7 text-xs gap-1 font-bold" onClick={() => saveQuiz(true)} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />} Publicar
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* ── Editor Tab ── */}
          {tab === "editor" && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Título</label>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm focus:ring-2 focus:ring-primary/30 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Slug</label>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">/quiz/</span>
                    <input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                      placeholder="auto-gerado" className="flex-1 px-2 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm focus:ring-1 focus:ring-primary/30 outline-none" />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Descrição</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm resize-none outline-none" />
              </div>

              <div className="border-t border-border/30 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">Perguntas ({questions.length})</h4>
                  <div className="flex gap-1">
                    {QUESTION_TYPES.map(qt => (
                      <Button key={qt.value} variant="outline" size="sm" className="h-7 text-[10px] gap-1"
                        onClick={() => addQuestion(qt.value as any)}>
                        <qt.icon className="w-3 h-3" /> {qt.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="p-4 rounded-xl border border-border/40 bg-secondary/10">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">#{idx + 1}</span>
                        <span className="text-[10px] text-muted-foreground uppercase">{QUESTION_TYPES.find(t => t.value === q.type)?.label}</span>
                        <div className="ml-auto flex gap-0.5">
                          <button onClick={() => moveQuestion(idx, -1)} className="p-1 hover:bg-secondary rounded"><ArrowUp className="w-3 h-3 text-muted-foreground" /></button>
                          <button onClick={() => moveQuestion(idx, 1)} className="p-1 hover:bg-secondary rounded"><ArrowDown className="w-3 h-3 text-muted-foreground" /></button>
                          <button onClick={() => removeQuestion(q.id)} className="p-1 hover:bg-destructive/10 rounded"><Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" /></button>
                        </div>
                      </div>
                      <input value={q.title} onChange={e => updateQuestion(q.id, { title: e.target.value })}
                        placeholder="Pergunta..." className="w-full px-3 py-2 rounded-lg bg-background border border-border/40 text-sm mb-2 outline-none focus:ring-1 focus:ring-primary/30" />
                      {q.type === "multiple_choice" && (
                        <div className="space-y-1.5">
                          {q.options?.map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded-full border-2 border-border/40 shrink-0" />
                              <input value={opt} onChange={e => updateOption(q.id, oi, e.target.value)}
                                className="flex-1 px-2 py-1.5 rounded-md bg-background border border-border/30 text-xs outline-none" />
                              <button onClick={() => removeOption(q.id, oi)} className="p-0.5 hover:bg-destructive/10 rounded">
                                <X className="w-3 h-3 text-muted-foreground" />
                              </button>
                            </div>
                          ))}
                          <button onClick={() => addOption(q.id)} className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-1">
                            <Plus className="w-3 h-3" /> Adicionar opção
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {questions.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <ListChecks className="w-10 h-10 mx-auto mb-3 opacity-20" />
                      <p className="text-sm">Adicione perguntas acima ou use a IA no chat</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Theme Tab ── */}
          {tab === "theme" && (
            <div className="max-w-lg mx-auto space-y-4">
              <h4 className="font-semibold text-sm mb-4">Personalização Visual</h4>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">URL do Logo</label>
                <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm outline-none" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Posição do Logo</label>
                <select value={logoPosition} onChange={e => setLogoPosition(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm">
                  <option value="left">Esquerda</option>
                  <option value="center">Centro</option>
                  <option value="right">Direita</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: "bgColor", label: "Cor de Fundo" },
                  { key: "textColor", label: "Cor do Texto" },
                  { key: "buttonColor", label: "Cor do Botão" },
                  { key: "buttonTextColor", label: "Texto do Botão" },
                ].map(c => (
                  <div key={c.key}>
                    <label className="text-xs text-muted-foreground block mb-1">{c.label}</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={(theme as any)[c.key]}
                        onChange={e => setTheme(p => ({ ...p, [c.key]: e.target.value }))}
                        className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0" />
                      <input value={(theme as any)[c.key]}
                        onChange={e => setTheme(p => ({ ...p, [c.key]: e.target.value }))}
                        className="flex-1 px-2 py-1.5 rounded-md bg-secondary/50 border border-border/40 text-xs font-mono outline-none" />
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Fonte</label>
                <select value={theme.fontFamily} onChange={e => setTheme(p => ({ ...p, fontFamily: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm">
                  {["Inter", "Space Grotesk", "Poppins", "Playfair Display", "DM Sans", "Outfit"].map(f =>
                    <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="border-t border-border/30 pt-4">
                <h4 className="font-semibold text-sm mb-3">Pixels de Rastreamento</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Meta Pixel ID</label>
                    <input value={metaPixel} onChange={e => setMetaPixel(e.target.value)}
                      placeholder="123456789" className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm outline-none" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Google Analytics</label>
                    <input value={gaId} onChange={e => setGaId(e.target.value)}
                      placeholder="G-XXXXXXXXXX" className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm outline-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Integration Tab ── */}
          {tab === "integration" && (
            <div className="max-w-lg mx-auto space-y-6">
              <div className="bg-secondary/20 p-5 rounded-xl border border-border/30 space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Publicação e Domínio
                </h4>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Onde publicar este Quiz?</label>
                  <select 
                    value={selectedDomainId || ""} 
                    onChange={e => setSelectedDomainId(e.target.value || null)}
                    className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm outline-none"
                  >
                    <option value="">Apenas URL do Sistema (Slug Nativo)</option>
                    {availableDomains.map(d => (
                      <option key={d.id} value={d.id}>{d.is_native ? "Domínio Nativo" : d.domain} ({d.slug || "raiz"})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5">Slug Personalizado (Caminho)</label>
                  <input 
                    value={slug} 
                    onChange={e => setSlug(e.target.value)}
                    placeholder="meu-quiz-exclusivo" 
                    className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm outline-none" 
                  />
                </div>
              </div>

              <div className="bg-secondary/20 p-5 rounded-xl border border-border/30 space-y-4">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Kanban className="w-4 h-4 text-primary" /> Integração CRM
                </h4>
                <p className="text-[11px] text-muted-foreground">Ao finalizar o quiz, o lead será automaticamente adicionado à pipeline e etapa selecionadas.</p>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Pipeline</label>
                  <select value={crmFunnelId || ""} onChange={e => { setCrmFunnelId(e.target.value || null); setCrmStageId(null); }}
                    className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm">
                    <option value="">Nenhuma (sem integração)</option>
                    {funnels?.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                {crmFunnelId && (
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Etapa de Destino</label>
                    <select value={crmStageId || ""} onChange={e => setCrmStageId(e.target.value || null)}
                      className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm">
                      <option value="">Primeira etapa</option>
                      {crmStages?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Preview Tab ── */}
          {tab === "preview" && (
            <div className="flex items-center justify-center h-full">
              <div className="w-full max-w-md bg-background rounded-xl shadow-2xl overflow-hidden" style={{ height: "70vh" }}>
                <iframe srcDoc={buildPreviewHtml()} className="w-full h-full border-0" title="Quiz Preview" sandbox="allow-scripts" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: AI Chat ── */}
      <div className="w-72 border-l border-border flex flex-col shrink-0">
        <div className="h-12 border-b border-border flex items-center gap-2 px-4">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <h3 className="font-bold text-xs uppercase tracking-wider">IA Quiz Builder</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {chatMsgs.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bot className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-xs font-medium mb-1">Gerador de Quiz por IA</p>
              <p className="text-[11px] opacity-70 mb-4">Descreva o quiz que deseja criar</p>
              {TEMPLATES.map(t => (
                <button key={t.name} onClick={() => setChatInput(t.prompt)}
                  className="block w-full text-left px-3 py-2 rounded-lg bg-secondary/50 text-[10px] hover:bg-secondary transition-colors mb-1">
                  ✨ {t.name}
                </button>
              ))}
            </div>
          )}
          {chatMsgs.map(msg => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-xs prose-invert max-w-none"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                ) : <p>{msg.content}</p>}
              </div>
            </div>
          ))}
          {aiLoading && (
            <div className="flex justify-start">
              <div className="bg-secondary px-3 py-2 rounded-xl flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                <span className="text-[10px] text-muted-foreground">Gerando quiz...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <div className="border-t border-border p-3">
          <div className="flex gap-2">
            <textarea value={chatInput} onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
              placeholder="Descreva o quiz..." rows={2} disabled={aiLoading}
              className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-xs focus:ring-2 focus:ring-primary/30 outline-none resize-none" />
            <button onClick={handleChat} disabled={aiLoading || !chatInput.trim()}
              className="self-end p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminQuizBuilder;
