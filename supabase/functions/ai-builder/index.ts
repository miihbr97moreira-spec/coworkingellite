import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, mode, currentConfig, byok } = await req.json();

    // Determine API endpoint and key
    let apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
    let apiKey = Deno.env.get("LOVABLE_API_KEY");
    let model = "google/gemini-3-flash-preview";

    if (byok?.enabled && byok?.apiKey) {
      apiKey = byok.apiKey;
      model = byok.model || "gpt-4o";
      switch (byok.provider) {
        case "openai": apiUrl = "https://api.openai.com/v1/chat/completions"; break;
        case "anthropic": apiUrl = "https://api.anthropic.com/v1/messages"; break;
        case "groq": apiUrl = "https://api.groq.com/openai/v1/chat/completions"; break;
        case "openrouter": apiUrl = "https://openrouter.ai/api/v1/chat/completions"; break;
        case "gemini": apiUrl = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions"; break;
        default: apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions"; break;
      }
    }

    if (!apiKey) throw new Error("API key not configured");

    const systemPrompt =
      mode === "generate"
        ? `Você é um gerador de Landing Pages de ELITE MUNDIAL. O usuário descreve o que quer e você gera HTML completo, moderno, responsivo, premium.

REGRAS OBRIGATÓRIAS:
- Retorne APENAS HTML puro completo (<!DOCTYPE html>, <head> com CDN do Tailwind via https://cdn.tailwindcss.com, <body>)
- Use classes Tailwind para TUDO: layout, cores, tipografia, espaçamento
- Inclua efeitos visuais: hover transitions, gradients, glassmorphism (backdrop-blur-xl), shadows
- Use Google Fonts (Inter, Space Grotesk, Playfair Display) via <link> HTTPS
- Crie seções completas: Hero com CTA, Features com ícones, Social Proof, Pricing, FAQ, Footer
- Tema dark sofisticado (bg-gray-950, text-white) com acentos vibrantes
- Imagens: use https://images.unsplash.com com IDs reais
- Botões com hover effects e transições suaves (transition-all duration-300)
- Adicione animações CSS inline: @keyframes fadeInUp, slideIn
- Design nivel Apple/Stripe/Vercel
- NÃO use JavaScript complexo, apenas CSS animations
- NÃO inclua comentários, apenas código limpo
- Responda SOMENTE com o HTML, sem JSON wrapper, sem markdown fences`
        : `Você é um assistente de edição de Landing Pages. Analise o pedido e retorne instruções claras em JSON.

Configuração atual: ${JSON.stringify(currentConfig || {})}

Responda com JSON: { "message": "Explicação do que foi feito", "updatedConfig": { ...campos alterados }, "action": "modify_element" | "change_theme" | "restore" }`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Anthropic uses x-api-key, others use Authorization Bearer
    if (byok?.provider === "anthropic") {
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
    } else {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        stream: mode === "generate",
        ...(mode === "generate" ? { max_tokens: 16000 } : {}),
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit atingido. Tente novamente em alguns segundos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Adicione créditos em Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error(`AI error: ${response.status}`);
    }

    if (mode === "generate") {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { message: content };
    } catch {
      parsed = { message: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-builder error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
