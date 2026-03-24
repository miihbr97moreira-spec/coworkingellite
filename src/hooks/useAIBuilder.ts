import { useState, useCallback } from "react";
import { toast } from "sonner";

interface AIResponse {
  message: string;
  updatedConfig?: Record<string, any>;
  action?: "create_section" | "modify_element" | "change_theme" | "restore";
}

export const useAIBuilder = () => {
  const [isLoading, setIsLoading] = useState(false);

  const processPrompt = useCallback(
    async (prompt: string, currentConfig: Record<string, any>): Promise<AIResponse | null> => {
      setIsLoading(true);
      try {
        // Simular chamada à API de IA
        // Em produção, isso seria uma chamada real ao OpenAI ou similar
        
        const response = await new Promise<AIResponse>((resolve) => {
          setTimeout(() => {
            // Lógica simples de interpretação de prompts
            if (prompt.toLowerCase().includes("nova seção")) {
              resolve({
                message: "Vou criar uma nova seção para você. Qual tipo de seção você gostaria? (Features, Testimonials, CTA, etc)",
                action: "create_section",
              });
            } else if (prompt.toLowerCase().includes("mude") || prompt.toLowerCase().includes("altere")) {
              resolve({
                message: "Entendi! Vou aplicar as mudanças solicitadas.",
                action: "modify_element",
                updatedConfig: {
                  ...currentConfig,
                  theme: {
                    ...currentConfig.theme,
                    modified_at: new Date().toISOString(),
                  },
                },
              });
            } else if (prompt.toLowerCase().includes("tema") || prompt.toLowerCase().includes("cores")) {
              resolve({
                message: "Vou atualizar o tema e cores conforme solicitado.",
                action: "change_theme",
                updatedConfig: {
                  ...currentConfig,
                  theme: {
                    ...currentConfig.theme,
                    updated_at: new Date().toISOString(),
                  },
                },
              });
            } else if (prompt.toLowerCase().includes("restaurar") || prompt.toLowerCase().includes("padrão")) {
              resolve({
                message: "Landing Page restaurada para o padrão original.",
                action: "restore",
              });
            } else {
              resolve({
                message: `Processando seu pedido: "${prompt}". Como posso ajudar melhor? Tente ser mais específico (ex: "Crie uma seção de benefícios", "Mude as cores para azul", etc)`,
              });
            }
          }, 1000);
        });

        return response;
      } catch (error) {
        console.error("Erro ao processar prompt:", error);
        toast.error("Erro ao processar solicitação da IA");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { processPrompt, isLoading };
};
