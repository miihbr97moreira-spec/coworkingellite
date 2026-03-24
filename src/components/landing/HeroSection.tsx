import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
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
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Ticto Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: "2s" }} />
      
      {/* Grid Overlay Subtil */}
      <div className="absolute inset-0 bg-[url('https://ticto.com.br/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20 pointer-events-none" />

      <div className="container relative z-10 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-5xl mx-auto"
        >
          {/* Badge Ticto Style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-10 text-[10px] font-black tracking-[0.3em] uppercase rounded-full border border-white/10 bg-white/5 text-zinc-400 backdrop-blur-md"
          >
            <Sparkles className="w-3 h-3 text-primary" />
            Coworking Premium em Moema — São Paulo
          </motion.div>

          {/* Headline Gigante Ticto Style */}
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.1] mb-8 tracking-tight">
            <span className="inline-block text-white">
              {headline.split('. ')[0]}.
            </span>
            <br />
            <span className="text-gradient-ticto">
              {headline.split('. ')[1]}
            </span>
          </h1>

          {/* Subheadline Ticto Style */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-lg md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-12 leading-relaxed font-medium"
          >
            {subheadline}
          </motion.p>

          {/* Buttons Ticto Style */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <button
              onClick={scrollToPlans}
              className="ticto-button group"
            >
              Crie sua conta agora
              <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
            </button>
            
            <button
              onClick={() => document.getElementById('espaco')?.scrollIntoView({ behavior: 'smooth' })}
              className="ticto-button-outline"
            >
              Conhecer o espaço
            </button>
          </motion.div>

          {/* Trust Indicators Ticto Style */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-20 pt-10 border-t border-white/5 flex flex-wrap justify-center gap-x-12 gap-y-6 opacity-40 grayscale hover:grayscale-0 transition-all duration-500"
          >
            <img src="https://ticto.com.br/tabler-icon-currency-dollar.svg" alt="Trust" className="h-6" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Ambiente de Elite</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Privacidade Total</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Networking VIP</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom Gradient Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
    </section>
  );
};

export default HeroSection;
