import { motion } from "framer-motion";
import { Check, MessageCircle } from "lucide-react";
import { useSiteContent } from "@/context/SiteContext";

const Pricing = () => {
  const { content } = useSiteContent();

  const openWhatsApp = (message: string) => {
    const url = `https://wa.me/${content.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
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
          {content.plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className={`glass p-8 flex flex-col relative ${plan.highlight ? "border-primary/50 glow-gold" : ""}`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold rounded-full bg-primary text-primary-foreground uppercase tracking-wider">
                  Mais Popular
                </span>
              )}

              <h3 className="font-display text-2xl font-bold mb-2">{plan.name}</h3>
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

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => openWhatsApp(plan.whatsappMessage)}
                className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  plan.highlight
                    ? "bg-primary text-primary-foreground glow-gold"
                    : "border border-primary/30 text-primary hover:bg-primary/10"
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                Quero este plano
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
