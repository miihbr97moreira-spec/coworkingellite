import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Save, Loader2, Sparkles, Send, Eye, Copy, Check,
  ExternalLink, Settings, X, Bot, Code, ListChecks, MessageSquare,
  Phone, Mail, LayoutGrid, Timer, Zap, Webhook, BarChart3, ChevronRight,
  Split, Download, Share2, Globe
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useFunnels, useStages } from "@/hooks/useSupabaseQuery";
import { useAIBuilder } from "@/hooks/useAIBuilder";
import { Button } from "@/components/ui/button";
import QuizPreview from "./QuizPreview";
// import ReactMarkdown from "react-markdown"; // Removido para evitar erro de className

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

const AdminQuizBuilder = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  /* ── Quiz form state ── */
  const [title, setTitle] = useState("Novo Quiz");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
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
    setTheme(q.theme || DEFAULT_THEME);
    setQuestions(q.questions || []);
    setCrmFunnelId(q.crm_funnel_id);
    setCrmStageId(q.crm_stage_id);
    setMetaPixel(q.meta_pixel_id || "");
    setGaId(q.ga_id || "");
    setWebhookUrl(q.webhook_url || "");
    setCustomScripts(q.custom_scripts || "");
    setSettings(q.settings || DEFAULT_SETTINGS);
  };

  const saveQuiz = async (publish = false) => {
    setIsSaving(true);
    try {
      const payload: any = {
        title, slug, description, logo_url: logoUrl,
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

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMsg = { id: Date.now().toString(), role: "user", content: chatInput };
    setChatMsgs(prev => [...prev, userMsg]);
    const input = chatInput;
    setChatInput("");

    const systemPrompt = `Você é um especialista em criação de quizzes de alta conversão (benchmark: Inlead).

Gere um Quiz em formato JSON com suporte completo às seguintes funcionalidades:

1. LÓGICA CONDICIONAL (Branching):
   - Cada pergunta pode ter um array 'logic' com regras
   - Formato: { "action": "go_to" | "finish", "destination": "id_da_proxima_pergunta", "condition_value": "valor_selecionado" }

2. TIPOS DE PERGUNTAS SUPORTADOS:
   - "multiple_choice": Opções de seleção única
   - "image_grid": Grade de imagens (2-4 opções visuais com URLs)
   - "text": Texto longo
   - "email": Captura de email
   - "phone": Captura de telefone

3. ESTRUTURA JSON ESPERADA:
{
  "title": "Nome do Quiz",
  "description": "Descrição curta",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice" | "image_grid" | "text" | "email" | "phone",
      "title": "Pergunta aqui",
      "options": ["Opção 1", "Opção 2"],
      "image_options": [{"label": "Opção 1", "url": "https://..."}, ...],
      "required": true,
      "logic": [
        {"action": "go_to", "destination": "q2", "condition_value": "Opção 1"},
        {"action": "finish", "condition_value": "Opção 2"}
      ]
    }
  ]
}

Pedido do usuário: "${input}"

Retorne APENAS o JSON puro, sem markdown.`;

    try {
      let fullRaw = "";
      await generatePage(systemPrompt, (delta) => { fullRaw += delta; }, () => {
        if (!fullRaw.trim()) {
          setChatMsgs(prev => [...prev, {
            id: Date.now().toString(),
            role: "assistant",
            content: "❌ Erro: Nenhuma resposta recebida da IA. Tente novamente."
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
            logic: q.logic || []
          })));

          setChatMsgs(prev => [...prev, {
            id: Date.now().toString(),
            role: "assistant",
            content: `✅ Quiz gerado! ${parsed.questions?.length || 0} perguntas criadas. Veja o preview ao lado!`
          }]);
        } catch (err: any) {
          console.error("Erro ao parsear:", err);
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
                <div key={q.id} onClick={() => openQuiz(q)} className="p-6 rounded-2xl border border-border/40 hover:border-border cursor-pointer transition-all space-y-4">
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
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col -m-6 bg-background overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 border-b border-border flex items-center justify-between px-6 bg-background z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => setActiveQuiz(null)} className="text-sm font-bold opacity-60 hover:opacity-100">← Voltar</button>
          <div className="flex-1 flex items-center gap-2">
            <input value={title} onChange={e => setTitle(e.target.value)} className="text-lg font-bold bg-transparent outline-none border-b border-transparent focus:border-primary/30 pb-1" />
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

      {/* Main Layout: Editor (Left) + Preview (Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Panel */}
        <div className="w-1/2 flex flex-col border-r border-border overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-black">Perguntas</h3>
              <div className="flex gap-2 flex-wrap">
                {QUESTION_TYPES.map(type => (
                  <Button key={type.value} variant="outline" size="sm" onClick={() => addQuestion(type.value as any)} className="h-8 text-[10px] gap-1">
                    <type.icon className="w-3 h-3" /> {type.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.id} className="bg-secondary/20 border border-border/40 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <input 
                      value={q.title} 
                      onChange={e => updateQuestion(q.id, { title: e.target.value })}
                      className="flex-1 bg-transparent font-bold outline-none border-b border-transparent focus:border-primary/30"
                    />
                    <button onClick={() => removeQuestion(q.id)} className="text-destructive hover:text-destructive/80">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {q.type === "multiple_choice" && (
                    <div className="space-y-2">
                      {q.options?.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <input value={opt} onChange={e => {
                            const newOpts = [...(q.options || [])];
                            newOpts[i] = e.target.value;
                            updateQuestion(q.id, { options: newOpts });
                          }} className="flex-1 bg-background/50 border border-border/40 rounded px-2 py-1 text-xs outline-none" />
                          <button onClick={() => {
                            const newOpts = q.options?.filter((_, idx) => idx !== i);
                            updateQuestion(q.id, { options: newOpts });
                          }} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" onClick={() => updateQuestion(q.id, { options: [...(q.options || []), "Nova Opção"] })} className="text-[10px] h-6 gap-1">
                        <Plus className="w-3 h-3" /> Opção
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        <div className="w-1/2 flex flex-col border-r border-border bg-secondary/10 overflow-hidden">
          <div className="flex-1 overflow-auto flex items-center justify-center p-6">
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
                  {m.role === 'assistant' ? <div className="text-xs whitespace-pre-wrap">{m.content}</div> : m.content}
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
