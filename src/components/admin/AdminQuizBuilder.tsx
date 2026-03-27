import { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, Save, Globe, Loader2, Sparkles, Send, Eye, Copy, Check,
  ExternalLink, GripVertical, Image, Palette, Settings, X, Bot, Code,
  ListChecks, MessageSquare, Phone, Mail, ArrowUp, ArrowDown,
  LayoutGrid, Timer, Zap, Webhook, BarChart3, ChevronRight, Split
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFunnels, useStages } from "@/hooks/useSupabaseQuery";
import { useAIBuilder } from "@/hooks/useAIBuilder";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";

/* ── types ── */
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
}

interface QuizTheme {
  bgColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontFamily: string;
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

/* ═══════ COMPONENT ═══════ */
const AdminQuizBuilder = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [tab, setTab] = useState<"editor" | "theme" | "settings" | "analytics">("editor");
  const [isSaving, setIsSaving] = useState(false);
  const [analytics, setAnalytics] = useState<any[]>([]);
  
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
  const [webhookUrl, setWebhookUrl] = useState("");
  const [customScripts, setCustomScripts] = useState("");
  const [settings, setSettings] = useState<QuizSettings>(DEFAULT_SETTINGS);

  /* ── AI Chat ── */
  const [chatMsgs, setChatMsgs] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const { generatePage, isLoading: aiLoading } = useAIBuilder();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: funnels } = useFunnels();
  const { data: crmStages } = useStages(crmFunnelId);

  useEffect(() => { loadQuizzes(); }, []);

  const loadQuizzes = async () => {
    const { data } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false });
    if (data) setQuizzes(data as any as Quiz[]);
  };

  const loadAnalytics = async (quizId: string) => {
    const { data } = await supabase
      .from("quiz_analytics")
      .select("*")
      .eq("quiz_id", quizId)
      .order("created_at", { ascending: true });
    if (data) setAnalytics(data);
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
        const { data } = await supabase.from("quizzes").insert(payload).select().single();
        if (data) setActiveQuiz(data);
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

  const renderAnalytics = () => {
    // Basic drop-off calculation
    const viewsByStep = analytics.reduce((acc: any, curr) => {
      if (curr.event_type === 'view') {
        acc[curr.step_id] = (acc[curr.step_id] || 0) + 1;
      }
      return acc;
    }, {});

    const totalViews = viewsByStep['start'] || 0;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/40">
            <p className="text-xs text-muted-foreground mb-1 uppercase font-bold">Total de Inícios</p>
            <p className="text-2xl font-black">{totalViews}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/40">
            <p className="text-xs text-muted-foreground mb-1 uppercase font-bold">Leads Gerados</p>
            <p className="text-2xl font-black text-primary">{viewsByStep['lead_capture'] || 0}</p>
          </div>
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/40">
            <p className="text-xs text-muted-foreground mb-1 uppercase font-bold">Taxa de Conversão</p>
            <p className="text-2xl font-black">{totalViews > 0 ? ((viewsByStep['lead_capture'] || 0) / totalViews * 100).toFixed(1) : 0}%</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-bold text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Funil de Drop-off</h4>
          <div className="space-y-2">
            {['start', ...questions.map(q => q.id), 'lead_capture'].map((step, i) => {
              const count = viewsByStep[step] || 0;
              const percent = totalViews > 0 ? (count / totalViews * 100) : 0;
              const stepLabel = step === 'start' ? 'Início' : step === 'lead_capture' ? 'Captura Lead' : questions.find(q => q.id === step)?.title || step;
              
              return (
                <div key={step} className="relative h-12 flex items-center px-4 rounded-lg bg-secondary/20 overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-primary/10 transition-all" style={{ width: `${percent}%` }} />
                  <div className="flex-1 flex justify-between items-center z-10">
                    <span className="text-xs font-medium truncate max-w-[70%]">{i + 1}. {stepLabel}</span>
                    <span className="text-xs font-bold">{count} ({percent.toFixed(0)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col -m-6 bg-background">
      {/* Top Toolbar */}
      <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-background z-20">
        <div className="flex items-center gap-4">
          <div className="flex bg-secondary/50 p-1 rounded-lg border border-border/40">
            {[
              { id: "editor", label: "Perguntas", icon: ListChecks },
              { id: "theme", label: "Design", icon: Palette },
              { id: "settings", label: "Configurações", icon: Settings },
              { id: "analytics", label: "Analytics", icon: BarChart3 },
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
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Publicar Quiz
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
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

                          {/* Options for Choice Types */}
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

                          {/* Logic Editor */}
                          <div className="pt-4 border-t border-border/30">
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                              <Split className="w-3 h-3" /> Lógica Condicional
                            </h5>
                            <div className="space-y-2">
                              {q.logic?.map((l, lIdx) => (
                                <div key={lIdx} className="flex items-center gap-2 text-xs bg-secondary/20 p-2 rounded-lg">
                                  <span>Se responder</span>
                                  <select 
                                    value={l.condition_value} 
                                    onChange={e => {
                                      const newLogic = [...(q.logic || [])];
                                      newLogic[lIdx].condition_value = e.target.value;
                                      updateQuestion(q.id, { logic: newLogic });
                                    }}
                                    className="bg-background border border-border/40 rounded px-1.5 py-0.5 outline-none"
                                  >
                                    <option value="">Escolha...</option>
                                    {q.options?.map(o => <option key={o} value={o}>{o}</option>)}
                                    {q.image_options?.map(o => <option key={o.label} value={o.label}>{o.label}</option>)}
                                  </select>
                                  <span>então</span>
                                  <select 
                                    value={l.action} 
                                    onChange={e => {
                                      const newLogic = [...(q.logic || [])];
                                      newLogic[lIdx].action = e.target.value as any;
                                      updateQuestion(q.id, { logic: newLogic });
                                    }}
                                    className="bg-background border border-border/40 rounded px-1.5 py-0.5 outline-none"
                                  >
                                    <option value="go_to">Ir para</option>
                                    <option value="finish">Finalizar (Lead)</option>
                                  </select>
                                  {l.action === "go_to" && (
                                    <select 
                                      value={l.destination} 
                                      onChange={e => {
                                        const newLogic = [...(q.logic || [])];
                                        newLogic[lIdx].destination = e.target.value;
                                        updateQuestion(q.id, { logic: newLogic });
                                      }}
                                      className="bg-background border border-border/40 rounded px-1.5 py-0.5 outline-none"
                                    >
                                      <option value="">Próxima Pergunta</option>
                                      {questions.filter(qu => qu.id !== q.id).map(qu => <option key={qu.id} value={qu.id}>{qu.title}</option>)}
                                      <option value="lead_capture">Captura de Lead</option>
                                    </select>
                                  )}
                                  <button onClick={() => {
                                    const newLogic = q.logic?.filter((_, i) => i !== lIdx);
                                    updateQuestion(q.id, { logic: newLogic });
                                  }} className="ml-auto text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                                </div>
                              ))}
                              <Button variant="ghost" size="sm" onClick={() => {
                                updateQuestion(q.id, { logic: [...(q.logic || []), { action: "go_to", condition_value: "" }] });
                              }} className="text-[10px] h-6 gap-1 opacity-50">
                                <Plus className="w-2.5 h-2.5" /> Adicionar Regra
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
              <div className="max-w-lg mx-auto space-y-8">
                <div className="space-y-4">
                  <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><Palette className="w-4 h-4" /> Cores & Tipografia</h4>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold opacity-60">Cor de Fundo</label>
                      <div className="flex gap-2">
                        <input type="color" value={theme.bgColor} onChange={e => setTheme({...theme, bgColor: e.target.value})} className="w-10 h-10 rounded-lg bg-transparent border-0" />
                        <input value={theme.bgColor} onChange={e => setTheme({...theme, bgColor: e.target.value})} className="flex-1 bg-secondary/50 border border-border/40 rounded-lg px-3 text-xs outline-none" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold opacity-60">Cor Primária (Botões)</label>
                      <div className="flex gap-2">
                        <input type="color" value={theme.buttonColor} onChange={e => setTheme({...theme, buttonColor: e.target.value})} className="w-10 h-10 rounded-lg bg-transparent border-0" />
                        <input value={theme.buttonColor} onChange={e => setTheme({...theme, buttonColor: e.target.value})} className="flex-1 bg-secondary/50 border border-border/40 rounded-lg px-3 text-xs outline-none" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-60">Família da Fonte (Google Fonts)</label>
                    <select value={theme.fontFamily} onChange={e => setTheme({...theme, fontFamily: e.target.value})} className="w-full bg-secondary/50 border border-border/40 rounded-lg p-3 text-sm outline-none">
                      {["Inter", "Space Grotesk", "Poppins", "Montserrat", "Outfit", "DM Sans"].map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-4 pt-8 border-t border-border/30">
                  <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><Image className="w-4 h-4" /> Identidade Visual</h4>
                  <div className="space-y-2">
                    <label className="text-xs font-bold opacity-60">URL do Logo</label>
                    <input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." className="w-full bg-secondary/50 border border-border/40 rounded-lg p-3 text-sm outline-none" />
                  </div>
                </div>
              </div>
            )}

            {tab === "settings" && (
              <div className="max-w-lg mx-auto space-y-8">
                <div className="space-y-6">
                  <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /> Gamificação & UX</h4>
                  <div className="space-y-4 bg-secondary/20 p-6 rounded-2xl border border-border/40">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">Avanço Automático</p>
                        <p className="text-[10px] text-muted-foreground">Pular para próxima pergunta ao selecionar opção</p>
                      </div>
                      <input type="checkbox" checked={settings.auto_advance} onChange={e => setSettings({...settings, auto_advance: e.target.checked})} className="w-5 h-5 accent-primary" />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">Fake Loading (Processamento)</p>
                        <p className="text-[10px] text-muted-foreground">Simular análise de dados antes do resultado</p>
                      </div>
                      <input type="checkbox" checked={settings.enable_fake_loading} onChange={e => setSettings({...settings, enable_fake_loading: e.target.checked})} className="w-5 h-5 accent-primary" />
                    </div>
                    {settings.enable_fake_loading && (
                      <input value={settings.fake_loading_text} onChange={e => setSettings({...settings, fake_loading_text: e.target.value})} className="w-full bg-background/50 border border-border/40 rounded-lg px-3 py-2 text-xs outline-none" />
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">Escassez: Cronômetro</p>
                        <p className="text-[10px] text-muted-foreground">Exibir contagem regressiva de urgência</p>
                      </div>
                      <input type="checkbox" checked={settings.enable_timer} onChange={e => setSettings({...settings, enable_timer: e.target.checked})} className="w-5 h-5 accent-primary" />
                    </div>
                    {settings.enable_timer && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs opacity-60">Segundos:</span>
                        <input type="number" value={settings.timer_seconds} onChange={e => setSettings({...settings, timer_seconds: parseInt(e.target.value)})} className="w-24 bg-background/50 border border-border/40 rounded-lg px-3 py-1.5 text-xs outline-none" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6 pt-8 border-t border-border/30">
                  <h4 className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><Webhook className="w-4 h-4 text-primary" /> Integrações & Webhooks</h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold opacity-60">Webhook URL (POST JSON)</label>
                      <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://seu-crm.com/webhook" className="w-full bg-secondary/50 border border-border/40 rounded-lg p-3 text-sm outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold opacity-60">Scripts Customizados (Head)</label>
                      <textarea value={customScripts} onChange={e => setCustomScripts(e.target.value)} placeholder="Insira seus pixels de TikTok, Facebook, etc..." rows={4} className="w-full bg-secondary/50 border border-border/40 rounded-lg p-3 text-xs font-mono outline-none resize-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {tab === "analytics" && renderAnalytics()}
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
              <div className="text-center py-10 opacity-40">
                <Sparkles className="w-10 h-10 mx-auto mb-4" />
                <p className="text-xs font-bold uppercase tracking-tighter">Descreva o quiz dos seus sonhos</p>
                <p className="text-[10px] mt-1">Ex: "Crie um quiz de emagrecimento com lógica condicional para quem quer perder mais de 10kg"</p>
              </div>
            )}
            {chatMsgs.map(m => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] p-3 rounded-2xl text-xs ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                  {m.role === 'assistant' ? <ReactMarkdown className="prose prose-xs prose-invert">{m.content}</ReactMarkdown> : m.content}
                </div>
              </div>
            ))}
            {aiLoading && (
              <div className="flex justify-start">
                <div className="bg-secondary p-3 rounded-2xl flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  <span className="text-[10px] font-bold">Gerando lógica...</span>
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
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); /* handleChat(); */ } }}
                placeholder="Peça para a IA..." 
                rows={3}
                className="w-full bg-secondary/50 border border-border/40 rounded-2xl p-4 pr-12 text-xs outline-none resize-none focus:ring-2 focus:ring-primary/30"
              />
              <button className="absolute right-3 bottom-3 p-2 rounded-xl bg-primary text-primary-foreground">
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
