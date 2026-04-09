import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ArrowRight, ArrowLeft, CheckCircle2, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import WhiteLabelHelmet from "@/components/WhiteLabelHelmet";
import PixelInjector from "@/components/PixelInjector";

interface FormQuestion {
  id: string;
  type: string;
  title: string;
  description?: string;
  placeholder?: string;
  options?: string[];
  required?: boolean;
  min?: number;
  max?: number;
  logic?: { condition_value?: string; action: "go_to" | "finish"; destination?: string }[];
}

interface FormTheme {
  bgColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontFamily: string;
}

const FormPage = ({ overrideSlug }: { overrideSlug?: string }) => {
  const { slug: paramSlug } = useParams();
  const slug = overrideSlug || paramSlug;

  const [form, setForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [finished, setFinished] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase.from("forms").select("*").eq("slug", slug).eq("status", "published").single();
      if (data) {
        setForm({
          ...data,
          theme: (data.theme as any) || { bgColor: "#0f172a", textColor: "#fff", buttonColor: "#FBBF24", buttonTextColor: "#000", fontFamily: "Inter" },
          questions: (data.questions as any[]) || [],
          settings: (data.settings as any) || {},
        });
      }
      setLoading(false);
    })();
  }, [slug]);

  const theme: FormTheme = form?.theme || { bgColor: "#0f172a", textColor: "#fff", buttonColor: "#FBBF24", buttonTextColor: "#000", fontFamily: "Inter" };
  const questions: FormQuestion[] = form?.questions || [];
  const settings = form?.settings || {};
  const q = questions[currentIdx];
  const progress = questions.length > 0 ? ((currentIdx + 1) / questions.length) * 100 : 0;

  const canProceed = useCallback(() => {
    if (!q) return false;
    if (q.type === "welcome" || q.type === "statement") return true;
    if (!q.required) return true;
    const a = answers[q.id];
    return a !== undefined && a !== "" && a !== null;
  }, [q, answers]);

  const submitForm = useCallback(async () => {
    if (submitted || !form) return;
    setSubmitted(true);
    // Extract contact info from answers
    let name = "", email = "", phone = "";
    for (const q of questions) {
      const a = answers[q.id];
      if (!a) continue;
      if (q.type === "email") email = a;
      else if (q.type === "phone") phone = a;
      else if (q.title.toLowerCase().includes("nome") || q.title.toLowerCase().includes("name")) name = a;
    }

    const answersArray = questions
      .filter(q => q.type !== "welcome" && q.type !== "statement" && answers[q.id] !== undefined)
      .map(q => ({ question: q.title, answer: answers[q.id], type: q.type }));

    await supabase.from("form_submissions").insert({
      form_id: form.id,
      answers: answersArray as any,
      name: name || null,
      email: email || null,
      phone: phone || null,
    });

    // Fire Meta Pixel Lead event
    if ((window as any).fbq) (window as any).fbq("track", "Lead");
  }, [submitted, form, questions, answers]);

  const goNext = useCallback(() => {
    if (!q) return;
    const answer = answers[q.id];
    // Logic rules
    if (q.logic && answer) {
      const answerStr = String(answer);
      for (const rule of q.logic) {
        if (rule.condition_value && answerStr.toLowerCase() === rule.condition_value.toLowerCase()) {
          if (rule.action === "finish") { setFinished(true); submitForm(); return; }
          if (rule.action === "go_to" && rule.destination) {
            const targetIdx = questions.findIndex(x => x.id === rule.destination);
            if (targetIdx >= 0) { setDirection(1); setCurrentIdx(targetIdx); return; }
          }
        }
      }
    }
    if (currentIdx < questions.length - 1) {
      setDirection(1);
      setCurrentIdx(currentIdx + 1);
    } else {
      setFinished(true);
      submitForm();
    }
  }, [q, answers, currentIdx, questions, submitForm]);

  const goBack = () => {
    if (currentIdx > 0) { setDirection(-1); setCurrentIdx(currentIdx - 1); }
  };

  const setAnswer = (val: any) => {
    if (!q) return;
    setAnswers(prev => ({ ...prev, [q.id]: val }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && canProceed()) goNext();
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!form) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Formulário não encontrado</p></div>;
  }

  if (finished) {
    return (
      <>
        <WhiteLabelHelmet title={form.title} />
        <PixelInjector metaPixelId={form.meta_pixel_id} gaId={form.ga_id} />
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: theme.bgColor, fontFamily: theme.fontFamily }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md px-6">
            <CheckCircle2 className="w-16 h-16 mx-auto mb-6" style={{ color: theme.buttonColor }} />
            <h1 className="text-3xl font-bold mb-3" style={{ color: theme.textColor }}>{settings.ending_title || "Obrigado!"}</h1>
            <p className="text-lg opacity-80" style={{ color: theme.textColor }}>{settings.ending_description || "Suas respostas foram enviadas."}</p>
          </motion.div>
        </div>
      </>
    );
  }

  if (!q) return null;

  return (
    <>
      <WhiteLabelHelmet title={form.title} />
      <PixelInjector metaPixelId={form.meta_pixel_id} gaId={form.ga_id} />
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: theme.bgColor, fontFamily: theme.fontFamily }} onKeyDown={handleKeyDown} tabIndex={0}>
        {settings.show_progress !== false && (
          <div className="fixed top-0 left-0 right-0 h-1 z-50" style={{ backgroundColor: `${theme.buttonColor}20` }}>
            <motion.div className="h-full" style={{ backgroundColor: theme.buttonColor }} animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
        )}

        {form.logo_url && (
          <div className={`p-4 flex ${form.logo_position === "left" ? "justify-start" : form.logo_position === "right" ? "justify-end" : "justify-center"}`}>
            <img src={form.logo_url} alt="Logo" className="h-8 object-contain" />
          </div>
        )}

        <div className="flex-1 flex items-center justify-center px-6">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={q.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -direction * 60 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-xl space-y-6"
            >
              {q.type !== "welcome" && (
                <span className="text-sm font-medium opacity-50" style={{ color: theme.textColor }}>
                  {currentIdx + 1} → {questions.length}
                </span>
              )}

              <h2 className="text-2xl md:text-3xl font-bold leading-tight" style={{ color: theme.textColor }}>
                {q.title || "..."}
              </h2>

              {q.description && <p className="text-base opacity-70" style={{ color: theme.textColor }}>{q.description}</p>}

              {/* Text inputs */}
              {q.type === "short_text" && (
                <input type="text" placeholder={q.placeholder || "Digite sua resposta..."} value={answers[q.id] || ""} onChange={e => setAnswer(e.target.value)} className="w-full bg-transparent border-b-2 text-xl py-3 outline-none" style={{ color: theme.textColor, borderColor: `${theme.textColor}30` }} autoFocus />
              )}
              {q.type === "long_text" && (
                <textarea placeholder={q.placeholder || "Digite sua resposta..."} value={answers[q.id] || ""} onChange={e => setAnswer(e.target.value)} rows={4} className="w-full bg-transparent border-b-2 text-lg py-3 outline-none resize-none" style={{ color: theme.textColor, borderColor: `${theme.textColor}30` }} autoFocus />
              )}
              {q.type === "email" && (
                <input type="email" placeholder="seu@email.com" value={answers[q.id] || ""} onChange={e => setAnswer(e.target.value)} className="w-full bg-transparent border-b-2 text-xl py-3 outline-none" style={{ color: theme.textColor, borderColor: `${theme.textColor}30` }} autoFocus />
              )}
              {q.type === "phone" && (
                <input type="tel" placeholder="(00) 00000-0000" value={answers[q.id] || ""} onChange={e => setAnswer(e.target.value)} className="w-full bg-transparent border-b-2 text-xl py-3 outline-none" style={{ color: theme.textColor, borderColor: `${theme.textColor}30` }} autoFocus />
              )}
              {q.type === "number" && (
                <input type="number" placeholder="0" value={answers[q.id] || ""} onChange={e => setAnswer(e.target.value)} className="w-full bg-transparent border-b-2 text-xl py-3 outline-none" style={{ color: theme.textColor, borderColor: `${theme.textColor}30` }} autoFocus />
              )}
              {q.type === "date" && (
                <input type="date" value={answers[q.id] || ""} onChange={e => setAnswer(e.target.value)} className="w-full bg-transparent border-b-2 text-xl py-3 outline-none" style={{ color: theme.textColor, borderColor: `${theme.textColor}30` }} />
              )}

              {/* Multiple choice */}
              {q.type === "multiple_choice" && (
                <div className="space-y-3">
                  {(q.options || []).map((opt, i) => {
                    const selected = answers[q.id] === opt;
                    return (
                      <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { setAnswer(opt); setTimeout(goNext, 300); }}
                        className="w-full flex items-center gap-3 px-5 py-4 rounded-xl border-2 text-left transition-all"
                        style={{ borderColor: selected ? theme.buttonColor : `${theme.textColor}20`, backgroundColor: selected ? `${theme.buttonColor}15` : "transparent", color: theme.textColor }}>
                        <span className="w-7 h-7 rounded-md border-2 flex items-center justify-center text-xs font-bold shrink-0" style={{ borderColor: selected ? theme.buttonColor : `${theme.textColor}40` }}>{String.fromCharCode(65 + i)}</span>
                        {opt}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Checkbox */}
              {q.type === "checkbox" && (
                <div className="space-y-3">
                  {(q.options || []).map((opt, i) => {
                    const selected = (answers[q.id] || []).includes(opt);
                    return (
                      <motion.button key={i} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        onClick={() => { const cur = answers[q.id] || []; setAnswer(selected ? cur.filter((x: string) => x !== opt) : [...cur, opt]); }}
                        className="w-full flex items-center gap-3 px-5 py-4 rounded-xl border-2 text-left transition-all"
                        style={{ borderColor: selected ? theme.buttonColor : `${theme.textColor}20`, backgroundColor: selected ? `${theme.buttonColor}15` : "transparent", color: theme.textColor }}>
                        <span className="w-7 h-7 rounded-md border-2 flex items-center justify-center text-xs font-bold shrink-0" style={{ borderColor: selected ? theme.buttonColor : `${theme.textColor}40` }}>{selected ? "✓" : ""}</span>
                        {opt}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Dropdown */}
              {q.type === "dropdown" && (
                <select value={answers[q.id] || ""} onChange={e => setAnswer(e.target.value)}
                  className="w-full bg-transparent border-b-2 text-xl py-3 outline-none" style={{ color: theme.textColor, borderColor: `${theme.textColor}30` }}>
                  <option value="">Selecione...</option>
                  {(q.options || []).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                </select>
              )}

              {/* Rating */}
              {q.type === "rating" && (
                <div className="flex gap-2">
                  {Array.from({ length: q.max || 5 }, (_, i) => (
                    <motion.button key={i} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }} onClick={() => { setAnswer(i + 1); setTimeout(goNext, 400); }}>
                      <Star className="w-10 h-10" fill={(answers[q.id] || 0) > i ? theme.buttonColor : "transparent"} style={{ color: (answers[q.id] || 0) > i ? theme.buttonColor : `${theme.textColor}40` }} />
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Opinion scale */}
              {q.type === "opinion_scale" && (
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: (q.max || 10) - (q.min || 1) + 1 }, (_, i) => {
                    const val = (q.min || 1) + i;
                    const selected = answers[q.id] === val;
                    return (
                      <motion.button key={val} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }} onClick={() => { setAnswer(val); setTimeout(goNext, 300); }}
                        className="w-12 h-12 rounded-xl border-2 font-bold text-lg transition-all"
                        style={{ borderColor: selected ? theme.buttonColor : `${theme.textColor}20`, backgroundColor: selected ? theme.buttonColor : "transparent", color: selected ? theme.buttonTextColor : theme.textColor }}>
                        {val}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Yes/No */}
              {q.type === "yes_no" && (
                <div className="flex gap-4">
                  {["Sim", "Não"].map(opt => {
                    const selected = answers[q.id] === opt;
                    return (
                      <motion.button key={opt} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => { setAnswer(opt); setTimeout(goNext, 300); }}
                        className="flex-1 py-5 rounded-xl border-2 text-xl font-bold transition-all"
                        style={{ borderColor: selected ? theme.buttonColor : `${theme.textColor}20`, backgroundColor: selected ? theme.buttonColor : "transparent", color: selected ? theme.buttonTextColor : theme.textColor }}>
                        {opt}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Navigation */}
              <div className="flex items-center gap-3 pt-4">
                {!["multiple_choice", "rating", "opinion_scale", "yes_no"].includes(q.type) && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={goNext} disabled={!canProceed()}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-base transition-all disabled:opacity-40"
                    style={{ backgroundColor: theme.buttonColor, color: theme.buttonTextColor }}>
                    {currentIdx === questions.length - 1 ? "Enviar" : q.type === "welcome" ? "Começar" : "OK"}
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                )}
                {settings.allow_back !== false && currentIdx > 0 && (
                  <button onClick={goBack} className="p-3 rounded-xl opacity-50 hover:opacity-100 transition-opacity" style={{ color: theme.textColor }}>
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                {q.type !== "welcome" && q.type !== "statement" && (
                  <span className="text-xs opacity-40 ml-auto" style={{ color: theme.textColor }}>pressione <strong>Enter ↵</strong></span>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default FormPage;
