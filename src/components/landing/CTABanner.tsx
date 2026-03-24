import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import { trackEvent } from "@/hooks/useSupabaseQuery";

const CTABanner = () => {
  const scrollToPlans = () => {
    trackEvent("cta_click", { source: "banner" });
    document.getElementById("planos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Ticto Style Background Orbs */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-primary/10 rounded-full blur-[150px] pointer-events-none animate-pulse" />
      <div className="absolute inset-0 bg-[url('https://ticto.com.br/grid.svg')] bg-center opacity-10 pointer-events-none" />

      <div className="container px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="bg-zinc-900/40 backdrop-blur-3xl border border-white/10 p-12 md:p-24 rounded-[4rem] text-center max-w-6xl mx-auto relative overflow-hidden group"
        >
          {/* Decorative Sparkles Ticto Style */}
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }} 
            className="absolute -top-10 -right-10 text-primary/10 group-hover:text-primary/20 transition-colors"
          >
            <Sparkles className="w-40 h-40" />
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-10 text-[10px] font-black tracking-[0.3em] uppercase rounded-full border border-primary/20 bg-primary/5 text-primary"
            >
              <Zap className="w-3 h-3" />
              Pronto para o próximo nível?
            </motion.div>

            <h2 className="font-display text-4xl md:text-7xl font-black mb-8 tracking-tight leading-[1.1]">
              Sua próxima conquista <br />
              <span className="text-gradient-ticto">começa no Ellite.</span>
            </h2>
            
            <p className="text-lg md:text-2xl text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
              Profissionais de alto nível escolhem ambientes de alto nível. Não perca a oportunidade de fazer parte do ecossistema mais exclusivo de Moema.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <button
                onClick={scrollToPlans}
                className="ticto-button group"
              >
                Garantir minha vaga
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </button>
              
              <button
                onClick={() => window.open('https://wa.me/5511976790653', '_blank')}
                className="ticto-button-outline"
              >
                Falar com consultor
              </button>
            </div>
          </div>

          {/* Bottom Decorative Line Ticto Style */}
          <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
};

export default CTABanner;
