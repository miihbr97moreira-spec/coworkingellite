import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Provedores de notificação
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE = Deno.env.get("TWILIO_PHONE");

interface NotificationRequest {
  organization_id: string;
  event_type: string;
  title: string;
  content: string;
  data?: Record<string, any>;
  channels?: ("email" | "sms" | "push")[];
}

// Enviar email via Resend
async function sendEmail(
  toEmail: string,
  subject: string,
  content: string,
  data?: Record<string, any>
) {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY não configurado");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "noreply@omniflow.com",
        to: toEmail,
        subject,
        html: `
          <h2>${subject}</h2>
          <p>${content}</p>
          ${data?.link ? `<a href="${data.link}" style="padding: 10px 20px; background: #D97757; color: white; text-decoration: none; border-radius: 4px;">Ver Detalhes</a>` : ""}
        `,
      }),
    });

    return response.ok;
  } catch (err) {
    console.error("Erro ao enviar email:", err);
    return false;
  }
}

// Enviar SMS via Twilio
async function sendSMS(toPhone: string, message: string) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE) {
    console.warn("Twilio não configurado");
    return false;
  }

  try {
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          From: TWILIO_PHONE,
          To: toPhone,
          Body: message,
        }).toString(),
      }
    );

    return response.ok;
  } catch (err) {
    console.error("Erro ao enviar SMS:", err);
    return false;
  }
}

// Enviar notificação push via Supabase
async function sendPushNotification(
  userId: string,
  title: string,
  content: string,
  data?: Record<string, any>
) {
  try {
    // Salvar notificação no banco
    await supabase.from("owner_notifications").insert({
      user_id: userId,
      title,
      content,
      data,
      is_read: false,
      created_at: new Date().toISOString(),
    });

    // TODO: Integrar com serviço de push real (Firebase Cloud Messaging, OneSignal, etc)
    return true;
  } catch (err) {
    console.error("Erro ao enviar push:", err);
    return false;
  }
}

// Obter preferências de notificação do usuário
async function getUserNotificationPreferences(userId: string) {
  try {
    const { data } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    return data || { email: true, sms: false, push: true };
  } catch (err) {
    console.error("Erro ao obter preferências:", err);
    return { email: true, sms: false, push: true };
  }
}

// Handler principal
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      organization_id,
      event_type,
      title,
      content,
      data,
      channels = ["email", "push"],
    }: NotificationRequest = await req.json();

    if (!organization_id || !title || !content) {
      return new Response(
        JSON.stringify({ error: "Parâmetros obrigatórios faltando" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Obter proprietário da organização
    const { data: org } = await supabase
      .from("organizations")
      .select("owner_id")
      .eq("id", organization_id)
      .single();

    if (!org) {
      return new Response(JSON.stringify({ error: "Organização não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Obter dados do usuário
    const { data: user } = await supabase.auth.admin.getUserById(org.owner_id);

    if (!user) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Obter preferências de notificação
    const prefs = await getUserNotificationPreferences(org.owner_id);

    // Enviar notificações
    const results = {
      email: false,
      sms: false,
      push: false,
    };

    if (channels.includes("email") && prefs.email && user.email) {
      results.email = await sendEmail(user.email, title, content, data);
    }

    if (channels.includes("sms") && prefs.sms && user.phone) {
      results.sms = await sendSMS(user.phone, `${title}: ${content}`);
    }

    if (channels.includes("push") && prefs.push) {
      results.push = await sendPushNotification(org.owner_id, title, content, data);
    }

    // Registrar log
    await supabase.from("notification_logs").insert({
      organization_id,
      user_id: org.owner_id,
      event_type,
      title,
      content,
      channels,
      results,
      created_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ status: "success", results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Erro ao enviar notificação:", err);

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
