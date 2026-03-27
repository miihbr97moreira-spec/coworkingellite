import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface WebhookPayload {
  event: string;
  data: any;
  timestamp: number;
  apiKey?: string;
}

interface Message {
  phone: string;
  text?: string;
  media?: {
    url: string;
    type: string;
  };
  fromMe: boolean;
  timestamp: number;
  groupJid?: string;
  senderName?: string;
  messageId: string;
}

// Normalizar payload de diferentes provedores
async function normalizePayload(body: any, provider: string) {
  let normalized: Message | null = null;

  if (provider === "z-api") {
    // Z-API format
    normalized = {
      phone: body.phone?.replace(/\D/g, "") || "",
      text: body.text,
      media: body.media,
      fromMe: body.fromMe === true,
      timestamp: body.timestamp || Date.now(),
      groupJid: body.groupJid,
      senderName: body.senderName,
      messageId: body.messageId || `${Date.now()}-${Math.random()}`,
    };
  } else if (provider === "evolution") {
    // Evolution format
    normalized = {
      phone: body.data?.key?.remoteJid?.replace(/\D/g, "") || "",
      text: body.data?.message?.conversation || body.data?.message?.extendedTextMessage?.text,
      media: body.data?.message?.imageMessage || body.data?.message?.audioMessage,
      fromMe: body.data?.key?.fromMe === true,
      timestamp: body.data?.messageTimestamp || Date.now(),
      groupJid: body.data?.key?.remoteJid?.includes("@g.us") ? body.data.key.remoteJid : undefined,
      senderName: body.data?.pushName,
      messageId: body.data?.key?.id || `${Date.now()}-${Math.random()}`,
    };
  }

  return normalized;
}

// Detectar se é grupo
function isGroup(phone: string, groupJid?: string): boolean {
  return !!groupJid || phone.includes("@g.us");
}

// Deduplicar mensagem
async function isDuplicate(messageId: string, organizationId: string): Promise<boolean> {
  const { data } = await supabase
    .from("messages")
    .select("id")
    .eq("external_message_id", messageId)
    .eq("organization_id", organizationId)
    .single();

  return !!data;
}

// Criar ou atualizar contato
async function upsertContact(phone: string, organizationId: string, senderName?: string) {
  const { data, error } = await supabase
    .from("contacts")
    .upsert(
      {
        phone,
        organization_id: organizationId,
        name: senderName || `Contato ${phone}`,
      },
      { onConflict: "phone,organization_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("Erro ao upsert contato:", error);
    return null;
  }

  return data;
}

// Criar lead automaticamente
async function createLeadIfNeeded(
  contactId: string,
  organizationId: string,
  autoCreateLead: boolean
) {
  if (!autoCreateLead) return null;

  const { data: existingLead } = await supabase
    .from("leads")
    .select("id")
    .eq("contact_id", contactId)
    .eq("organization_id", organizationId)
    .single();

  if (existingLead) return existingLead;

  const { data: newLead, error } = await supabase
    .from("leads")
    .insert({
      contact_id: contactId,
      organization_id: organizationId,
      status: "novo",
      source: "whatsapp",
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar lead:", error);
    return null;
  }

  return newLead;
}

// Executar automações de chat
async function runChatAutomations(
  clientId: string,
  organizationId: string,
  message: Message
) {
  try {
    const { data: automations } = await supabase
      .from("chat_automations")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (!automations) return;

    for (const automation of automations) {
      // Verificar gatilho
      let shouldTrigger = false;

      if (automation.trigger_type === "any_message") {
        shouldTrigger = true;
      } else if (automation.trigger_type === "keyword" && message.text) {
        // Implementar lógica de palavra-chave
        shouldTrigger = true;
      } else if (automation.trigger_type === "first_message") {
        // Verificar se é primeira mensagem
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact" })
          .eq("client_id", clientId);

        shouldTrigger = count === 1;
      }

      if (shouldTrigger) {
        console.log(`Automação ${automation.id} acionada`);
        // Executar ações da automação
      }
    }
  } catch (err) {
    console.error("Erro ao executar automações:", err);
  }
}

// Handler principal
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const apiKey = url.searchParams.get("api_key");
    const provider = url.searchParams.get("provider") || "z-api";

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validar API key
    const { data: keyData } = await supabase
      .from("api_keys")
      .select("organization_id")
      .eq("key_hash", await hashKey(apiKey))
      .single();

    if (!keyData) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const organizationId = keyData.organization_id;
    const body = await req.json();

    // Normalizar payload
    const message = await normalizePayload(body, provider);

    if (!message || !message.phone) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduplicar
    if (await isDuplicate(message.messageId, organizationId)) {
      return new Response(JSON.stringify({ status: "duplicate" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Criar/atualizar contato
    const contact = await upsertContact(message.phone, organizationId, message.senderName);

    if (!contact) {
      return new Response(JSON.stringify({ error: "Failed to create contact" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verificar auto-create lead
    const { data: whatsappConfig } = await supabase
      .from("whatsapp_configs")
      .select("auto_create_lead")
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .single();

    await createLeadIfNeeded(contact.id, organizationId, whatsappConfig?.auto_create_lead || false);

    // Salvar mensagem
    const { error: msgError } = await supabase.from("messages").insert({
      organization_id: organizationId,
      client_id: contact.id,
      sender_phone: message.phone,
      sender_name: message.senderName || "Desconhecido",
      content: message.text || "[Mídia]",
      media_url: message.media?.url,
      media_type: message.media?.type,
      direction: message.fromMe ? "outbound" : "inbound",
      status: "received",
      is_group: isGroup(message.phone, message.groupJid),
      group_jid: message.groupJid,
      external_message_id: message.messageId,
      created_at: new Date(message.timestamp * 1000).toISOString(),
    });

    if (msgError) {
      console.error("Erro ao salvar mensagem:", msgError);
      return new Response(JSON.stringify({ error: "Failed to save message" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Executar automações
    await runChatAutomations(contact.id, organizationId, message);

    // Log do webhook
    await supabase.from("webhook_logs").insert({
      organization_id: organizationId,
      event_type: "message_received",
      status: "success",
      payload: body,
    });

    return new Response(JSON.stringify({ status: "success" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Erro no webhook:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper para hash de chave
async function hashKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
