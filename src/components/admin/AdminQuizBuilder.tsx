import { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, Save, Loader2, Sparkles, Send, Eye, Copy, Check,
  ExternalLink, Image, Palette, Settings, X, Bot, Code,
  ListChecks, MessageSquare, Phone, Mail,
  LayoutGrid, Timer, Zap, Webhook, BarChart3, ChevronRight, Split, Globe,
  Link2, Files, TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFunnels, useStages } from "@/hooks/useSupabaseQuery";
import { useAIBuilder } from "@/hooks/useAIBuilder";
import { Button } from "@/components/ui/button";
import QuizPreview from "./QuizPreview";

interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "text" | "phone" | "email" | "image_grid";
  title: string;
  options?: string[];
  image_options?: { label: string; url: string }[];
  required?: boolean;
  logic?: {
    action: "go_to" | "finish";
    destination?: string;
    condition_value?: string;
  }[];
  // Configurações granulares por pergunta
  auto_advance?: boolean;
  enable_fake_loading?: boolean;
  fake_loading_text?: string;
  button_text?: string; // Customizar texto do botão de continuar
  // Design premium
  background_image?: string; // Base64 ou URL
  card_style?: "default" | "bento" | "glassmorphism" | "minimal";
  option_style?: "pills" | "cards" | "bento-grid" | "radio"; // Estilos de opções
}

interface QuizTheme {
  bgColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontFamily: string;
  // Cores adicionais para design premium
  accentColor?: string;
  cardBgColor?: string;
  cardBorderColor?: string;
  cardShadow?: string;
  gradientStart?: string;
  gradientEnd?: string;
  backdropBlur?: boolean;
}

interface QuizSettings {
  auto_advance: boolean;
  show_progress_bar: boolean;
  enable_fake_loading: boolean;
  fake_loading_text: string;
  enable_timer: boolean;
  timer_seconds: number;
  piping_enabled: boolean;
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
  webhook_url?: string;
  custom_scripts?: string;
  settings?: QuizSettings;
  created_at: string;
}

interface ChatMsg { id: string; role: "user" | "assistant"; content: string; }

const DEFAULT_THEME: QuizTheme = {
  bgColor: "#0f172a", textColor: "#ffffff", buttonColor: "#FBBF24", buttonTextColor: "#000000", fontFamily: "Inter",
};

const DEFAULT_SETTINGS: QuizSettings = {
  auto_advance: true,
  show_progress_bar: true,
  enable_fake_loading: true,
  fake_loading_text: "Analisando perfil...",
  enable_timer: false,
  timer_seconds: 300,
  piping_enabled: true
};

const QUESTION_TYPES = [
  { value: "multiple_choice", label: "Múltipla Escolha", icon: ListChecks },
  { value: "image_grid", label: "Grade de Imagens", icon: LayoutGrid },
  { value: "text", label: "Texto Longo", icon: MessageSquare },
  { value: "phone", label: "Telefone", icon: Phone },
  { value: "email", label: "Email", icon: Mail },
];

