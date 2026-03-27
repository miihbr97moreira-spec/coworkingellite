import { useState, useEffect, useRef } from "react";
import {
  Plus, Trash2, Save, Loader2, Sparkles, Send, Eye, Copy, Check,
  ExternalLink, Image, Palette, Settings, X, Bot, Code,
  ListChecks, MessageSquare, Phone, Mail,
  LayoutGrid, Timer, Zap, Webhook, BarChart3, ChevronRight, Split, Globe
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
}

interface QuizTheme {
  bgColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontFamily: string;
  cardBgColor?: string;
  cardBorderColor?: string;
  cardBorderRadius?: number;
  cardShadow?: string;
  inputBgColor?: string;
  inputBorderColor?: string;
  inputBorderRadius?: number;
  buttonBorderRadius?: number;
  buttonShadow?: string;
  progressBarColor?: string;
  progressBarBgColor?: string;
  optionHoverBgColor?: string;
  optionSelectedBgColor?: string;
  optionSelectedBorderColor?: string;
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
  bgColor: "#0f172a", 
  textColor: "#ffffff", 
  buttonColor: "#EAB308",
  buttonTextColor: "#000000", 
  fontFamily: "Inter",
  cardBgColor: "rgba(30, 41, 59, 0.5)",
  cardBorderColor: "rgba(255, 255, 255, 0.1)",
  cardBorderRadius: 16,
  cardShadow: "lg",
  inputBgColor: "rgba(255, 255, 255, 0.05)",
  inputBorderColor: "rgba(255, 255, 255, 0.1)",
  inputBorderRadius: 12,
  buttonBorderRadius: 12,
  progressBarColor: "#EAB308"
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
  { value: "text", label: "Texto", icon: MessageSquare },
  { value: "email", label: "E-mail", icon: Mail },
  { value: "phone", label: "Telefone", icon: Phone },
];

