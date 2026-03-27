import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "text" | "phone" | "email";
  title: string;
  options?: string[];
  required?: boolean;
}

interface QuizTheme {
  bgColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontFamily: string;
}

const QuizPage = () => {
  const { slug } = useParams();
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [contactInfo, setContactInfo] = useState({ name: "", email: "", phone: "" });
  const [submitted, setSubmitted] = useState(false);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data, error } = await supabase
        .from("quizzes")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();
      if (data) setQuiz(data);
      setLoading(false);
    };
    load();
  }, [slug]);

  // Inject pixel scripts
  useEffect(() => {
    if (!quiz) return;
    const scripts: HTMLElement[] = [];

    if (quiz.meta_pixel_id) {
      const s = document.createElement("script");
      s.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${quiz.meta_pixel_id}');fbq('track','PageView');`;
      document.head.appendChild(s);
      scripts.push(s);
    }
    if (quiz.ga_id) {
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${quiz.ga_id}`;
      document.head.appendChild(s);
      scripts.push(s);
      const s2 = document.createElement("script");
      s2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${quiz.ga_id}');`;
      document.head.appendChild(s2);
      scripts.push(s2);
    }

    return () => { scripts.forEach(s => s.remove()); };
  }, [quiz]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <Loader2 className="w-6 h-6 animate-spin text-yellow-400" />
    </div>
  );

  if (!quiz) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <p>Quiz não encontrado.</p>
    </div>
  );

  const theme: QuizTheme = quiz.theme || { bgColor: "#0f172a", textColor: "#fff", buttonColor: "#FBBF24", buttonTextColor: "#000", fontFamily: "Inter" };
  const questions: QuizQuestion[] = quiz.questions || [];

  const handleAnswer = (qId: string, value: string) => {
    setAnswers(p => ({ ...p, [qId]: value }));
  };

  const next = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(p => p + 1);
    } else {
      setShowContact(true);
    }
  };

  const submitQuiz = async () => {
    try {
      // The DB trigger handles CRM lead creation automatically
      await supabase.from("quiz_submissions").insert({
        quiz_id: quiz.id,
        name: contactInfo.name,
        email: contactInfo.email,
        phone: contactInfo.phone,
        answers: answers as any,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Erro ao enviar quiz:", err);
    }
  };

  const q = questions[currentQ];
  const progress = showContact ? 100 : questions.length > 0 ? ((currentQ + 1) / questions.length) * 100 : 0;

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: 14, border: `1px solid ${theme.buttonColor}40`,
    borderRadius: 12, background: "transparent", color: theme.textColor, fontSize: 15, outline: "none",
  };

  const btnStyle: React.CSSProperties = {
    marginTop: 20, padding: "14px 32px", background: theme.buttonColor, color: theme.buttonTextColor,
    border: "none", borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%", transition: "transform .2s",
  };

  return (
    <div style={{
      minHeight: "100vh", background: theme.bgColor, color: theme.textColor,
      fontFamily: `'${theme.fontFamily}', sans-serif`, display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <link href={`https://fonts.googleapis.com/css2?family=${theme.fontFamily.replace(/ /g, "+")}&display=swap`} rel="stylesheet" />

      <div style={{ maxWidth: 520, width: "100%", padding: "40px 24px" }}>
        {quiz.logo_url && (
          <div style={{ textAlign: (quiz.logo_position as any) || "center", marginBottom: 32 }}>
            <img src={quiz.logo_url} style={{ maxHeight: 48, objectFit: "contain" }} alt="Logo" />
          </div>
        )}

        {submitted ? (
          <div style={{ textAlign: "center", animation: "fadeIn .5s ease" }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🎉</p>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Obrigado!</h2>
            <p style={{ opacity: 0.7 }}>Suas respostas foram enviadas com sucesso.</p>
          </div>
        ) : showContact ? (
          <div style={{ animation: "fadeIn .4s ease" }}>
            <p style={{ fontSize: 12, color: theme.buttonColor, fontWeight: 600, marginBottom: 8 }}>ÚLTIMO PASSO</p>
            <div style={{ height: 4, background: `${theme.buttonColor}20`, borderRadius: 99, overflow: "hidden", marginBottom: 24 }}>
              <div style={{ height: "100%", width: "100%", background: theme.buttonColor, borderRadius: 99 }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Para onde enviamos o resultado?</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input value={contactInfo.name} onChange={e => setContactInfo(p => ({ ...p, name: e.target.value }))}
                placeholder="Seu nome" style={inputStyle} />
              <input value={contactInfo.email} onChange={e => setContactInfo(p => ({ ...p, email: e.target.value }))}
                placeholder="seu@email.com" type="email" style={inputStyle} />
              <input value={contactInfo.phone} onChange={e => setContactInfo(p => ({ ...p, phone: e.target.value }))}
                placeholder="(11) 99999-9999" type="tel" style={inputStyle} />
            </div>
            <button onClick={submitQuiz} style={btnStyle}>Enviar Respostas ✨</button>
          </div>
        ) : q ? (
          <div style={{ animation: "fadeIn .4s ease" }}>
            <p style={{ fontSize: 12, color: theme.buttonColor, fontWeight: 600, marginBottom: 8 }}>
              PERGUNTA {currentQ + 1} DE {questions.length}
            </p>
            <div style={{ height: 4, background: `${theme.buttonColor}20`, borderRadius: 99, overflow: "hidden", marginBottom: 24 }}>
              <div style={{ height: "100%", width: `${progress}%`, background: theme.buttonColor, borderRadius: 99, transition: "width .4s" }} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>{q.title}</h2>

            {q.type === "multiple_choice" && q.options?.map((opt, i) => (
              <button key={i} onClick={() => { handleAnswer(q.id, opt); next(); }}
                style={{
                  display: "block", width: "100%", padding: 14, margin: "6px 0",
                  border: `1px solid ${answers[q.id] === opt ? theme.buttonColor : `${theme.buttonColor}40`}`,
                  borderRadius: 12, background: answers[q.id] === opt ? theme.buttonColor : "transparent",
                  color: answers[q.id] === opt ? theme.buttonTextColor : theme.textColor,
                  fontSize: 15, cursor: "pointer", transition: "all .2s", textAlign: "left" as const,
                }}>
                {opt}
              </button>
            ))}

            {q.type === "text" && (
              <>
                <textarea value={answers[q.id] || ""} onChange={e => handleAnswer(q.id, e.target.value)}
                  placeholder="Digite sua resposta..." rows={3}
                  style={{ ...inputStyle, resize: "none" as const }} />
                <button onClick={next} style={btnStyle}>
                  {currentQ === questions.length - 1 ? "Finalizar" : "Próxima →"}
                </button>
              </>
            )}

            {(q.type === "email" || q.type === "phone") && (
              <>
                <input value={answers[q.id] || ""} onChange={e => handleAnswer(q.id, e.target.value)}
                  type={q.type === "email" ? "email" : "tel"}
                  placeholder={q.type === "email" ? "seu@email.com" : "(11) 99999-9999"}
                  style={inputStyle} />
                <button onClick={next} style={btnStyle}>
                  {currentQ === questions.length - 1 ? "Finalizar" : "Próxima →"}
                </button>
              </>
            )}
          </div>
        ) : (
          <p style={{ textAlign: "center", opacity: 0.5 }}>Quiz sem perguntas.</p>
        )}
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
};

export default QuizPage;
