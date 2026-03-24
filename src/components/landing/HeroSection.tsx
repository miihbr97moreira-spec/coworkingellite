import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import MagneticButton from "./MagneticButton";
import ScrollRevealText from "./ScrollRevealText";
import { useLPConfig } from "@/hooks/useSupabaseQuery";

const HeroSection = () => {
  const { data: config } = useLPConfig();
  const hero = config?.hero as { headline?: string; subheadline?: string } | undefined;

  const headline = hero?.headline || "Saia do amadorismo do Home Office. Feche contratos de alto valor em um ambiente de elite.";
  const subheadline = hero?.subheadline || "O coworking premium em Moema para profissionais que exigem excelência. Sua próxima conquista começa aqui.";

  const scrollToPlans = () => {
    document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden grid-bg">
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/3 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: "1s" }} />

      <div className="container relative z-10 px-4 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block px-4 py-1.5 mb-8 text-xs font-semibold tracking-widest uppercase rounded-full border border-primary/30 text-primary bg-primary/5"
          >
            Coworking Premium em Moema — São Paulo
          </motion.span>

          <h1 
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 editable-element cursor-pointer hover:ring-2 hover:ring-primary/50 rounded-lg transition-all"
            data-type="text"
            data-path="hero.headline"
          >
            <span className="text-gradient-gold">{headline}</span>
          </h1>

          <div
            className="editable-element cursor-pointer hover:ring-2 hover:ring-primary/50 rounded-lg transition-all mb-10"
            data-type="text"
            data-path="hero.subheadline"
          >
            <ScrollRevealText
              text={subheadline}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto justify-center"
            />
          </div>

          <MagneticButton
            onClick={scrollToPlans}
            className="inline-flex items-center gap-2 px-8 py-4 text-lg font-bold rounded-xl bg-primary text-primary-foreground glow-gold animate-pulse-glow transition-all"
          >
            Conhecer os Planos
            <ArrowDown className="w-5 h-5" />
          </MagneticButton>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