export default function AdminQuizBuilder() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [tab, setTab] = useState<"questions" | "theme" | "settings" | "analytics" | "integrations">("questions");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [theme, setTheme] = useState<QuizTheme>(DEFAULT_THEME);
  const [settings, setSettings] = useState<QuizSettings>(DEFAULT_SETTINGS);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const { generateContent } = useAIBuilder();
  const { data: funnels } = useFunnels();
  const { data: stages } = useStages();

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    const { data } = await supabase.from("quizzes").select("*");
    setQuizzes(data || []);
  };

  const addQuestion = () => {
    const newQ: QuizQuestion = { id: Date.now().toString(), type: "multiple_choice", title: "", options: ["", ""] };
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
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");
    setIsLoadingChat(true);

    try {
      const prompt = `Você é um especialista em criar quizzes de alta conversão com design moderno e UX fluida (similar a landing pages profissionais).

Requisito do usuário: "${chatInput}"

Gere um JSON com a seguinte estrutura (responda APENAS com JSON válido, sem markdown):
{
  "title": "Título do Quiz",
  "description": "Descrição breve",
  "questions": [
    {
      "id": "q1",
      "type": "multiple_choice|image_grid|text|email|phone",
      "title": "Pergunta",
      "options": ["Opção 1", "Opção 2"],
      "image_options": [{"label": "Label", "url": "https://..."}]
    }
  ],
  "theme": {
    "bgColor": "#0f172a",
    "textColor": "#ffffff",
    "buttonColor": "#EAB308",
    "buttonTextColor": "#000000",
    "fontFamily": "Inter",
    "cardBgColor": "rgba(30, 41, 59, 0.5)",
    "cardBorderColor": "rgba(255, 255, 255, 0.1)",
    "cardBorderRadius": 16,
    "inputBgColor": "rgba(255, 255, 255, 0.05)",
    "inputBorderRadius": 12,
    "buttonBorderRadius": 12
  },
  "settings": {
    "auto_advance": true,
    "show_progress_bar": true,
    "enable_fake_loading": true,
    "fake_loading_text": "Analisando...",
    "piping_enabled": true
  }
}`;

      const response = await generateContent(prompt);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("JSON não encontrado");
        const data = JSON.parse(jsonMatch[0]);
        
        setTitle(data.title || "");
        setDescription(data.description || "");
        setQuestions(data.questions || []);
        setTheme({ ...DEFAULT_THEME, ...data.theme });
        setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        
        setChatMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "✅ Quiz gerado com sucesso! Personalize conforme necessário." }]);
      } catch (e) {
        setChatMessages(prev => [...prev, { id: Date.now().toString(), role: "assistant", content: "❌ Erro ao processar resposta. Tente novamente." }]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingChat(false);
    }
  };

  const saveQuiz = async () => {
    if (!title || !slug) { toast.error("Preencha título e slug"); return; }
    const quizData = { title, slug, description, questions, theme, settings, status: "draft" };
    
    if (selectedQuizId) {
      await supabase.from("quizzes").update(quizData).eq("id", selectedQuizId);
      toast.success("Quiz atualizado!");
    } else {
      await supabase.from("quizzes").insert([quizData]);
      toast.success("Quiz criado!");
    }
    loadQuizzes();
    setSelectedQuizId(null);
  };

  const duplicateQuiz = async (quizId: string) => {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;
    
    const newSlug = `${quiz.slug}-copia-${Date.now()}`;
    const newQuiz = { ...quiz, id: undefined, slug: newSlug, title: `${quiz.title} (Cópia)` };
    
    await supabase.from("quizzes").insert([newQuiz]);
    toast.success("Quiz duplicado!");
    loadQuizzes();
  };

  const selectedQuiz = quizzes.find(q => q.id === selectedQuizId);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        {!selectedQuizId ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-black text-primary">Quiz Builder</h1>
              <Button onClick={() => { setTitle(""); setSlug(""); setDescription(""); setQuestions([]); setTheme(DEFAULT_THEME); setSelectedQuizId(null); }} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" /> Novo Quiz
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quizzes.map(quiz => (
                <div key={quiz.id} className="bg-card border border-border/40 rounded-2xl p-6 hover:shadow-lg transition-all group">
                  <h3 className="font-bold text-lg mb-2">{quiz.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{quiz.slug}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setSelectedQuizId(quiz.id); setTitle(quiz.title); setSlug(quiz.slug); setDescription(quiz.description || ""); setQuestions(quiz.questions); setTheme(quiz.theme); setSettings(quiz.settings || DEFAULT_SETTINGS); }}>
                      <Eye className="w-4 h-4 mr-1" /> Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => duplicateQuiz(quiz.id)}>
                      <Copy className="w-4 h-4 mr-1" /> Duplicar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Editor */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={() => setSelectedQuizId(null)}>&larr; Voltar</Button>
                <h2 className="text-2xl font-black text-primary">Editar Quiz</h2>
              </div>

              <div className="bg-card border border-border/40 rounded-2xl p-6 space-y-4">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Título do Quiz" className="w-full px-4 py-3 bg-secondary/30 border border-border/40 rounded-xl outline-none focus:ring-2 focus:ring-primary/30 text-lg font-bold" />
                <input type="text" value={slug} onChange={e => setSlug(e.target.value)} placeholder="slug-do-quiz" className="w-full px-4 py-3 bg-secondary/30 border border-border/40 rounded-xl outline-none focus:ring-2 focus:ring-primary/30" />
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição..." className="w-full px-4 py-3 bg-secondary/30 border border-border/40 rounded-xl outline-none focus:ring-2 focus:ring-primary/30 h-24 resize-none" />
              </div>

              {/* Abas */}
              <div className="flex gap-2 border-b border-border/40">
                {["questions", "theme", "settings", "integrations"].map(t => (
                  <button key={t} onClick={() => setTab(t as any)} className={`px-4 py-2 font-bold uppercase text-xs transition-all ${tab === t ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}>
                    {t === "questions" && "Perguntas"} {t === "theme" && "Design"} {t === "settings" && "Config"} {t === "integrations" && "Integrações"}
                  </button>
                ))}
              </div>

              {/* Conteúdo das Abas */}
              {tab === "questions" && (
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={q.id} className="bg-secondary/20 border border-border/40 rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-primary">Pergunta {idx + 1}</span>
                        <Button size="sm" variant="ghost" onClick={() => removeQuestion(q.id)} className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                      <input type="text" value={q.title} onChange={e => updateQuestion(q.id, { title: e.target.value })} placeholder="Título da pergunta..." className="w-full px-3 py-2 bg-background border border-border/40 rounded-lg outline-none focus:ring-2 focus:ring-primary/30" />
                      <select value={q.type} onChange={e => updateQuestion(q.id, { type: e.target.value as any })} className="w-full px-3 py-2 bg-background border border-border/40 rounded-lg outline-none focus:ring-2 focus:ring-primary/30 text-sm">
                        {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>
                      {(q.type === "multiple_choice" || q.type === "image_grid") && (
                        <div className="space-y-2">
                          {q.type === "multiple_choice" && q.options?.map((opt, i) => (
                            <div key={i} className="flex gap-2">
                              <input type="text" value={opt} onChange={e => { const newOpts = [...(q.options || [])]; newOpts[i] = e.target.value; updateQuestion(q.id, { options: newOpts }); }} placeholder={`Opção ${i + 1}`} className="flex-1 px-3 py-2 bg-background border border-border/40 rounded-lg outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
                              <Button size="sm" variant="ghost" onClick={() => { const newOpts = q.options?.filter((_, idx) => idx !== i); updateQuestion(q.id, { options: newOpts }); }} className="text-destructive"><X className="w-4 h-4" /></Button>
                            </div>
                          ))}
                          <Button size="sm" variant="outline" onClick={() => updateQuestion(q.id, { options: [...(q.options || []), ""] })} className="w-full"><Plus className="w-3 h-3 mr-1" /> Opção</Button>
                        </div>
                      )}
                    </div>
                  ))}
                  <Button onClick={addQuestion} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"><Plus className="w-4 h-4 mr-2" /> Adicionar Pergunta</Button>
                </div>
              )}

              {tab === "theme" && (
                <div className="space-y-6 bg-card border border-border/40 rounded-2xl p-6">
                  <h3 className="text-lg font-bold text-primary">Personalizar Design do Quiz</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Fundo</label>
                      <input type="color" value={theme.bgColor} onChange={e => setTheme({...theme, bgColor: e.target.value})} className="w-full h-10 rounded-lg cursor-pointer" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Texto</label>
                      <input type="color" value={theme.textColor} onChange={e => setTheme({...theme, textColor: e.target.value})} className="w-full h-10 rounded-lg cursor-pointer" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Botão</label>
                      <input type="color" value={theme.buttonColor} onChange={e => setTheme({...theme, buttonColor: e.target.value})} className="w-full h-10 rounded-lg cursor-pointer" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase">Arredondamento Card (px)</label>
                      <input type="number" min="0" max="32" value={theme.cardBorderRadius || 16} onChange={e => setTheme({...theme, cardBorderRadius: parseInt(e.target.value)})} className="w-full px-3 py-2 bg-secondary/30 border border-border/40 rounded-lg outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
                    </div>
                  </div>
                </div>
              )}

              {tab === "settings" && (
                <div className="space-y-4 bg-card border border-border/40 rounded-2xl p-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={settings.auto_advance} onChange={e => setSettings({...settings, auto_advance: e.target.checked})} className="w-4 h-4" />
                    <span className="font-bold">Auto-Avançar</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={settings.show_progress_bar} onChange={e => setSettings({...settings, show_progress_bar: e.target.checked})} className="w-4 h-4" />
                    <span className="font-bold">Barra de Progresso</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={settings.enable_fake_loading} onChange={e => setSettings({...settings, enable_fake_loading: e.target.checked})} className="w-4 h-4" />
                    <span className="font-bold">Fake Loading</span>
                  </label>
                </div>
              )}

              <Button onClick={saveQuiz} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 font-bold text-lg"><Save className="w-4 h-4 mr-2" /> Salvar Quiz</Button>
            </div>

            {/* Chat IA + Preview */}
            <div className="space-y-6">
              {/* Chat */}
              <div className="bg-card border border-border/40 rounded-2xl p-4 h-80 flex flex-col">
                <h3 className="font-bold text-primary mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4" /> IA Quiz Master</h3>
                <div className="flex-1 overflow-y-auto space-y-3 mb-3 text-sm">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`p-2 rounded-lg ${msg.role === "user" ? "bg-primary/20 text-primary-foreground" : "bg-secondary/40"}`}>
                      {msg.content}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === "Enter" && handleChat()} placeholder="Descreva seu quiz..." className="flex-1 px-3 py-2 bg-secondary/30 border border-border/40 rounded-lg outline-none focus:ring-2 focus:ring-primary/30 text-sm" />
                  <Button size="sm" onClick={handleChat} disabled={isLoadingChat} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    {isLoadingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-card border border-border/40 rounded-2xl p-4 h-96 overflow-y-auto">
                <QuizPreview title={title} description={description} questions={questions} theme={theme} settings={settings} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
