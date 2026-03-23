import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { useSiteContent } from "@/context/SiteContext";

const FloatingWhatsApp = () => {
  const { content } = useSiteContent();

  return (
    <motion.a
      href={`https://wa.me/${content.whatsappNumber}?text=${encodeURIComponent("Olá, gostaria de saber mais sobre o Ellite Coworking!")}`}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 2, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg shadow-[#25D366]/30 animate-pulse-glow"
      style={{ boxShadow: "0 0 20px rgba(37, 211, 102, 0.4), 0 0 40px rgba(37, 211, 102, 0.15)" }}
    >
      <MessageCircle className="w-7 h-7 text-white" />
    </motion.a>
  );
};

export default FloatingWhatsApp;
