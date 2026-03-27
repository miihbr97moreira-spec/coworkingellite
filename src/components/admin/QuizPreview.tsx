import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, CheckCircle2, AlertCircle, Loader2, Timer } from "lucide-react";

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

  // Timer logic
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    const timer = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  // Initialize timer
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
          if (logicRule.action === "finish") {
            handleNext("lead_capture");
          } else if (logicRule.destination) {
            handleNext(logicRule.destination);
          }
        } else {
          const idx = questions.findIndex(q => q.id === qId);
          if (idx < questions.length - 1) {
            handleNext(questions[idx + 1].id);
          } else {
            handleNext("lead_capture");
          }
        }
      }, 400);
    }
  };

  const startFakeLoading = () => {
    if (!settings?.enable_fake_loading) {
      setSubmitted(true);
      return;
    }
    setIsProcessing(true);
    let current = 0;
    const interval = setInterval(() => {
      current += Math.floor(Math.random() * 15) + 5;
      if (current >= 100) {
        current = 100;
        clearInterval(interval);
        setTimeout(() => {
          setIsProcessing(false);
          setSubmitted(true);
        }, 800);
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

  return (
    <div
      style={{
        minHeight: "100%",
        background: theme.bgColor,
        color: theme.textColor,
        fontFamily: `'${theme.fontFamily}', sans-serif`,
      }}
      className="flex flex-col items-center justify-center relative overflow-hidden p-6"
    >
      <link href={`https://fonts.googleapis.com/css2?family=${theme.fontFamily.replace(/ /g, "+")}&display=swap`} rel="stylesheet" />
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: `${theme.buttonColor}20` }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: `${theme.buttonColor}10` }} />

      {/* Header / Progress */}
      <div className="w-full flex flex-col items-center z-20 mb-8">
        {logoUrl && (
          <img src={logoUrl} style={{ maxHeight: 40 }} className="mb-6 object-contain" alt="Logo" />
        )}
        {settings.show_progress_bar && !submitted && !isProcessing && (
          <div className="w-full max-w-xl h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full"
              style={{ backgroundColor: theme.buttonColor }}
            />
          </div>
        )}
      </div>

      {/* Timer UI */}
      {settings.enable_timer && timeLeft !== null && !submitted && (
        <div className="fixed top-24 right-6 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-mono z-30">
          <Timer className={`w-4 h-4 ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-primary'}`} style={{ color: timeLeft < 60 ? '#ef4444' : theme.buttonColor }} />
          <span className={timeLeft < 60 ? 'text-red-500' : ''}>{formatTime(timeLeft)}</span>
        </div>
      )}

      <main className="w-full max-w-xl z-10">
        <AnimatePresence mode="wait">
          {isProcessing ? (
            <motion.div 
              key="processing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center space-y-8"
            >
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle className="text-white/10 stroke-current" strokeWidth="4" fill="transparent" r="45" cx="50" cy="50" />
                  <motion.circle 
                    className="stroke-current" 
                    style={{ color: theme.buttonColor }}
                    strokeWidth="4" 
                    strokeDasharray="283"
                    animate={{ strokeDashoffset: 283 - (283 * processPercent) / 100 }}
                    strokeLinecap="round" 
                    fill="transparent" r="45" cx="50" cy="50" 
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                  {processPercent}%
                </div>
              </div>
              <h2 className="text-2xl font-bold animate-pulse">{settings.fake_loading_text}</h2>
            </motion.div>
          ) : submitted ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6"
            >
              <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-bold">Parabéns!</h2>
              <p className="text-lg opacity-80">Recebemos suas informações.</p>
            </motion.div>
          ) : currentStepId === "start" ? (
            <motion.div 
              key="start"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center space-y-6"
            >
              <h1 className="text-4xl font-black leading-tight">{title}</h1>
              <p className="text-xl opacity-70">{description}</p>
              <button 
                onClick={() => handleNext(questions[0]?.id || "lead_capture")}
                className="group px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-3 mx-auto transition-all hover:shadow-[0_0_30px_-5px] active:scale-95"
                style={{ background: theme.buttonColor, color: theme.buttonTextColor }}
              >
                Começar Agora
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          ) : currentStepId === "lead_capture" ? (
            <motion.div 
              key="lead"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <span className="text-xs font-bold tracking-widest uppercase opacity-50">Quase lá!</span>
                <h2 className="text-3xl font-bold">Onde enviamos seu resultado?</h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium opacity-70">Nome</label>
                  <input 
                    placeholder="Seu nome..." 
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-1 outline-none transition-all"
                    style={{ caretColor: theme.buttonColor }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium opacity-70">E-mail</label>
                  <input 
                    type="email"
                    placeholder="seu@email.com" 
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-1 outline-none transition-all"
                    style={{ caretColor: theme.buttonColor }}
                  />
                </div>
              </div>
              <button 
                onClick={() => startFakeLoading()}
                className="w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-all active:scale-[0.98]"
                style={{ background: theme.buttonColor, color: theme.buttonTextColor }}
              >
                VER MEU RESULTADO ✨
              </button>
            </motion.div>
          ) : currentQuestion && (
            <motion.div 
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="space-y-8"
            >
              <h2 className="text-3xl font-bold leading-tight">{pipeText(currentQuestion.title)}</h2>
              
              <div className="space-y-3">
                {currentQuestion.type === "multiple_choice" && currentQuestion.options?.map((opt, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleAnswer(currentQuestion.id, opt)}
                    className={`w-full p-5 rounded-2xl text-left font-medium border-2 transition-all flex items-center justify-between group ${
                      answers[currentQuestion.id] === opt 
                        ? 'border-primary bg-primary/10' 
                        : 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10'
                    }`}
                    style={{ borderColor: answers[currentQuestion.id] === opt ? theme.buttonColor : undefined, backgroundColor: answers[currentQuestion.id] === opt ? `${theme.buttonColor}20` : undefined }}
                  >
                    <span className="text-lg">{opt}</span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      answers[currentQuestion.id] === opt ? 'bg-primary border-primary' : 'border-white/20'
                    }`} style={{ backgroundColor: answers[currentQuestion.id] === opt ? theme.buttonColor : undefined, borderColor: answers[currentQuestion.id] === opt ? theme.buttonColor : undefined }}>
                      {answers[currentQuestion.id] === opt && <CheckCircle2 className="w-4 h-4 text-black" />}
                    </div>
                  </button>
                ))}

                {currentQuestion.type === "image_grid" && (
                  <div className="grid grid-cols-2 gap-4">
                    {currentQuestion.image_options?.map((opt, i) => (
                      <button 
                        key={i}
                        onClick={() => handleAnswer(currentQuestion.id, opt.label)}
                        className={`group relative aspect-square rounded-3xl overflow-hidden border-4 transition-all ${
                          answers[currentQuestion.id] === opt.label ? 'border-primary' : 'border-transparent'
                        }`}
                        style={{ borderColor: answers[currentQuestion.id] === opt.label ? theme.buttonColor : undefined }}
                      >
                        <img src={opt.url} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={opt.label} />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
                          <span className="font-bold text-sm">{opt.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {(currentQuestion.type === "text" || currentQuestion.type === "email" || currentQuestion.type === "phone") && (
                  <div className="space-y-6">
                    <input 
                      autoFocus
                      type={currentQuestion.type === "text" ? "text" : currentQuestion.type}
                      value={answers[currentQuestion.id] || ""} 
                      onChange={e => handleAnswer(currentQuestion.id, e.target.value)}
                      placeholder="Sua resposta aqui..." 
                      className="w-full p-6 rounded-2xl bg-white/5 border-2 border-white/10 focus:border-primary outline-none text-xl font-medium transition-all"
                      style={{ caretColor: theme.buttonColor }}
                    />
                    <button 
                      onClick={() => {
                        const idx = questions.findIndex(q => q.id === currentStepId);
                        if (idx < questions.length - 1) handleNext(questions[idx + 1].id);
                        else handleNext("lead_capture");
                      }}
                      className="w-full py-5 rounded-2xl font-black text-lg shadow-xl"
                      style={{ background: theme.buttonColor, color: theme.buttonTextColor }}
                    >
                      CONTINUAR
                    </button>
                  </div>
                )}
              </div>

              {history.length > 0 && (
                <button 
                  onClick={handleBack}
                  className="text-sm font-bold opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest"
                >
                  ← Voltar
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .bg-primary { background-color: ${theme.buttonColor} !important; }
        .text-primary { color: ${theme.buttonColor} !important; }
        .border-primary { border-color: ${theme.buttonColor} !important; }
      `}</style>
    </div>
  );
};

export default QuizPreview;
