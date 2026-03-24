import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
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
    <motion.button
      onClick={handleClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 2, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg animate-pulse-glow"
      style={{ boxShadow: "0 0 20px rgba(37, 211, 102, 0.4), 0 0 40px rgba(37, 211, 102, 0.15)" }}
    >
      <MessageCircle className="w-7 h-7 text-white" />
    </motion.button>
  );
};

export default FloatingWhatsApp;
