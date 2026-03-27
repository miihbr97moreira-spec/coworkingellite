import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface UploadRequest {
  organization_id: string;
  message_id?: string;
  file_name: string;
  file_data: string; // base64
  media_type: string;
}

// Validar tipo de mídia
function validateMediaType(mediaType: string): boolean {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "video/mp4",
    "video/webm",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  return allowed.includes(mediaType);
}

// Validar tamanho de arquivo
function validateFileSize(base64Data: string, maxSizeMB: number = 50): boolean {
  const sizeInBytes = (base64Data.length * 3) / 4;
  const sizeInMB = sizeInBytes / (1024 * 1024);
  return sizeInMB <= maxSizeMB;
}

// Gerar nome único para arquivo
function generateUniqueFileName(
  organizationId: string,
  fileName: string,
  mediaType: string
): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  const extension = mediaType.split("/")[1] || "bin";
  return `${organizationId}/${timestamp}-${random}-${fileName.replace(/[^a-zA-Z0-9.-]/g, "_")}.${extension}`;
}

// Handler principal
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      organization_id,
      message_id,
      file_name,
      file_data,
      media_type,
    }: UploadRequest = await req.json();

    if (!organization_id || !file_name || !file_data || !media_type) {
      return new Response(
        JSON.stringify({ error: "Parâmetros obrigatórios faltando" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar tipo de mídia
    if (!validateMediaType(media_type)) {
      return new Response(
        JSON.stringify({ error: `Tipo de mídia não suportado: ${media_type}` }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validar tamanho
    if (!validateFileSize(file_data)) {
      return new Response(
        JSON.stringify({ error: "Arquivo excede o tamanho máximo de 50MB" }),
        {
          status: 413,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Gerar nome único
    const uniqueFileName = generateUniqueFileName(organization_id, file_name, media_type);

    // Converter base64 para buffer
    const binaryString = atob(file_data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("omni-flow-media")
      .upload(uniqueFileName, bytes, {
        contentType: media_type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
    }

    // Obter URL pública
    const { data: publicUrl } = supabase.storage
      .from("omni-flow-media")
      .getPublicUrl(uniqueFileName);

    // Salvar referência no banco
    const { data: mediaRecord, error: dbError } = await supabase
      .from("media_files")
      .insert({
        organization_id,
        message_id,
        file_name,
        file_path: uniqueFileName,
        media_type,
        file_size: (file_data.length * 3) / 4,
        public_url: publicUrl.publicUrl,
        storage_bucket: "omni-flow-media",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dbError) {
      // Tentar deletar arquivo se falhar ao salvar no banco
      await supabase.storage.from("omni-flow-media").remove([uniqueFileName]);
      throw new Error(`Erro ao salvar referência: ${dbError.message}`);
    }

    // Se for mensagem, atualizar media_url
    if (message_id) {
      await supabase
        .from("messages")
        .update({
          media_url: publicUrl.publicUrl,
          media_type,
          updated_at: new Date().toISOString(),
        })
        .eq("id", message_id);
    }

    return new Response(
      JSON.stringify({
        status: "success",
        file_id: mediaRecord.id,
        file_name: mediaRecord.file_name,
        public_url: mediaRecord.public_url,
        media_type: mediaRecord.media_type,
        file_size: mediaRecord.file_size,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Erro ao fazer upload de mídia:", err);

    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