const AdminQuizBuilder = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [tab, setTab] = useState<"editor" | "theme" | "settings" | "analytics" | "integrations">("editor");
  const [isSaving, setIsSaving] = useState(false);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  
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
  const [webhookUrl, setWebhookUrl] = useState("");
  const [customScripts, setCustomScripts] = useState("");
  const [settings, setSettings] = useState<QuizSettings>(DEFAULT_SETTINGS);

  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const { generatePage, isLoading: aiLoading } = useAIBuilder();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: funnels } = useFunnels();
  const { data: crmStages } = useStages(crmFunnelId);

  useEffect(() => { loadQuizzes(); }, []);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMsgs]);

  const loadQuizzes = async () => {
    const { data } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false });
    if (data) setQuizzes(data as any as Quiz[]);
  };

  const loadAnalytics = async (quizId: string) => {
    setAnalyticsLoading(true);
    const [{ data: analyticsData }, { data: submissionsData }] = await Promise.all([
      (supabase
        .from("quiz_analytics" as any)
        .select("*")
        .eq("quiz_id", quizId) as any)
        .order("created_at", { ascending: true }),
      supabase
        .from("quiz_submissions")
        .select("id, created_at")
        .eq("quiz_id", quizId)
    ]);
    if (analyticsData) setAnalytics(analyticsData);
    if (submissionsData) setSubmissions(submissionsData);
    setAnalyticsLoading(false);
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
    setWebhookUrl(q.webhook_url || "");
    setCustomScripts(q.custom_scripts || "");
    setSettings(q.settings || DEFAULT_SETTINGS);
    setTab("editor");
    loadAnalytics(q.id);
  };

  const saveQuiz = async (publish = false) => {
    setIsSaving(true);
    try {
      const payload: any = {
        title, slug, description, logo_url: logoUrl, logo_position: logoPosition,
        theme, questions, status: publish ? "published" : (activeQuiz?.status || "draft"),
        crm_funnel_id: crmFunnelId, crm_stage_id: crmStageId,
        meta_pixel_id: metaPixel, ga_id: gaId,
        webhook_url: webhookUrl, custom_scripts: customScripts,
        settings
      };

      if (activeQuiz) {
        await supabase.from("quizzes").update(payload).eq("id", activeQuiz.id);
        toast.success("Quiz atualizado!");
      } else {
        const { data } = await supabase.from("quizzes").insert(payload as any).select().single();
        if (data) setActiveQuiz(data as any);
        toast.success("Quiz criado!");
      }
      loadQuizzes();
    } catch (err) {
      toast.error("Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  const addQuestion = (type: QuizQuestion["type"] = "multiple_choice") => {
    const newQ: QuizQuestion = {
      id: `q_${Date.now()}`,
      type,
      title: "Nova Pergunta",
      options: type === "multiple_choice" ? ["Opção 1", "Opção 2"] : undefined,
      image_options: type === "image_grid" ? [{ label: "Opção 1", url: "" }] : undefined,
      required: true,
      logic: []
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (id: string, updates: Partial<QuizQuestion>) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content: chatInput };
    setChatMsgs(prev => [...prev, userMsg]);
    const input = chatInput;
    setChatInput("");

    const systemPrompt = `Você é um especialista em criação de quizzes PREMIUM de alta conversão com design de agências de elite.

Gere um Quiz em formato JSON com design moderno e impactante:
{
  "title": "Nome do Quiz Impactante",
  "description": "Descrição curta e persuasiva",
  "theme": {
    "bgColor": "#0f172a",
    "textColor": "#ffffff",
    "buttonColor": "#FBBF24",
    "buttonTextColor": "#000000",
    "fontFamily": "Inter",
    "accentColor": "#3B82F6",
    "cardBgColor": "rgba(255,255,255,0.08)",
    "gradientStart": "#0f172a",
    "gradientEnd": "#1e293b",
    "backdropBlur": true
  },
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice" | "image_grid" | "text" | "email" | "phone",
      "title": "Pergunta impactante",
      "options": ["Opção 1", "Opção 2"],
      "image_options": [{"label": "Opção 1", "url": "https://..."}, ...],
      "required": true,
      "logic": [{"action": "go_to", "destination": "q2", "condition_value": "Opção 1"}],
      "auto_advance": false,
      "enable_fake_loading": true,
      "fake_loading_text": "Analisando sua resposta...",
      "button_text": "CONTINUAR",
      "card_style": "glassmorphism",
      "option_style": "cards"
    }
  ]
}

DIRETRIZES DE DESIGN PREMIUM:
- card_style: use \"glassmorphism\" para visual sofisticado
- option_style: use \"cards\" para múltipla escolha, \"pills\" para espaço reduzido, \"bento-grid\" para imagens
- auto_advance: false para perguntas que precisam de clique, true para auto-avançar
- enable_fake_loading: true para criar suspense nos resultados
- button_text: customize com \"DESCOBRIR\", \"REVELAR\", \"CONTINUAR\", \"PRÓXIMO\", etc
- CRIE PERGUNTAS QUE ARRANQUEM \"UAUS\" DO USUÁRIO NO PRIMEIRO PROMPT
- Estruture para máxima conversão: impacto inicial → perguntas relevantes → captura de lead

Pedido: \"${input}\"

Retorne APENAS o JSON puro, sem markdown.`;

    try {
      let fullRaw = "";
      await generatePage(systemPrompt, (delta) => { fullRaw += delta; }, () => {
        if (!fullRaw.trim()) {
          setChatMsgs(prev => [...prev, {
            id: Date.now().toString(),
            role: "assistant",
            content: "❌ Erro: Nenhuma resposta recebida. Tente novamente."
          }]);
          return;
        }

        try {
          const cleaned = fullRaw.replace(/\`\`\`json?\s*/g, "").replace(/\`\`\`/g, "").trim();
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          
          if (!jsonMatch) throw new Error("JSON não encontrado");

          const parsed = JSON.parse(jsonMatch[0]);
          
          if (!parsed.questions || !Array.isArray(parsed.questions)) {
            throw new Error("Estrutura inválida");
          }

          if (parsed.title) setTitle(parsed.title);
          if (parsed.description) setDescription(parsed.description);
          
          setQuestions(parsed.questions.map((q: any, i: number) => ({
            id: q.id || `q${i}`,
            type: q.type || "multiple_choice",
            title: q.title || "",
            options: q.options || [],
            image_options: q.image_options || [],
            required: q.required !== false,
            logic: q.logic || [],
            auto_advance: q.auto_advance ?? false,
            enable_fake_loading: q.enable_fake_loading ?? true,
            fake_loading_text: q.fake_loading_text || "Analisando sua resposta...",
            button_text: q.button_text || "CONTINUAR",
            card_style: q.card_style || "glassmorphism",
            option_style: q.option_style || "cards"
          })));
          
          if (parsed.theme) {
            setTheme(prev => ({
              ...prev,
              ...parsed.theme
            }));
          }

          setChatMsgs(prev => [...prev, {
            id: Date.now().toString(),
            role: "assistant",
            content: `✅ Quiz gerado! ${parsed.questions?.length || 0} perguntas criadas. Veja o preview ao lado!`
          }]);
        } catch (err: any) {
          console.error("Erro:", err);
          setChatMsgs(prev => [...prev, {
            id: Date.now().toString(),
            role: "assistant",
            content: "❌ Erro ao processar. Tente descrever de forma mais clara."
          }]);
        }
      });
    } catch (err: any) {
      console.error("Erro geral:", err);
      setChatMsgs(prev => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "❌ Erro ao conectar com a IA."
      }]);
    }
    
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  if (!activeQuiz) {
    return (
      <div className="h-[calc(100vh-120px)] flex flex-col -m-6 bg-background">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black">Meus Quizzes</h2>
              <Button onClick={() => { setActiveQuiz({} as any); setTitle("Novo Quiz"); setQuestions([]); }} className="gap-2">
                <Plus className="w-4 h-4" /> Novo Quiz
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quizzes.map(q => (
                <div key={q.id} className="p-6 rounded-2xl border border-border/40 hover:border-border transition-all space-y-4 group" onClick={() => openQuiz(q)}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{q.title}</h3>
                      <p className="text-xs text-muted-foreground">{q.questions?.length || 0} perguntas</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${q.status === "published" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"}`}>
                      {q.status === "published" ? "LIVE" : "DRAFT"}
                    </span>
                  </div>
                  <p className="text-sm opacity-70 line-clamp-2">{q.description}</p>
                  <div className="flex items-center gap-2 pt-2 border-t border-border/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Visualizar no link público */}
                    <button
                      onClick={(e) => { e.stopPropagation(); window.open(`/quiz/${q.slug}`, "_blank"); }}
                      className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      title="Visualizar quiz público"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* Copiar Link — ícone de corrente/link */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(window.location.origin + `/quiz/${q.slug}`);
                        toast.success("Link copiado!", { description: window.location.origin + `/quiz/${q.slug}` });
                      }}
                      className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      title="Copiar link público"
                    >
                      <Link2 className="w-4 h-4" />
                    </button>

                    {/* Duplicar — ícone de múltiplos arquivos */}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        const { data } = await supabase.from("quizzes").insert({
                          title: q.title + " (Cópia)",
                          slug: q.slug + "-copia-" + Date.now(),
                          description: q.description,
                          logo_url: q.logo_url,
                          logo_position: q.logo_position,
                          theme: q.theme,
                          questions: q.questions,
                          status: "draft",
                          crm_funnel_id: q.crm_funnel_id,
                          crm_stage_id: q.crm_stage_id,
                          meta_pixel_id: q.meta_pixel_id,
                          ga_id: q.ga_id,
                          webhook_url: q.webhook_url,
                          custom_scripts: q.custom_scripts,
                          settings: q.settings,
                        }).select().single();
                        if (data) {
                          loadQuizzes();
                          toast.success("Quiz duplicado!", { description: `"${data.title}" criado como rascunho.` });
                        }
                      }}
                      className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      title="Duplicar quiz"
                    >
                      <Files className="w-4 h-4" />
                    </button>

                    {/* Analytics — atalho direto para aba analytics */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openQuiz(q);
                        setTab("analytics");
                      }}
                      className="p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      title="Ver Analytics"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>

                    {/* Excluir */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Excluir "${q.title}"? Esta ação não pode ser desfeita.`)) {
                          supabase.from("quizzes").delete().eq("id", q.id).then(() => {
                            loadQuizzes();
                            toast.success("Quiz excluído.");
                          });
                        }
                      }}
                      className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive ml-auto transition-colors"
                      title="Excluir quiz"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col -m-6 bg-background">
      {/* Top Bar */}
      <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-background z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveQuiz(null)} className="text-sm font-bold opacity-60 hover:opacity-100">← Voltar</button>
          <div className="flex bg-secondary/50 p-1 rounded-lg border border-border/40">
            {[
              { id: "editor", label: "Perguntas", icon: ListChecks },
              { id: "theme", label: "Design", icon: Palette },
              { id: "settings", label: "Configurações", icon: Settings },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
              { id: "integrations", label: "Integrações", icon: Settings },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${tab === t.id ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <t.icon className="w-3.5 h-3.5" /> {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => window.open(`/quiz/${slug}`, '_blank')} className="gap-2 h-9">
            <Eye className="w-4 h-4" /> Visualizar
          </Button>
          <Button size="sm" onClick={() => saveQuiz(true)} disabled={isSaving} className="gap-2 h-9 font-bold bg-primary text-primary-foreground">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Publicar
          </Button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className="flex-1 overflow-y-auto p-8 bg-secondary/10">
          <div className="max-w-3xl mx-auto">
            {tab === "editor" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-black">Estrutura do Quiz</h3>
                  <div className="flex gap-2">
                    {QUESTION_TYPES.map(type => (
                      <Button key={type.value} variant="outline" size="sm" onClick={() => addQuestion(type.value as any)} className="h-8 text-[10px] gap-1.5">
                        <type.icon className="w-3 h-3" /> {type.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {questions.length === 0 && (
                  <div className="p-12 border-2 border-dashed border-border/40 rounded-3xl text-center space-y-4">
                    <Sparkles className="w-10 h-10 text-primary/40 mx-auto" />
                    <p className="text-muted-foreground">Seu quiz está vazio. Use a IA ao lado ou adicione perguntas manualmente.</p>
                  </div>
                )}

                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="group bg-background border border-border/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</div>
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center justify-between gap-4">
                            <input 
                              value={q.title} 
                              onChange={e => updateQuestion(q.id, { title: e.target.value })}
                              placeholder="Título da pergunta..."
                              className="flex-1 bg-transparent text-lg font-bold outline-none border-b border-transparent focus:border-primary/30 pb-1"
                            />
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeQuestion(q.id)}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>

                          {(q.type === "multiple_choice" || q.type === "image_grid") && (
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                {q.type === "multiple_choice" && q.options?.map((opt, oIdx) => (
                                  <div key={oIdx} className="flex items-center gap-2 bg-secondary/30 p-2 rounded-xl border border-border/20">
                                    <input 
                                      value={opt} 
                                      onChange={e => {
                                        const newOpts = [...(q.options || [])];
                                        newOpts[oIdx] = e.target.value;
                                        updateQuestion(q.id, { options: newOpts });
                                      }}
                                      className="flex-1 bg-transparent text-sm outline-none px-2"
                                    />
                                    <button onClick={() => {
                                      const newOpts = q.options?.filter((_, i) => i !== oIdx);
                                      updateQuestion(q.id, { options: newOpts });
                                    }} className="text-muted-foreground hover:text-destructive"><X className="w-3.5 h-3.5" /></button>
                                  </div>
                                ))}
                                {q.type === "image_grid" && q.image_options?.map((opt, oIdx) => (
                                  <div key={oIdx} className="space-y-2 bg-secondary/30 p-3 rounded-xl border border-border/20">
                                    <input 
                                      value={opt.url} 
                                      onChange={e => {
                                        const newOpts = [...(q.image_options || [])];
                                        newOpts[oIdx] = { ...opt, url: e.target.value };
                                        updateQuestion(q.id, { image_options: newOpts });
                                      }}
                                      placeholder="URL da Imagem"
                                      className="w-full bg-background/50 text-[10px] p-1.5 rounded border border-border/20 outline-none"
                                    />
                                    <div className="flex items-center gap-2">
                                      <input 
                                        value={opt.label} 
                                        onChange={e => {
                                          const newOpts = [...(q.image_options || [])];
                                          newOpts[oIdx] = { ...opt, label: e.target.value };
                                          updateQuestion(q.id, { image_options: newOpts });
                                        }}
                                        placeholder="Rótulo"
                                        className="flex-1 bg-transparent text-xs outline-none"
                                      />
                                      <button onClick={() => {
                                        const newOpts = q.image_options?.filter((_, i) => i !== oIdx);
                                        updateQuestion(q.id, { image_options: newOpts });
                                      }} className="text-muted-foreground hover:text-destructive"><X className="w-3.5 h-3.5" /></button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => {
                                if (q.type === "multiple_choice") updateQuestion(q.id, { options: [...(q.options || []), "Nova Opção"] });
                                else updateQuestion(q.id, { image_options: [...(q.image_options || []), { label: "Nova Opção", url: "" }] });
                              }} className="text-[10px] h-7 gap-1.5 opacity-60 hover:opacity-100">
                                <Plus className="w-3 h-3" /> Adicionar Opção
                              </Button>
                            </div>
                          )}

                          {/* Configurações Granulares da Pergunta */}
                          <div className="pt-4 border-t border-border/30 space-y-4">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                              <Settings className="w-3 h-3" /> Configurações da Pergunta
                            </h5>
                            <div className="grid grid-cols-2 gap-3">
                              <label className="flex items-center gap-2 p-2 rounded-lg border border-border/20 bg-secondary/20 cursor-pointer hover:bg-secondary/30">
                                <input
                                  type="checkbox"
                                  checked={q.auto_advance ?? false}
                                  onChange={e => updateQuestion(q.id, { auto_advance: e.target.checked })}
                                  className="w-3 h-3"
                                />
                                <div className="text-[10px]">
                                  <p className="font-bold">Auto-Advance</p>
                                  <p className="text-muted-foreground">Avançar automaticamente</p>
                                </div>
                              </label>
                              <label className="flex items-center gap-2 p-2 rounded-lg border border-border/20 bg-secondary/20 cursor-pointer hover:bg-secondary/30">
                                <input
                                  type="checkbox"
                                  checked={q.enable_fake_loading ?? true}
                                  onChange={e => updateQuestion(q.id, { enable_fake_loading: e.target.checked })}
                                  className="w-3 h-3"
                                />
                                <div className="text-[10px]">
                                  <p className="font-bold">Fake Loading</p>
                                  <p className="text-muted-foreground">Mostrar processamento</p>
                                </div>
                              </label>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold">Texto do Botão</label>
                              <input
                                value={q.button_text || "CONTINUAR"}
                                onChange={e => updateQuestion(q.id, { button_text: e.target.value })}
                                placeholder="CONTINUAR, DESCOBRIR, REVELAR, etc"
                                className="w-full bg-background/50 text-[10px] p-2 rounded border border-border/20 outline-none"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold">Estilo do Card</label>
                              <select
                                value={q.card_style || "glassmorphism"}
                                onChange={e => updateQuestion(q.id, { card_style: e.target.value as any })}
                                className="w-full bg-background/50 text-[10px] p-2 rounded border border-border/20 outline-none"
                              >
                                <option value="default">Padrão</option>
                                <option value="glassmorphism">Glassmorphism</option>
                                <option value="bento">Bento Grid</option>
                                <option value="minimal">Minimalista</option>
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold">Estilo das Opções</label>
                              <select
                                value={q.option_style || "cards"}
                                onChange={e => updateQuestion(q.id, { option_style: e.target.value as any })}
                                className="w-full bg-background/50 text-[10px] p-2 rounded border border-border/20 outline-none"
                              >
                                <option value="cards">Cards</option>
                                <option value="pills">Pills</option>
                                <option value="bento-grid">Bento Grid</option>
                                <option value="radio">Radio</option>
                              </select>
                            </div>
                          </div>

                          {/* Logic Editor */}
                          <div className="pt-4 border-t border-border/30">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                              <Split className="w-3 h-3" /> Lógica Condicional
                            </h5>
                            <div className="space-y-2">
                              {q.logic?.map((rule, rIdx) => (
                                <div key={rIdx} className="flex items-center gap-2 bg-secondary/20 p-2 rounded-lg text-[10px]">
                                  <span className="opacity-60">Se resposta for:</span>
                                  <input 
                                    value={rule.condition_value || ""} 
                                    onChange={e => {
                                      const newLogic = [...(q.logic || [])];
                                      newLogic[rIdx] = { ...rule, condition_value: e.target.value };
                                      updateQuestion(q.id, { logic: newLogic });
                                    }}
                                    className="flex-1 bg-background/50 px-1.5 py-1 rounded border border-border/20 outline-none"
                                  />
                                  <span className="opacity-60">→</span>
                                  <select 
                                    value={rule.action} 
                                    onChange={e => {
                                      const newLogic = [...(q.logic || [])];
                                      newLogic[rIdx] = { ...rule, action: e.target.value as any };
                                      updateQuestion(q.id, { logic: newLogic });
                                    }}
                                    className="bg-background/50 px-1.5 py-1 rounded border border-border/20 outline-none text-[10px]"
                                  >
                                    <option value="go_to">Ir para</option>
                                    <option value="finish">Finalizar</option>
                                  </select>
                                  {rule.action === "go_to" && (
                                    <select 
                                      value={rule.destination || ""} 
                                      onChange={e => {
                                        const newLogic = [...(q.logic || [])];
                                        newLogic[rIdx] = { ...rule, destination: e.target.value };
                                        updateQuestion(q.id, { logic: newLogic });
                                      }}
                                      className="bg-background/50 px-1.5 py-1 rounded border border-border/20 outline-none text-[10px]"
                                    >
                                      <option value="">Selecione</option>
                                      {questions.map(qq => <option key={qq.id} value={qq.id}>{qq.title}</option>)}
                                    </select>
                                  )}
                                  <button onClick={() => {
                                    const newLogic = q.logic?.filter((_, i) => i !== rIdx);
                                    updateQuestion(q.id, { logic: newLogic });
                                  }} className="text-destructive hover:text-destructive/80"><X className="w-3 h-3" /></button>
                                </div>
                              ))}
                              <Button variant="ghost" size="sm" onClick={() => {
                                const newLogic = [...(q.logic || []), { action: "go_to" as const, condition_value: "", destination: "" }];
                                updateQuestion(q.id, { logic: newLogic });
                              }} className="text-[10px] h-6 gap-1 opacity-60 hover:opacity-100">
                                <Plus className="w-3 h-3" /> Regra
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "theme" && (
              <div className="space-y-6">
                <h3 className="text-xl font-black">Personalização de Design</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Cor de Fundo</label>
                    <input type="color" value={theme.bgColor} onChange={e => setTheme({...theme, bgColor: e.target.value})} className="w-full h-10 rounded-lg cursor-pointer" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Cor de Texto</label>
                    <input type="color" value={theme.textColor} onChange={e => setTheme({...theme, textColor: e.target.value})} className="w-full h-10 rounded-lg cursor-pointer" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Cor do Botão</label>
                    <input type="color" value={theme.buttonColor} onChange={e => setTheme({...theme, buttonColor: e.target.value})} className="w-full h-10 rounded-lg cursor-pointer" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase">Cor do Texto do Botão</label>
                    <input type="color" value={theme.buttonTextColor} onChange={e => setTheme({...theme, buttonTextColor: e.target.value})} className="w-full h-10 rounded-lg cursor-pointer" />
                  </div>
                </div>
              </div>
            )}

            {tab === "settings" && (
              <div className="space-y-6">
                <h3 className="text-xl font-black">Configurações Avançadas</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-4 rounded-lg border border-border/40 cursor-pointer hover:bg-secondary/20">
                    <input type="checkbox" checked={settings.auto_advance} onChange={e => setSettings({...settings, auto_advance: e.target.checked})} className="w-4 h-4" />
                    <div>
                      <p className="text-sm font-bold">Auto-Advance</p>
                      <p className="text-xs text-muted-foreground">Avança automaticamente após selecionar uma resposta</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-4 rounded-lg border border-border/40 cursor-pointer hover:bg-secondary/20">
                    <input type="checkbox" checked={settings.enable_fake_loading} onChange={e => setSettings({...settings, enable_fake_loading: e.target.checked})} className="w-4 h-4" />
                    <div>
                      <p className="text-sm font-bold">Fake Loading</p>
                      <p className="text-xs text-muted-foreground">Mostra tela de processamento antes dos resultados</p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {tab === "analytics" && (() => {
              // Calcular KPIs a partir dos dados reais
              const uniqueSessions = new Set(analytics.map((a: any) => a.session_id)).size;
              const totalLeads = submissions.length;
              const conversionRate = uniqueSessions > 0 ? ((totalLeads / uniqueSessions) * 100).toFixed(1) : "0.0";

              // Calcular drop-off por etapa
              const stepViews: Record<string, number> = {};
              analytics.filter((a: any) => a.event_type === "view").forEach((a: any) => {
                stepViews[a.step_id] = (stepViews[a.step_id] || 0) + 1;
              });

              // Ordenar etapas: start, perguntas em ordem, lead_capture
              const orderedStepIds = [
                "start",
                ...questions.map(q => q.id),
                "lead_capture",
              ].filter(id => stepViews[id] !== undefined);

              const maxViews = Math.max(...Object.values(stepViews), 1);

              return (
                <div className="space-y-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black">Analytics</h3>
                    <button
                      onClick={() => activeQuiz?.id && loadAnalytics(activeQuiz.id)}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors"
                    >
                      <TrendingUp className="w-3.5 h-3.5" /> Atualizar
                    </button>
                  </div>

                  {analyticsLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {/* KPI Cards */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 rounded-2xl border border-border/40 bg-background space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Visualizações</p>
                          <p className="text-3xl font-black">{uniqueSessions.toLocaleString("pt-BR")}</p>
                          <p className="text-[10px] text-muted-foreground">Sessões únicas iniciadas</p>
                        </div>
                        <div className="p-5 rounded-2xl border border-border/40 bg-background space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Leads Capturados</p>
                          <p className="text-3xl font-black text-emerald-500">{totalLeads.toLocaleString("pt-BR")}</p>
                          <p className="text-[10px] text-muted-foreground">Formulários enviados</p>
                        </div>
                        <div className="p-5 rounded-2xl border border-border/40 bg-background space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Taxa de Conversão</p>
                          <p className="text-3xl font-black text-primary">{conversionRate}%</p>
                          <p className="text-[10px] text-muted-foreground">Sessões → Leads</p>
                        </div>
                        <div className="p-5 rounded-2xl border border-border/40 bg-background space-y-1">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Drop-off Médio</p>
                          <p className="text-3xl font-black text-orange-400">
                            {uniqueSessions > 0 ? (100 - parseFloat(conversionRate)).toFixed(1) : "0.0"}%
                          </p>
                          <p className="text-[10px] text-muted-foreground">Abandonaram sem converter</p>
                        </div>
                      </div>

                      {/* Funil de Drop-off por Etapa */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Funil por Etapa</h4>
                        {orderedStepIds.length === 0 ? (
                          <div className="p-8 rounded-2xl border border-dashed border-border/40 text-center">
                            <BarChart3 className="w-8 h-8 mx-auto text-muted-foreground/30 mb-3" />
                            <p className="text-sm text-muted-foreground">Nenhum dado ainda. Compartilhe o link público para começar a coletar dados.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {orderedStepIds.map((stepId, idx) => {
                              const views = stepViews[stepId] || 0;
                              const prevViews = idx > 0 ? (stepViews[orderedStepIds[idx - 1]] || 0) : views;
                              const dropPct = prevViews > 0 ? (((prevViews - views) / prevViews) * 100).toFixed(0) : "0";
                              const barWidth = (views / maxViews) * 100;
                              const stepLabel = stepId === "start" ? "Início" : stepId === "lead_capture" ? "Captura de Lead" : (questions.find(q => q.id === stepId)?.title?.slice(0, 40) || stepId);

                              return (
                                <div key={stepId} className="space-y-1">
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="font-medium text-foreground/70 truncate max-w-[60%]">{stepLabel}</span>
                                    <div className="flex items-center gap-3">
                                      {idx > 0 && parseInt(dropPct) > 0 && (
                                        <span className="text-red-400 font-bold">-{dropPct}%</span>
                                      )}
                                      <span className="font-black">{views.toLocaleString("pt-BR")} views</span>
                                    </div>
                                  </div>
                                  <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full transition-all duration-700"
                                      style={{
                                        width: `${barWidth}%`,
                                        backgroundColor: stepId === "lead_capture" ? "#10b981" : stepId === "start" ? "#6366f1" : "#FBBF24",
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {/* Últimas conversões */}
                      {submissions.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-black uppercase tracking-widest text-muted-foreground">Últimas Conversões</h4>
                          <div className="space-y-2">
                            {submissions.slice(-5).reverse().map((s: any) => (
                              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 text-xs">
                                <span className="font-mono text-muted-foreground">{s.id.slice(0, 8)}...</span>
                                <span className="text-muted-foreground">{new Date(s.created_at).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })()}

            {tab === "integrations" && (
              <div className="space-y-6">
                <h3 className="text-xl font-black">Publicação & Integrações</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase block mb-2">Slug (URL)</label>
                    <input type="text" value={slug} onChange={e => setSlug(e.target.value)} placeholder="meu-quiz" className="w-full bg-background/50 border border-border/40 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30" />
                    <p className="text-[10px] text-muted-foreground mt-1">Link: {window.location.origin}/quiz/{slug}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase block mb-2">Domínio</label>
                    <select className="w-full bg-background/50 border border-border/40 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30">
                      <option>Sistema Nativo</option>
                      <option>Meu Domínio 1</option>
                      <option>Meu Domínio 2</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase block mb-2">Meta Pixel ID</label>
                    <input type="text" placeholder="123456789" className="w-full bg-background/50 border border-border/40 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase block mb-2">Google Analytics ID</label>
                    <input type="text" placeholder="G-XXXXXXXXXX" className="w-full bg-background/50 border border-border/40 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase block mb-2">Webhook URL</label>
                    <input type="text" placeholder="https://seu-servidor.com/webhook" className="w-full bg-background/50 border border-border/40 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30" />
                    <p className="text-[10px] text-muted-foreground mt-1">Recebe POST JSON com respostas ao finalizar</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase block mb-2">Scripts Customizados</label>
                    <textarea placeholder="&lt;script&gt;...&lt;/script&gt;" rows={4} className="w-full bg-background/50 border border-border/40 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/30 font-mono resize-none" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-96 border-l border-border bg-secondary/10 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto flex items-center justify-center p-4">
            <div className="w-full h-full bg-background rounded-xl shadow-lg overflow-hidden border border-border/40">
              <QuizPreview
                title={title}
                description={description}
                logoUrl={logoUrl}
                questions={questions}
                theme={theme}
                settings={settings}
              />
            </div>
          </div>
        </div>

        {/* AI Chat Sidebar */}
        <div className="w-80 border-l border-border bg-background flex flex-col shrink-0">
          <div className="h-14 border-b border-border flex items-center gap-2 px-4">
            <Bot className="w-4 h-4 text-primary" />
            <h3 className="font-black text-xs uppercase tracking-widest">IA Quiz Master</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMsgs.length === 0 && (
              <div className="text-center py-6 space-y-4">
                <Sparkles className="w-10 h-10 mx-auto text-primary/40" />
                <div className="space-y-2">
                  <p className="text-xs font-black uppercase tracking-tighter">Templates Rápidos</p>
                  <div className="space-y-2">
                    {[
                      { name: "Estética", prompt: "Crie um quiz de captacao para clinica de estetica com 4 perguntas sobre tipo de pele, tratamentos e orcamento. Use logica condicional." },
                      { name: "B2B", prompt: "Quiz para qualificar leads B2B com perguntas sobre tamanho da empresa, orcamento e urgencia. Use imagens para opcoes." },
                      { name: "Fitness", prompt: "Quiz para personal trainer com 5 perguntas sobre objetivo, frequencia de treino e disponibilidade. Ative fake loading e timer." },
                    ].map((t, i) => (
                      <button key={i} onClick={() => { setChatInput(t.prompt); }} className="block w-full text-left px-3 py-2 rounded-lg bg-secondary/50 hover:bg-secondary text-[10px] font-bold transition-colors text-primary">
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {chatMsgs.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-3 rounded-2xl text-xs ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  <div className="whitespace-pre-wrap">{m.content}</div>
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary p-3 rounded-2xl flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  <span className="text-[10px] font-bold">Gerando...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="p-4 border-t border-border">
            <div className="relative">
              <textarea 
                value={chatInput} 
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
                placeholder="Descreva seu quiz..." 
                rows={3}
                disabled={aiLoading}
                className="w-full bg-secondary/50 border border-border/40 rounded-2xl p-4 pr-12 text-xs outline-none resize-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
              />
              <button onClick={handleChat} disabled={aiLoading || !chatInput.trim()} className="absolute right-3 bottom-3 p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminQuizBuilder;
