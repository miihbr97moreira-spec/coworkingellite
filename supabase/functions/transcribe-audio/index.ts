import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

interface TranscriptionRequest {
  message_id: string;
  audio_url: string;
  language?: string;
}

// Baixar arquivo de áudio
async function downloadAudio(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erro ao baixar áudio: ${response.statusText}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

// Transcrever áudio com Whisper API
async function transcribeWithWhisper(
  audioBuffer: Uint8Array,
  language?: string
): Promise<{ text: string; language: string }> {
  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY não configurado");
  }

  // Criar FormData para upload
  const formData = new FormData();
  formData.append("file", new Blob([audioBuffer], { type: "audio/mpeg" }), "audio.mp3");
  formData.append("model", "whisper-1");

  if (language) {
    formData.append("language", language);
  }

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Erro na Whisper API: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    text: data.text,
    language: data.language || "pt",
  };
}

// Detectar idioma com Whisper (opcional)
async function detectLanguage(audioBuffer: Uint8Array): Promise<string> {
  if (!OPENAI_API_KEY) {
    return "pt";
  }

  const formData = new FormData();
  formData.append("file", new Blob([audioBuffer], { type: "audio/mpeg" }), "audio.mp3");
  formData.append("model", "whisper-1");

  const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    return "pt";
  }

  const data = await response.json();
  return data.language || "pt";
}

// Handler principal
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { message_id, audio_url, language }: TranscriptionRequest = await req.json();

    if (!message_id || !audio_url) {
      return new Response(
        JSON.stringify({ error: "message_id e audio_url são obrigatórios" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Obter mensagem
    const { data: message } = await supabase
      .from("messages")
      .select("*")
      .eq("id", message_id)
      .single();

    if (!message) {
      return new Response(JSON.stringify({ error: "Mensagem não encontrada" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Baixar áudio
    const audioBuffer = await downloadAudio(audio_url);

    // Transcrever
    const transcription = await transcribeWithWhisper(audioBuffer, language);

    // Atualizar mensagem com transcrição
    await supabase
      .from("messages")
      .update({
        transcription: transcription.text,
        transcription_language: transcription.language,
        is_transcribed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", message_id);

    // Registrar log
    await supabase.from("transcription_logs").insert({
      message_id,
      organization_id: message.organization_id,
      audio_url,
      transcription: transcription.text,
      language: transcription.language,
      status: "success",
      created_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        status: "success",
        transcription: transcription.text,
        language: transcription.language,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Erro ao transcrever áudio:", err);

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
