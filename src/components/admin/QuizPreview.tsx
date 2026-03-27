import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CheckCircle2, Loader2, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface QuizPreviewProps {
  title: string;
  description: string;
  logoUrl?: string;
  questions: QuizQuestion[];
  theme: QuizTheme;
  settings: QuizSettings;
}

const QuizPreview = ({
  title,
  description,
  logoUrl,
  questions,
  theme,
  settings
}: QuizPreviewProps) => {
  const [currentStepId, setCurrentStepId] = useState<string>("start");
  const [history, setHistory] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processPercent, setProcessPercent] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    const timer = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  useEffect(() => {
    if (settings?.enable_timer && currentStepId !== "start") {
      setTimeLeft(settings.timer_seconds || 300);
    }
  }, [settings?.enable_timer, settings?.timer_seconds, currentStepId]);

  const pipeText = (text: string) => {
    if (!settings?.piping_enabled || !text) return text;
    let newText = text;
    Object.entries(answers).forEach(([id, val]) => {
      newText = newText.replace(new RegExp(`{${id}}`, 'g'), val);
    });
    return newText;
  };

  const handleNext = (nextStepId: string) => {
    setHistory(prev => [...prev, currentStepId]);
    setCurrentStepId(nextStepId);
  };

  const handleBack = () => {
    if (history.length === 0) return;
    const prevStepId = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentStepId(prevStepId);
  };

  const handleAnswer = (qId: string, value: string) => {
    setAnswers(p => ({ ...p, [qId]: value }));
    if (settings?.auto_advance) {
      setTimeout(() => {
        const question = questions.find(q => q.id === qId);
        const logicRule = question?.logic?.find(l => l.condition_value === value);
        if (logicRule) {
          if (logicRule.action === "finish") handleNext("lead_capture");
          else if (logicRule.destination) handleNext(logicRule.destination);
        } else {
          const idx = questions.findIndex(q => q.id === qId);
          if (idx < questions.length - 1) handleNext(questions[idx + 1].id);
          else handleNext("lead_capture");
        }
      }, 400);
    }
  };

  const startFakeLoading = () => {
    if (!settings?.enable_fake_loading) { setSubmitted(true); return; }
    setIsProcessing(true);
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 15) + 5;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => { setIsProcessing(false); setSubmitted(true); }, 800);
      }
      setProcessPercent(current);
    }, 300);
  };

  const currentQuestion = questions.find(q => q.id === currentStepId);
  const questionIndex = questions.findIndex(q => q.id === currentStepId);
  const progress = submitted ? 100 : currentStepId === "lead_capture" ? 95 : currentStepId === "start" ? 0 : ((questionIndex + 1) / questions.length) * 90;
  
  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const cardStyle = {
    backgroundColor: theme.cardBgColor || 'rgba(255,255,255,0.05)',
    border: `1px solid ${theme.cardBorderColor || 'rgba(255,255,255,0.1)'}`,
    borderRadius: `${theme.cardBorderRadius || 12}px`,
    boxShadow: theme.cardShadow === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' : 
               theme.cardShadow === 'md' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' :
               theme.cardShadow === 'lg' ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' : 'none'
  };

  return (
    <div
      style={{ minHeight: "100%", background: theme.bgColor, color: theme.textColor, fontFamily: `'${theme.fontFamily}', sans-serif` }}
      className="flex flex-col items-center justify-center relative overflow-hidden p-6"
    >
      <link href={`https://fonts.googleapis.com/css2?family=${theme.fontFamily.replace(/ /g, "+")}&display=swap`} rel="stylesheet" />
      
      <div className="w-full flex flex-col items-center z-20 mb-8">
        {logoUrl && <img src={logoUrl} style={{ maxHeight: 40 }} className="mb-6 object-contain" alt="Logo" />}
        {settings.show_progress_bar && !submitted && !isProcessing && (
          <div className="w-full max-w-xl h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: theme.progressBarBgColor || 'rgba(255,255,255,0.1)' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full" style={{ backgroundColor: theme.progressBarColor || theme.buttonColor }} />
          </div>
        )}
      </div>

      <main className="w-full max-w-xl z-10">
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div key="processing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 p-8" style={cardStyle}>
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle className="text-white/10 stroke-current" strokeWidth="4" fill="transparent" r="45" cx="50" cy="50" />
                  <motion.circle style={{ color: theme.progressBarColor || theme.buttonColor }} strokeWidth="4" strokeDasharray="283" animate={{ strokeDashoffset: 283 - (283 * processPercent) / 100 }} strokeLinecap="round" fill="transparent" r="45" cx="50" cy="50" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">{processPercent}%</div>
              </div>
              <h2 className="text-2xl font-bold animate-pulse">{settings.fake_loading_text}</h2>
            </motion.div>
          ) : submitted ? (
            <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-6 p-8" style={cardStyle}>
              <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black">Tudo Pronto!</h2>
              <p className="opacity-80">Recebemos suas informações. Em breve entraremos em contato.</p>
            </motion.div>
          ) : currentStepId === "start" ? (
            <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6 p-8" style={cardStyle}>
              <h1 className="text-3xl font-black leading-tight">{pipeText(title)}</h1>
              <p className="text-lg opacity-80">{pipeText(description)}</p>
              <Button size="lg" onClick={() => handleNext(questions[0]?.id || "end")} className="w-full h-14 text-lg font-bold" style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, borderRadius: `${theme.buttonBorderRadius || 8}px`, boxShadow: theme.buttonShadow }}>
                Começar Agora <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
          ) : currentStepId === "lead_capture" ? (
            <motion.div key="lead" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6 p-8" style={cardStyle}>
              <h2 className="text-2xl font-black text-center">Quase lá! Deixe seu contato para ver o resultado.</h2>
              <div className="space-y-4">
                <input type="text" placeholder="Seu Nome" className="w-full p-4 border-2 outline-none transition-all" style={{ backgroundColor: theme.inputBgColor || 'rgba(255,255,255,0.05)', borderColor: theme.inputBorderColor || 'rgba(255,255,255,0.1)', borderRadius: `${theme.inputBorderRadius || 8}px` }} />
                <input type="email" placeholder="Seu E-mail" className="w-full p-4 border-2 outline-none transition-all" style={{ backgroundColor: theme.inputBgColor || 'rgba(255,255,255,0.05)', borderColor: theme.inputBorderColor || 'rgba(255,255,255,0.1)', borderRadius: `${theme.inputBorderRadius || 8}px` }} />
                <Button onClick={startFakeLoading} className="w-full h-14 font-black text-lg" style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, borderRadius: `${theme.buttonBorderRadius || 8}px` }}>VER RESULTADO</Button>
              </div>
            </motion.div>
          ) : currentQuestion && (
            <motion.div key={currentQuestion.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 p-8" style={cardStyle}>
              <h2 className="text-2xl font-black mb-8 leading-tight">{pipeText(currentQuestion.title)}</h2>
              <div className="space-y-3">
                {currentQuestion.type === "multiple_choice" && currentQuestion.options?.map((opt, i) => {
                  const isSelected = answers[currentQuestion.id] === opt;
                  return (
                    <button key={i} onClick={() => handleAnswer(currentQuestion.id, opt)} className="w-full p-5 text-left font-medium border-2 transition-all flex items-center justify-between" style={{ 
                      borderRadius: `${theme.inputBorderRadius || 12}px`,
                      borderColor: isSelected ? (theme.optionSelectedBorderColor || theme.buttonColor) : (theme.inputBorderColor || 'rgba(255,255,255,0.05)'),
                      backgroundColor: isSelected ? (theme.optionSelectedBgColor || `${theme.buttonColor}20`) : (theme.inputBgColor || 'rgba(255,255,255,0.05)')
                    }}>
                      <span className="text-lg">{opt}</span>
                      <div className="w-6 h-6 rounded-full border-2 flex items-center justify-center" style={{ backgroundColor: isSelected ? theme.buttonColor : 'transparent', borderColor: isSelected ? theme.buttonColor : 'rgba(255,255,255,0.2)' }}>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-black" />}
                      </div>
                    </button>
                  );
                })}
                {currentQuestion.type === "image_grid" && (
                  <div className="grid grid-cols-2 gap-4">
                    {currentQuestion.image_options?.map((opt, i) => {
                      const isSelected = answers[currentQuestion.id] === opt.label;
                      return (
                        <button key={i} onClick={() => handleAnswer(currentQuestion.id, opt.label)} className="group relative aspect-square overflow-hidden border-4 transition-all" style={{ borderRadius: `${theme.inputBorderRadius || 24}px`, borderColor: isSelected ? theme.buttonColor : 'transparent' }}>
                          <img src={opt.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={opt.label} />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4"><span className="font-bold text-sm">{opt.label}</span></div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {(currentQuestion.type === "text" || currentQuestion.type === "email" || currentQuestion.type === "phone") && (
                  <div className="space-y-6">
                    <input type={currentQuestion.type === "text" ? "text" : currentQuestion.type} value={answers[currentQuestion.id] || ""} onChange={e => handleAnswer(currentQuestion.id, e.target.value)} placeholder="Sua resposta aqui..." className="w-full p-6 border-2 outline-none text-xl font-medium transition-all" style={{ backgroundColor: theme.inputBgColor || 'rgba(255,255,255,0.05)', borderColor: theme.inputBorderColor || 'rgba(255,255,255,0.1)', borderRadius: `${theme.inputBorderRadius || 12}px`, caretColor: theme.buttonColor }} />
                    <Button onClick={() => { const idx = questions.findIndex(q => q.id === currentStepId); if (idx < questions.length - 1) handleNext(questions[idx + 1].id); else handleNext("lead_capture"); }} className="w-full h-14 font-black text-lg" style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor, borderRadius: `${theme.buttonBorderRadius || 12}px` }}>CONTINUAR</Button>
                  </div>
                )}
              </div>
              {history.length > 0 && <button onClick={handleBack} className="text-sm font-bold opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest">← Voltar</button>}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default QuizPreview;
