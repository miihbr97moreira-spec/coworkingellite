import { motion } from "framer-motion";
import { MessageCircle, Sparkles } from "lucide-react";
import { useLPConfig, trackEvent } from "@/hooks/useSupabaseQuery";

const FloatingWhatsApp = () => {
  const { data: config } = useLPConfig();
  const whatsappConfig = config?.whatsapp as { number?: string } | undefined;
  const number = whatsappConfig?.number ?? "5511976790653";

  const handleClick = () => {
    trackEvent("whatsapp_click", { source: "floating" });
    window.open(`https://wa.me/${number}?text=${encodeURIComponent("Olá! Gostaria de saber mais sobre o Ellite Coworking.")}`, "_blank");
  };

  return (
    <div className="fixed bottom-10 right-10 z-[150] flex flex-col items-end gap-4">
      {/* Tooltip Ticto Style */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 3, duration: 0.8 }}
        className="bg-zinc-900/90 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl hidden md:block"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest text-white">Online agora</p>
        </div>
        <p className="text-xs font-medium text-zinc-400 mt-1">Fale com nosso concierge</p>
      </motion.div>

      <motion.button
        onClick={handleClick}
        initial={{ scale: 0, opacity: 0, rotate: -45 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ delay: 2, type: "spring", stiffness: 200, damping: 20 }}
        whileHover={{ scale: 1.1, y: -5 }}
        whileTap={{ scale: 0.9 }}
        className="relative w-16 h-16 rounded-[1.5rem] bg-emerald-500 flex items-center justify-center shadow-[0_20px_40px_rgba(16,185,129,0.3)] group overflow-hidden"
      >
        {/* Animated Background Shine */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        <MessageCircle className="w-8 h-8 text-white relative z-10" />
        
        {/* Decorative Sparkle */}
        <Sparkles className="absolute top-2 right-2 w-3 h-3 text-white/40 animate-pulse" />
      </motion.button>
    </div>
  );
};

export default FloatingWhatsApp;
