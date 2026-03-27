import { useState, useCallback } from "react";
import { toast } from "sonner";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-builder`;
const BYOK_KEY = "ellite_byok";

interface BYOKConfig {
  enabled: boolean;
  provider: string;
  apiKey: string;
  model: string;
}

function loadBYOK(): BYOKConfig {
  try {
    const stored = localStorage.getItem(BYOK_KEY);
    if (!stored) return { enabled: false, provider: "openai", apiKey: "", model: "gpt-4o" };
    const parsed = JSON.parse(stored);
    return {
      enabled: parsed.enabled === true,
      provider: parsed.provider || "openai",
      apiKey: parsed.apiKey || "",
      model: parsed.model || "gpt-4o"
    };
  } catch {
    return { enabled: false, provider: "openai", apiKey: "", model: "gpt-4o" };
  }
}

interface AIResponse {
  message: string;
  updatedConfig?: Record<string, any>;
  action?: "create_section" | "modify_element" | "change_theme" | "restore";
}

export const useAIBuilder = () => {
  const [isLoading, setIsLoading] = useState(false);

  const processPrompt = useCallback(
    async (prompt: string, currentConfig: Record<string, any>): Promise<string> => {
      setIsLoading(true);
      try {
        const byok = loadBYOK();

        // Validação: Se BYOK está ativado, verificar se a chave está preenchida
        if (byok.enabled && !byok.apiKey?.trim()) {
          toast.error("Chave API BYOK não configurada. Configure em Configurar IA.");
          setIsLoading(false);
          return "";
        }

        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt,
            mode: "edit",
            currentConfig,
            byok: byok.enabled ? {
              enabled: true,
              provider: byok.provider,
              apiKey: byok.apiKey,
              model: byok.model
            } : undefined
          }),
        });

        if (resp.status === 429) {
          toast.error("Rate limit atingido. Aguarde um momento.");
          return "";
        }
        if (resp.status === 402) {
          toast.error("Créditos insuficientes ou chave API inválida.");
          return "";
        }
        if (resp.status === 401) {
          toast.error("Chave API BYOK inválida ou expirada. Verifique suas credenciais.");
          return "";
        }
        if (!resp.ok) {
          const errorText = await resp.text();
          console.error("AI error response:", errorText);
          throw new Error(`AI error: ${resp.status}`);
        }

        const data = await resp.json() as AIResponse;
        return data.message || "";
      } catch (error) {
        console.error("Erro ao processar prompt:", error);
        toast.error("Erro ao conectar com a IA. Verifique sua configuração.");
        return "";
      } finally {
        setIsLoading(false);
      }
    }, []
  );

  const generatePage = useCallback(
    async (prompt: string): Promise<string> => {
      setIsLoading(true);
      try {
        const byok = loadBYOK();

        // Validação: Se BYOK está ativado, verificar se a chave está preenchida
        if (byok.enabled && !byok.apiKey?.trim()) {
          toast.error("Chave API BYOK não configurada. Configure em Configurar IA.");
          setIsLoading(false);
          return "";
        }

        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            prompt,
            mode: "generate",
            byok: byok.enabled ? {
              enabled: true,
              provider: byok.provider,
              apiKey: byok.apiKey,
              model: byok.model
            } : undefined
          }),
        });

        if (resp.status === 429) {
          toast.error("Rate limit atingido. Aguarde um momento.");
          return "";
        }
        if (resp.status === 402) {
          toast.error("Créditos insuficientes ou chave API inválida.");
          return "";
        }
        if (resp.status === 401) {
          toast.error("Chave API BYOK inválida ou expirada. Verifique suas credenciais.");
          return "";
        }
        if (!resp.ok || !resp.body) {
          const errorText = await resp.text();
          console.error("Stream error response:", errorText);
          throw new Error(`Stream error: ${resp.status}`);
        }

        let fullContent = "";
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let idx: number;
          while ((idx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullContent += content;
            } catch { /* partial */ }
          }
        }

        return fullContent;
      } catch (error) {
        console.error("Erro ao gerar página:", error);
        toast.error("Erro ao gerar página. Verifique sua configuração de IA.");
        return "";
      } finally {
        setIsLoading(false);
      }
    }, []
  );

  return { processPrompt, generatePage, isLoading };
};
