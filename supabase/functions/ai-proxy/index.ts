import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface AIRequest {
  messages: Array<{ role: string; content: string }>;
  provider?: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

// Chamar Groq
async function callGroq(
  apiKey: string,
  messages: any[],
  model: string,
  temperature: number,
  maxTokens: number,
  stream: boolean
) {
  const endpoint = "https://api.groq.com/openai/v1/chat/completions";

  const payload = {
    model: model || "llama-3.3-70b-versatile",
    messages,
    temperature: temperature || 0.7,
    max_tokens: maxTokens || 1024,
    stream,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Groq error: ${response.statusText}`);
  }

  return response;
}

// Chamar OpenAI
async function callOpenAI(
  apiKey: string,
  messages: any[],
  model: string,
  temperature: number,
  maxTokens: number,
  stream: boolean
) {
  const endpoint = "https://api.openai.com/v1/chat/completions";

  const payload = {
    model: model || "gpt-4o-mini",
    messages,
    temperature: temperature || 0.7,
    max_tokens: maxTokens || 1024,
    stream,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`OpenAI error: ${response.statusText}`);
  }

  return response;
}

// Chamar Gemini
async function callGemini(
  apiKey: string,
  messages: any[],
  model: string,
  temperature: number,
  maxTokens: number,
  stream: boolean
) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model || "gemini-2.0-flash"}:generateContent?key=${apiKey}`;

  const contents = messages.map((msg) => ({
    role: msg.role === "user" ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const payload = {
    contents,
    generationConfig: {
      temperature: temperature || 0.7,
      maxOutputTokens: maxTokens || 1024,
    },
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Gemini error: ${response.statusText}`);
  }

  return response;
}

// Roteador de LLM
async function callLLM(
  provider: string,
  apiKey: string,
  messages: any[],
  model: string,
  temperature: number,
  maxTokens: number,
  stream: boolean
) {
  const providerLower = provider.toLowerCase();

  if (providerLower === "groq") {
    return callGroq(apiKey, messages, model, temperature, maxTokens, stream);
  } else if (providerLower === "openai") {
    return callOpenAI(apiKey, messages, model, temperature, maxTokens, stream);
  } else if (providerLower === "gemini") {
    return callGemini(apiKey, messages, model, temperature, maxTokens, stream);
  } else {
    throw new Error(`Provedor ${provider} não suportado`);
  }
}

// Handler principal
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      messages,
      provider = "groq",
      model,
      temperature = 0.7,
      max_tokens = 1024,
      stream = false,
    }: AIRequest = await req.json();

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Obter usuário autenticado
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Obter organização do usuário
    const { data: org } = await supabase
      .from("organizations")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!org) {
      return new Response(JSON.stringify({ error: "Organização não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Obter configuração do provedor
    const { data: providerConfig } = await supabase
      .from("ai_provider_configs")
      .select("*")
      .eq("organization_id", org.id)
      .eq("provider_name", provider)
      .eq("is_active", true)
      .single();

    if (!providerConfig) {
      return new Response(
        JSON.stringify({ error: `Provedor ${provider} não configurado` }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Chamar LLM
    const response = await callLLM(
      provider,
      providerConfig.api_key,
      messages,
      model || providerConfig.model_name,
      temperature,
      max_tokens,
      stream
    );

    if (stream) {
      // Retornar stream diretamente
      return new Response(response.body, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    } else {
      // Retornar resposta completa
      const data = await response.json();

      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err: any) {
    console.error("Erro ao chamar LLM:", err);

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
