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
    const { prompt, mode, currentConfig } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt =
      mode === "generate"
        ? `Você é um gerador de Landing Pages de elite. O usuário vai descrever o que quer e você deve gerar código HTML completo, moderno, responsivo, com Tailwind CSS inline via CDN.

REGRAS OBRIGATÓRIAS:
- Retorne APENAS HTML puro e completo (com <!DOCTYPE html>, <head> com CDN do Tailwind, <body>)
- Use classes Tailwind para TUDO: layout, cores, tipografia, espaçamento, animações
- Inclua efeitos: hover transitions, gradients, glassmorphism (backdrop-blur), shadows
- Use fontes do Google Fonts (Inter, Space Grotesk, Playfair Display)
- Crie seções: Hero, Features, Social Proof, Pricing, CTA, Footer
- Tema dark por padrão (bg-gray-950, text-white) com acentos dourados (#FBBF24)
- Imagens: use https://images.unsplash.com/photo-XXXXX?w=800 com IDs reais do Unsplash
- Botões com efeitos hover e transições suaves
- Design premium, nível Apple/Stripe
- NÃO inclua JavaScript, apenas HTML + Tailwind
- NÃO use comentários explicativos, apenas código

Responda com JSON: { "html": "<código completo>", "title": "Título da página" }`
        : `Você é um assistente de edição de Landing Pages. O usuário descreve mudanças para a landing page atual. Analise o pedido e retorne instruções claras.

Configuração atual: ${JSON.stringify(currentConfig || {})}

Responda com JSON: { "message": "Explicação do que foi feito", "updatedConfig": { ...campos alterados }, "action": "modify_element" | "change_theme" | "restore" }

Se o usuário pedir para restaurar, use action "restore". Se pedir mudanças de cor/tema, use "change_theme". Para edições de texto/conteúdo, use "modify_element".`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          stream: mode === "generate",
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns segundos." }),
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
      console.error("AI gateway error:", response.status, t);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    if (mode === "generate") {
      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from the response
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
