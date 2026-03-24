import { motion } from "framer-motion";
import { Check, MessageCircle, Loader2, Zap, ArrowRight, Star } from "lucide-react";
import { useLPConfig, trackEvent } from "@/hooks/useSupabaseQuery";

interface Plan {
  id: string;
  name: string;
  price: string;
  priceNote?: string;
  features: string[];
  whatsappMessage: string;
  highlight?: boolean;
}

const Pricing = () => {
  const { data: config, isLoading } = useLPConfig();
  
  const plansConfig = config?.plans as { plans?: Plan[] } | undefined;
  const whatsappConfig = config?.whatsapp as { number?: string } | undefined;

  const defaultPlans: Plan[] = [
    { id: "hora", name: "Hora", price: "R$ 40", priceNote: "/hora", features: ["1 estação de trabalho", "Internet rápida", "Café e água free"], whatsappMessage: "Olá, tenho interesse no plano por hora de R$ 40.", highlight: false },
    { id: "diaria", name: "Diária", price: "R$ 200", priceNote: "/dia", features: ["2 estações de trabalho", "Internet rápida", "Café e água free"], whatsappMessage: "Olá, tenho interesse no plano diário de R$ 200.", highlight: true },
    { id: "mensal", name: "Mensal", price: "R$ 130", priceNote: "/dia (mín. 10 diárias)", features: ["3 estações de trabalho", "2 diárias na sala de reunião (4 pessoas)", "Internet rápida", "Café e água free", "Frigobar exclusivo"], whatsappMessage: "Olá, tenho interesse no plano mensal a partir de R$ 130/dia.", highlight: false },
  ];

  const plans: Plan[] = plansConfig?.plans ?? defaultPlans;
  const whatsappNumber = whatsappConfig?.number ?? "5511976790653";

  const openWhatsApp = (plan: Plan) => {
    trackEvent("plan_click", { plan: plan.id, plan_name: plan.name });
    const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(plan.whatsappMessage)}`;
    window.open(url, "_blank");
  };

  if (isLoading) {
    return (
      <section id="planos" className="py-32 flex flex-col items-center justify-center min-h-[600px] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Carregando Ofertas...</p>
      </section>
    );
  }

  return (
    <section id="planos" className="py-32 relative overflow-hidden">
      {/* Ticto Style Background Orbs */}
      <div className="absolute top-1/4 right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-[10px] font-black tracking-[0.3em] uppercase rounded-full border border-primary/20 bg-primary/5 text-primary"
          >
            <Zap className="w-3 h-3" />
            Investimento & Planos
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-display text-4xl md:text-6xl font-black mb-8 tracking-tight"
          >
            Escolha o plano ideal para o seu <span className="text-gradient-ticto">próximo nível</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-zinc-400 leading-relaxed"
          >
            Sem taxas escondidas. Sem burocracia. Apenas o melhor ambiente para você focar no que realmente importa: seu crescimento.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className={`relative flex flex-col p-10 rounded-[2.5rem] border transition-all duration-500 group ${
                plan.highlight 
                  ? "bg-zinc-900/40 border-primary/30 shadow-[0_0_50px_rgba(37,99,235,0.1)] scale-105 z-10" 
                  : "bg-zinc-900/20 border-white/5 hover:border-white/10"
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 flex items-center gap-2">
                  <Star className="w-3 h-3 fill-white" />
                  Mais Recomendado
                </div>
              )}

              <div className="mb-10">
                <h3 className="text-xl font-bold text-white mb-6 group-hover:text-primary transition-colors">{plan.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-white tracking-tighter">{plan.price}</span>
                  {plan.priceNote && <span className="text-zinc-500 text-sm font-medium">{plan.priceNote}</span>}
                </div>
              </div>

              <div className="space-y-5 mb-12 flex-1">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-3">
                    <div className={`mt-1 p-0.5 rounded-full ${plan.highlight ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-500'}`}>
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-zinc-400 text-sm font-medium leading-relaxed">{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => openWhatsApp(plan)}
                className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all duration-300 ${
                  plan.highlight
                    ? "bg-primary text-white hover:scale-105 hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-white/5"
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                Quero este plano
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </button>

              {/* Decorative Background Ticto Style */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-tr-[2.5rem] pointer-events-none" />
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20 text-center"
        >
          <p className="text-zinc-500 text-xs font-medium">
            Precisa de algo personalizado? <button className="text-primary font-bold hover:underline">Fale com nosso concierge</button>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
