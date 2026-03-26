import { useState, useCallback } from "react";
import { toast } from "sonner";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-builder`;
const BYOK_KEY = "ellite_byok";

function loadBYOK() {
  try { return JSON.parse(localStorage.getItem(BYOK_KEY) || "{}"); } catch { return {}; }
}

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
        const byok = loadBYOK();
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt, mode: "edit", currentConfig, byok: byok.enabled ? byok : undefined }),
        });

        if (resp.status === 429) { toast.error("Rate limit atingido."); return null; }
        if (resp.status === 402) { toast.error("Créditos insuficientes."); return null; }
        if (!resp.ok) throw new Error("AI error");

        return await resp.json() as AIResponse;
      } catch (error) {
        console.error("Erro:", error);
        toast.error("Erro ao conectar com a IA.");
        return null;
      } finally {
        setIsLoading(false);
      }
    }, []
  );

  const generatePage = useCallback(
    async (prompt: string, onDelta: (text: string) => void, onDone: () => void) => {
      setIsLoading(true);
      try {
        const byok = loadBYOK();
        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt, mode: "generate", byok: byok.enabled ? byok : undefined }),
        });

        if (resp.status === 429) { toast.error("Rate limit atingido."); onDone(); return; }
        if (resp.status === 402) { toast.error("Créditos insuficientes."); onDone(); return; }
        if (!resp.ok || !resp.body) throw new Error("Stream error");

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let streamDone = false;

        while (!streamDone) {
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
            if (jsonStr === "[DONE]") { streamDone = true; break; }
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) onDelta(content);
            } catch { /* partial */ }
          }
        }
        onDone();
      } catch (error) {
        console.error("Erro ao gerar:", error);
        toast.error("Erro ao gerar página.");
        onDone();
      } finally {
        setIsLoading(false);
      }
    }, []
  );

  return { processPrompt, generatePage, isLoading };
};
