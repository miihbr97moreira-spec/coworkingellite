import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Responder a preflight CORS
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    
    // Cliente Admin para operações que o usuário comum não pode fazer
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Buscar itens pendentes na fila 'user_creation_queue'
    const { data: queueItems, error: queueError } = await supabaseAdmin
      .from('user_creation_queue')
      .select('*')
      .eq('status', 'pending')
      .limit(10);

    if (queueError) {
      console.error("Erro ao ler fila:", queueError);
      return new Response(JSON.stringify({ error: "Tabela de fila não encontrada. Execute o SQL de migration." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    for (const item of (queueItems || [])) {
      try {
        // Marcar como processando
        await supabaseAdmin.from('user_creation_queue').update({ status: 'processing' }).eq('id', item.id);

        // Criar usuário no Auth do Supabase
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: item.email,
          password: item.password,
          email_confirm: true,
          user_metadata: { full_name: item.full_name }
        });

        if (authError) throw authError;

        // Atribuir Role na tabela user_roles
        const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
          user_id: authUser.user.id,
          role: item.role
        });

        if (roleError) throw roleError;

        // Marcar como concluído
        await supabaseAdmin.from('user_creation_queue').update({ 
          status: 'completed', 
          processed_at: new Date().toISOString() 
        }).eq('id', item.id);

        results.push({ email: item.email, status: 'success' });
      } catch (e: any) {
        console.error(`Erro no item ${item.id}:`, e);
        await supabaseAdmin.from('user_creation_queue').update({ 
          status: 'error', 
          error_message: e.message 
        }).eq('id', item.id);
        results.push({ email: item.email, status: 'error', message: e.message });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Erro crítico na função:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
