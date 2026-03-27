import React, { useState } from "react";
import { motion } from "framer-motion";
import { OmniCheckout, CheckoutConfig, CheckoutData } from "./OmniCheckout";
import { useQuizCheckoutFlow } from "@/hooks/useQuizCheckoutFlow";
import { useCheckoutStore } from "@/hooks/useCheckoutStore";
import { toast } from "sonner";

interface CheckoutPreviewProps {
  config: CheckoutConfig;
  funnelId?: string;
  stageIdWon?: string;
  onSuccess?: (data: CheckoutData) => void;
}

/**
 * Componente de Preview do Checkout para o Builder
 * Renderiza o checkout com dados pre-preenchidos do Quiz
 */
export const CheckoutPreview: React.FC<CheckoutPreviewProps> = ({
  config,
  funnelId = "",
  stageIdWon = "",
  onSuccess,
}) => {
  const { quizData } = useQuizCheckoutFlow();
  const { processCheckout, isProcessing } = useCheckoutStore();
  const [formData, setFormData] = useState({
    name: quizData.name || "",
    email: quizData.email || "",
    phone: quizData.phone || "",
    cardNumber: "",
    cardExpiry: "",
    cardCVV: "",
  });

  const handleCheckoutSuccess = async (data: CheckoutData) => {
    try {
      // Processar checkout e sincronizar com CRM
      await processCheckout(data, funnelId, stageIdWon);

      toast.success("Pagamento realizado com sucesso! Lead criado no CRM.");

      // Callback de sucesso
      onSuccess?.(data);
    } catch (error) {
      toast.error("Erro ao processar checkout. Tente novamente.");
      console.error("Checkout error:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      <OmniCheckout
        config={config}
        onSuccess={handleCheckoutSuccess}
        onError={(error) => toast.error(error)}
        isEditing={false}
      />
    </motion.div>
  );
};

export default CheckoutPreview;
