import { motion } from "framer-motion";
import { Check, MessageCircle } from "lucide-react";
import SpotlightCard from "./SpotlightCard";
import MagneticButton from "./MagneticButton";
import { useLPConfig, trackEvent } from "@/hooks/useSupabaseQuery";
import { useCTASync } from "@/hooks/useCTASync";

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
  const { data: config } = useLPConfig();
  const { syncCTAClick } = useCTASync();
  const plansConfig = config?.plans as { plans?: Plan[] } | undefined;
  const whatsappConfig = config?.whatsapp as { number?: string } | undefined;

  const plans: Plan[] = plansConfig?.plans ?? [
    { id: "hora", name: "Hora", price: "R$ 40", priceNote: "/hora", features: ["1 estação de trabalho", "Internet rápida", "Café e água free"], whatsappMessage: "Olá, tenho interesse no plano por hora de R$ 40.", highlight: false },
    { id: "diaria", name: "Diária", price: "R$ 200", priceNote: "/dia", features: ["2 estações de trabalho", "Internet rápida", "Café e água free"], whatsappMessage: "Olá, tenho interesse no plano diário de R$ 200.", highlight: true },
    { id: "mensal", name: "Mensal", price: "R$ 130", priceNote: "/dia (mín. 10 diárias)", features: ["3 estações de trabalho", "2 diárias na sala de reunião (4 pessoas)", "Internet rápida", "Café e água free", "Frigobar exclusivo"], whatsappMessage: "Olá, tenho interesse no plano mensal a partir de R$ 130/dia.", highlight: false },
  ];
  const whatsappNumber = whatsappConfig?.number ?? "5511976790653";

  const openWhatsApp = (plan: Plan) => {
    trackEvent("plan_click", { plan: plan.id });
    syncCTAClick(`plan-${plan.id}`, `Plano ${plan.name}`, "whatsapp", whatsappNumber, plan.whatsappMessage);
  };

  return (
    <section id="planos" className="py-20">
      <div className="container px-4">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gradient-gold mb-4">
            Planos & Investimento
          </h2>
          <p className="text-muted-foreground">Escolha o plano ideal para seu momento profissional</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <SpotlightCard
              key={plan.id}
              className={`glass p-8 flex flex-col relative ${plan.highlight ? "border-primary/50 glow-gold" : ""}`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold rounded-full bg-primary text-primary-foreground uppercase tracking-wider z-20">
                  Mais Popular
                </span>
              )}
              <h3 
                className="font-display text-2xl font-bold mb-2 editable-element cursor-pointer hover:ring-2 hover:ring-primary/50 rounded-lg transition-all"
                data-type="text"
                data-path={`plans.plans.${i}.name`}
              >
                {plan.name}
              </h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gradient-gold">{plan.price}</span>
                {plan.priceNote && <span className="text-sm text-muted-foreground">{plan.priceNote}</span>}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
              <MagneticButton
                onClick={() => openWhatsApp(plan)}
                data-cta-id={`plan-${plan.id}`}
                data-cta-label={`Plano ${plan.name}`}
                data-cta-type="whatsapp"
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  plan.highlight
                    ? "bg-primary text-primary-foreground glow-gold"
                    : "border border-primary/30 text-primary hover:bg-primary/10"
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                Quero este plano
              </MagneticButton>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
