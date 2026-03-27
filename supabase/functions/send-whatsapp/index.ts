import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface SendRequest {
  phone: string;
  content: string;
  media_url?: string;
  media_type?: string;
}

// Resolver configuração do provedor pelo telefone
async function resolveProvider(phone: string, organizationId: string) {
  const { data: config } = await supabase
    .from("whatsapp_configs")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_active", true)
    .single();

  if (!config) {
    throw new Error("WhatsApp não configurado");
  }

  return config;
}

// Enviar para Z-API
async function sendViaZApi(
  config: any,
  phone: string,
  content: string,
  mediaUrl?: string
): Promise<any> {
  const endpoint = `${config.base_url}/send-text`;

  const payload: any = {
    phone,
    message: content,
  };

  if (mediaUrl) {
    payload.media = mediaUrl;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.api_token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Z-API error: ${response.statusText}`);
  }

  return response.json();
}

// Enviar para Evolution
async function sendViaEvolution(
  config: any,
  phone: string,
  content: string,
  mediaUrl?: string
): Promise<any> {
  const endpoint = `${config.base_url}/message/sendText`;

  const payload: any = {
    number: phone,
    text: content,
  };

  if (mediaUrl) {
    payload.mediaUrl = mediaUrl;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.api_token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Evolution error: ${response.statusText}`);
  }

  return response.json();
}

// Roteador de envio
async function sendMessage(
  config: any,
  phone: string,
  content: string,
  mediaUrl?: string
): Promise<any> {
  const apiType = config.api_type.toLowerCase();

  if (apiType === "z-api") {
    return sendViaZApi(config, phone, content, mediaUrl);
  } else if (apiType === "evolution") {
    return sendViaEvolution(config, phone, content, mediaUrl);
  } else {
    throw new Error(`Provedor ${apiType} não suportado`);
  }
}

// Handler principal
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone, content, media_url, media_type }: SendRequest = await req.json();

    if (!phone || !content) {
      return new Response(JSON.stringify({ error: "phone e content são obrigatórios" }), {
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

    // Resolver configuração do provedor
    const config = await resolveProvider(phone, org.id);

    // Enviar mensagem
    const result = await sendMessage(config, phone, content, media_url);

    // Registrar log
    await supabase.from("webhook_logs").insert({
      organization_id: org.id,
      event_type: "message_sent",
      status: "success",
      payload: { phone, content, result },
    });

    return new Response(
      JSON.stringify({
        status: "success",
        external_sent: true,
        external_id: result.messageId || result.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Erro ao enviar mensagem:", err);

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
