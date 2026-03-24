import { motion } from "framer-motion";
import { Check, MessageCircle, Loader2 } from "lucide-react";
import SpotlightCard from "./SpotlightCard";
import MagneticButton from "./MagneticButton";
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
      <section id="planos" className="py-20 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </section>
    );
  }

  return (
    <section id="planos" className="py-20">
      <div className="container px-4">
        <div className="text-center mb-14">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-widest uppercase rounded-full border border-primary/30 text-primary bg-primary/5"
          >
            Investimento
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl font-bold text-gradient-gold mb-4"
          >
            Planos & Experiências
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground max-w-2xl mx-auto"
          >
            Escolha o plano ideal para seu momento profissional e desfrute de uma infraestrutura de elite.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <SpotlightCard
                className={`glass p-8 flex flex-col h-full relative transition-all duration-500 hover:border-primary/40 ${plan.highlight ? "border-primary/50 glow-gold scale-105 z-10" : "border-border/40"}`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-[10px] font-bold rounded-full bg-primary text-primary-foreground uppercase tracking-widest z-20 shadow-lg shadow-primary/20">
                    Mais Popular
                  </span>
                )}
                <h3 className="font-display text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-gradient-gold">{plan.price}</span>
                  {plan.priceNote && <span className="text-sm text-muted-foreground ml-1">{plan.priceNote}</span>}
                </div>
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground/80 leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
                <MagneticButton
                  onClick={() => openWhatsApp(plan)}
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 ${
                    plan.highlight
                      ? "bg-primary text-primary-foreground glow-gold shadow-lg shadow-primary/20"
                      : "border border-primary/30 text-primary hover:bg-primary/10"
                  }`}
                >
                  <MessageCircle className="w-5 h-5" />
                  Quero este plano
                </MagneticButton>
              </SpotlightCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
