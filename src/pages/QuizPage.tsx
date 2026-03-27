import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight, CheckCircle2, AlertCircle, Timer } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import PremiumQuizOption from "@/components/quiz/PremiumQuizOption";

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

const QuizPage = ({ overrideSlug }: { overrideSlug?: string }) => {
  const { slug: paramSlug } = useParams();
  const slug = overrideSlug || paramSlug;
  
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentStepId, setCurrentStepId] = useState<string>("start");
  const [history, setHistory] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contactInfo, setContactInfo] = useState({ name: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processPercent, setProcessPercent] = useState(0);
  const [sessionId] = useState(() => crypto.randomUUID());
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [settings, setSettings] = useState<QuizSettings>({
    auto_advance: true,
    show_progress_bar: true,
    enable_fake_loading: true,
    fake_loading_text: "Analisando seu perfil...",
    enable_timer: false,
    timer_seconds: 300,
    piping_enabled: true,
  });

  // Load Quiz Data
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("quizzes")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (data) {
        setQuiz(data);
        // Merge settings com defaults
        const mergedSettings: QuizSettings = {
          auto_advance: true,
          show_progress_bar: true,
          enable_fake_loading: true,
          fake_loading_text: "Analisando seu perfil...",
          enable_timer: false,
          timer_seconds: 300,
          piping_enabled: true,
          ...(data.settings ?? {}),
        };
        setSettings(mergedSettings);
        if (mergedSettings.enable_timer) {
          setTimeLeft(mergedSettings.timer_seconds || 300);
        }
        // Track initial view usando quiz_id direto para evitar closure stale
        await supabase.from("quiz_analytics").insert({
          quiz_id: data.id,
          session_id: sessionId,
          step_id: "start",
          event_type: "view",
          metadata: {}
        });
      }
      setLoading(false);
    };
    load();
  }, [slug, sessionId]);

  // Timer logic
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || submitted) return;
    const timer = setInterval(() => setTimeLeft(prev => (prev !== null ? prev - 1 : null)), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitted]);

  // Analytics Tracking
  const trackEvent = useCallback(async (stepId: string, eventType: "view" | "complete" | "drop", metadata = {}) => {
    if (!quiz?.id) return;
    await supabase.from("quiz_analytics").insert({
      quiz_id: quiz.id,
      session_id: sessionId,
      step_id: stepId,
      event_type: eventType,
      metadata: { ...metadata, answers }
    });
  }, [quiz?.id, sessionId, answers]);

  // Piping logic: Replace {name} with answer value
  const pipeText = (text: string) => {
    if (!settings?.piping_enabled || !text) return text;
    let newText = text;
    Object.entries(answers).forEach(([id, val]) => {
      newText = newText.replace(new RegExp(`{${id}}`, 'g'), val);
    });
    // Also support {nome} if mapped
    if (contactInfo.name) newText = newText.replace(/{nome}/g, contactInfo.name);
    return newText;
  };

  const handleNext = (nextStepId: string) => {
    trackEvent(currentStepId, "complete");
    setHistory(prev => [...prev, currentStepId]);
    setCurrentStepId(nextStepId);
    trackEvent(nextStepId, "view");
  };

  const handleBack = () => {
    if (history.length === 0) return;
    const prevStepId = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentStepId(prevStepId);
  };

  const handleAnswer = useCallback((qId: string, value: string, autoAdvance = false, questionAutoAdvance?: boolean) => {
    setAnswers(p => ({ ...p, [qId]: value }));
    
    // Usar configuração granular da pergunta se disponível, senão usar global
    const shouldAutoAdvance = questionAutoAdvance !== undefined ? questionAutoAdvance : settings.auto_advance;
    
    if (autoAdvance && shouldAutoAdvance && quiz) {
      setTimeout(() => {
        const question = quiz.questions.find((q: any) => q.id === qId);
        const logicRule = question?.logic?.find((l: any) => l.condition_value === value);
        
        if (logicRule) {
          if (logicRule.action === "finish") {
            handleNext("lead_capture");
          } else if (logicRule.destination) {
            handleNext(logicRule.destination);
          }
        } else {
          // Default next
          const idx = quiz.questions.findIndex((q: any) => q.id === qId);
          if (idx < quiz.questions.length - 1) {
            handleNext(quiz.questions[idx + 1].id);
          } else {
            handleNext("lead_capture");
          }
        }
      }, 400);
    }
  }, [settings.auto_advance, quiz, handleNext]);

  const startFakeLoading = useCallback((questionFakeLoading?: boolean) => {
    // Usar configuração granular da pergunta se disponível, senão usar global
    const shouldShowFakeLoading = questionFakeLoading !== undefined ? questionFakeLoading : settings.enable_fake_loading;
    
    if (!shouldShowFakeLoading) {
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
  }, [settings.enable_fake_loading]);

  const submitQuiz = useCallback(async () => {
    try {
      trackEvent("lead_capture", "complete");
      await supabase.from("quiz_submissions").insert({
        quiz_id: quiz.id,
        name: contactInfo.name,
        email: contactInfo.email,
        phone: contactInfo.phone,
        answers: answers as any,
      });

      // Webhook integration
      if (quiz.webhook_url) {
        fetch(quiz.webhook_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quiz_title: quiz.title,
            lead: contactInfo,
            answers: answers,
            submitted_at: new Date().toISOString()
          })
        }).catch(err => console.error("Webhook error:", err));
      }

      // Usar configuração granular da pergunta de captura de lead se disponível
      const lastQuestion = quiz.questions[quiz.questions.length - 1];
      startFakeLoading(lastQuestion?.enable_fake_loading);
    } catch (err) {
      console.error("Erro ao enviar quiz:", err);
    }
  }, [quiz, contactInfo, answers, trackEvent, startFakeLoading]);

  if (loading || !quiz) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      {loading ? (
        <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
      ) : (
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="text-xl font-medium text-white">Quiz não encontrado ou indisponível.</p>
        </div>
      )}
    </div>
  );

  const theme: QuizTheme = quiz.theme || { bgColor: "#0f172a", textColor: "#fff", buttonColor: "#FBBF24", buttonTextColor: "#000", fontFamily: "Inter" };
  
  const currentQuestion = quiz.questions.find((q: any) => q.id === currentStepId);
  const questionIndex = quiz.questions.findIndex((q: any) => q.id === currentStepId);
  const progress = submitted ? 100 : currentStepId === "lead_capture" ? 95 : currentStepId === "start" ? 0 : ((questionIndex + 1) / quiz.questions.length) * 90;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      minHeight: "100vh", background: theme.bgColor, color: theme.textColor,
      fontFamily: `'${theme.fontFamily}', sans-serif`,
    }} className="flex flex-col items-center justify-center relative overflow-hidden">
      <link href={`https://fonts.googleapis.com/css2?family=${theme.fontFamily.replace(/ /g, "+")}&display=swap`} rel="stylesheet" />
      
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Header / Progress */}
      <div className="fixed top-0 left-0 w-full p-6 flex flex-col items-center z-20">
        {quiz.logo_url && (
          <img src={quiz.logo_url} style={{ maxHeight: 40 }} className="mb-6 object-contain" alt="Logo" />
        )}
        {settings?.show_progress_bar && !submitted && !isProcessing && (
          <div className="w-full max-w-xl h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-primary"
              style={{ backgroundColor: theme.buttonColor }}
            />
          </div>
        )}
      </div>

      {/* Timer UI */}
      {settings?.enable_timer && timeLeft !== null && !submitted && (
        <div className="fixed top-24 right-6 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full flex items-center gap-2 text-sm font-mono z-30">
          <Timer className={`w-4 h-4 ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
          <span className={timeLeft < 60 ? 'text-red-500' : ''}>{formatTime(timeLeft)}</span>
        </div>
      )}

      <main className="w-full max-w-xl px-6 py-32 z-10">
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
                    className="text-primary stroke-current" 
                    style={{ color: theme.buttonColor }}
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    fill="transparent" r="45" cx="50" cy="50" 
                    initial={{ strokeDasharray: "282.7", strokeDashoffset: "282.7" }}
                    animate={{ strokeDashoffset: 282.7 - (282.7 * processPercent) / 100 }}
                    transition={{ duration: 0.3 }}
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
              <h2 className="text-3xl font-bold">{pipeText("Parabéns, {nome}!")}</h2>
              <p className="text-lg opacity-80">Recebemos suas informações e estamos preparando tudo para você.</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-8 py-4 rounded-xl font-bold transition-transform active:scale-95"
                style={{ background: theme.buttonColor, color: theme.buttonTextColor }}
              >
                Voltar ao Início
              </button>
            </motion.div>
          ) : currentStepId === "start" ? (
            <motion.div 
              key="start"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="text-center space-y-6"
            >
              <h1 className="text-4xl font-black leading-tight">{quiz.title}</h1>
              <p className="text-xl opacity-70">{quiz.description}</p>
              <button 
                onClick={() => handleNext(quiz.questions[0].id)}
                className="group px-10 py-5 rounded-2xl font-bold text-lg flex items-center gap-3 mx-auto transition-all hover:shadow-[0_0_30px_-5px] hover:shadow-primary/50"
                style={{ background: theme.buttonColor, color: theme.buttonTextColor }}
              >
                Começar Agora
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                  <label className="text-sm font-medium opacity-70">Nome Completo</label>
                  <input 
                    value={contactInfo.name} 
                    onChange={e => setContactInfo(p => ({ ...p, name: e.target.value }))}
                    placeholder="Como podemos te chamar?" 
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium opacity-70">E-mail</label>
                  <input 
                    type="email"
                    value={contactInfo.email} 
                    onChange={e => setContactInfo(p => ({ ...p, email: e.target.value }))}
                    placeholder="seu@melhor-email.com" 
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium opacity-70">WhatsApp</label>
                  <input 
                    type="tel"
                    value={contactInfo.phone} 
                    onChange={e => setContactInfo(p => ({ ...p, phone: e.target.value }))}
                    placeholder="(00) 00000-0000" 
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>
              <button 
                onClick={submitQuiz}
                disabled={!contactInfo.email}
                className="w-full py-5 rounded-2xl font-black text-lg shadow-xl disabled:opacity-50 transition-all active:scale-[0.98]"
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
              className="space-y-8 p-8 rounded-3xl"
              style={{
                backgroundColor: currentQuestion.card_style === "minimal" ? "transparent" : (currentQuestion.card_style === "glassmorphism" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)"),
                backdropFilter: currentQuestion.card_style === "glassmorphism" ? "blur(10px)" : "none",
                border: currentQuestion.card_style === "minimal" ? "none" : `1px solid ${currentQuestion.card_style === "glassmorphism" ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)"}`,
                boxShadow: currentQuestion.card_style === "minimal" ? "none" : "0 8px 32px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h2 className="text-3xl font-bold leading-tight">{pipeText(currentQuestion.title)}</h2>
              
              <div className="space-y-3">
                {currentQuestion.type === "multiple_choice" && currentQuestion.options?.map((opt: string, i: number) => (
                  <PremiumQuizOption
                    key={i}
                    label={opt}
                    isSelected={answers[currentQuestion.id] === opt}
                    onClick={() => handleAnswer(currentQuestion.id, opt, true, currentQuestion.auto_advance)}
                    style={currentQuestion.option_style || "cards"}
                    theme={{ buttonColor: theme.buttonColor, buttonTextColor: theme.buttonTextColor }}
                  />
                ))}

                {currentQuestion.type === "image_grid" && (
                  <div className="grid grid-cols-2 gap-4">
                    {currentQuestion.image_options?.map((opt: any, i: number) => (
                      <PremiumQuizOption
                        key={i}
                        label={opt.label}
                        isSelected={answers[currentQuestion.id] === opt.label}
                        onClick={() => handleAnswer(currentQuestion.id, opt.label, true, currentQuestion.auto_advance)}
                        style="bento-grid"
                        theme={{ buttonColor: theme.buttonColor, buttonTextColor: theme.buttonTextColor }}
                        imageUrl={opt.url}
                      />
                    ))}
                  </div>
                )}

                {(currentQuestion.type === "text" || currentQuestion.type === "email" || currentQuestion.type === "phone") && (
                  <div className="space-y-6">
                    <input 
                      autoFocus
                      type={currentQuestion.type === "text" ? "text" : currentQuestion.type}
                      value={answers[currentQuestion.id] || ""} 
                      onChange={e => handleAnswer(currentQuestion.id, e.target.value, true, currentQuestion.auto_advance)}
                      placeholder="Sua resposta aqui..." 
                      className="w-full p-6 rounded-2xl bg-white/5 border-2 border-white/10 focus:border-primary outline-none text-xl font-medium transition-all"
                      style={{ caretColor: theme.buttonColor }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        const idx = quiz.questions.findIndex((q: any) => q.id === currentStepId);
                        if (idx < quiz.questions.length - 1) handleNext(quiz.questions[idx + 1].id);
                        else handleNext("lead_capture");
                      }}
                      className="w-full py-5 rounded-2xl font-black text-lg transition-all shadow-xl"
                      style={{
                        backgroundColor: theme.buttonColor,
                        color: theme.buttonTextColor,
                      }}
                    >
                      {currentQuestion.button_text || "CONTINUAR"}
                    </motion.button>
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

      {/* Global CSS for some effects */}
      <style>{`
        .bg-primary { background-color: ${theme.buttonColor} !important; }
        .text-primary { color: ${theme.buttonColor} !important; }
        .border-primary { border-color: ${theme.buttonColor} !important; }
      `}</style>
    </div>
  );
};

export default QuizPage;
