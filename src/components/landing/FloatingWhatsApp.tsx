import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useLPConfig, trackEvent } from "@/hooks/useSupabaseQuery";
import { useCTASync } from "@/hooks/useCTASync";

const FloatingWhatsApp = () => {
  const { data: config } = useLPConfig();
  const { syncCTAClick } = useCTASync();
  const whatsappConfig = config?.whatsapp as { number?: string } | undefined;

  const handleClick = () => {
    trackEvent("whatsapp_click", { source: "floating" });
    syncCTAClick("floating-whatsapp", "WhatsApp Flutuante", "whatsapp");
  };

  return (
    <motion.button
      onClick={handleClick}
      data-cta-id="floating-whatsapp"
      data-cta-label="WhatsApp Flutuante"
      data-cta-type="whatsapp"
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
