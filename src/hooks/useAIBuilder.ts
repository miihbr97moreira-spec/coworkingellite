import { useState, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
        const { data, error } = await supabase.functions.invoke("ai-builder", {
          body: { prompt, currentConfig },
        });

        if (error) throw error;
        return data as AIResponse;
      } catch (error) {
        console.error("Erro ao processar prompt:", error);
        
        // Fallback para simulação se a Edge Function não estiver pronta
        const fallbackResponse: AIResponse = {
          message: "A integração com a IA está sendo processada. Por enquanto, posso ajudar com comandos básicos como 'mudar cores' ou 'restaurar'.",
          action: prompt.toLowerCase().includes("restaurar") ? "restore" : "modify_element"
        };
        
        toast.error("Erro ao conectar com a IA. Usando modo de segurança.");
        return fallbackResponse;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { processPrompt, isLoading };
};
