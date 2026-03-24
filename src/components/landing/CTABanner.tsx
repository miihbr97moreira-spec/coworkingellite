import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import MagneticButton from "./MagneticButton";
import { trackEvent } from "@/hooks/useSupabaseQuery";
import { useCTASync } from "@/hooks/useCTASync";

const CTABanner = () => {
  const { syncCTAClick } = useCTASync();
  const scrollToPlans = () => {
    trackEvent("cta_click", { source: "banner" });
    syncCTAClick("cta-banner-plans", "Ver Planos (Banner)", "anchor");
  };

  return (
    <section className="py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10" />
      <div className="absolute inset-0 grid-bg-subtle" />
      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="glass-strong p-8 md:p-12 text-center max-w-3xl mx-auto relative overflow-hidden"
        >
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="absolute -top-4 -right-4 text-primary/20">
            <Sparkles className="w-16 h-16" />
          </motion.div>
          <h2 className="font-display text-2xl md:text-4xl font-bold mb-4">
            <span className="text-gradient-gold">Sua próxima conquista</span><br />
            <span className="text-foreground">começa no Ellite</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Profissionais de alto nível escolhem ambientes de alto nível. Agende uma visita gratuita.
          </p>
          <MagneticButton
            onClick={scrollToPlans}
            data-cta-id="cta-banner-plans"
            data-cta-label="Ver Planos (Banner)"
            data-cta-type="anchor"
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold rounded-xl bg-primary text-primary-foreground glow-gold transition-all"
          >
            Ver Planos <ArrowRight className="w-5 h-5" />
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
};

export default CTABanner;
