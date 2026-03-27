import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Resposta rápida para preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Criar cliente com service_role para operações administrativas
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Criar cliente com a chave anon para verificar o usuário que fez a requisição
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: req.headers.get("Authorization") ?? "" },
      },
    });

    // Verificar autenticação do solicitante
    const { data: { user: callerUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Não autenticado ou sessão inválida" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se o solicitante é super_admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Acesso negado. Apenas super_admin pode gerenciar usuários." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action } = body;

    // ===== LISTAR USUÁRIOS =====
    if (action === "list") {
      const { data: managedUsers, error: listError } = await supabaseAdmin
        .from("user_management")
        .select("*")
        .order("created_at", { ascending: false });

      if (listError) throw listError;

      // Buscar emails dos usuários no auth.users via Admin API
      const { data: authUsers, error: authListError } = await supabaseAdmin.auth.admin.listUsers();
      if (authListError) throw authListError;

      const emailMap = Object.fromEntries(
        authUsers.users.map((u) => [u.id, u.email])
      );

      // Buscar roles
      const { data: rolesData } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role");

      const rolesMap = Object.fromEntries(
        (rolesData ?? []).map((r) => [r.user_id, r.role])
      );

      const result = (managedUsers ?? []).map((u) => ({
        id: u.id,
        user_id: u.user_id,
        email: emailMap[u.user_id] ?? "N/A",
        full_name: u.full_name,
        is_active: u.is_active,
        role: rolesMap[u.user_id] ?? "editor",
        created_at: u.created_at,
      }));

      return new Response(
        JSON.stringify({ users: result }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== CRIAR USUÁRIO =====
    if (action === "create") {
      const { email, password, full_name, role = "editor" } = body;

      if (!email || !password || !full_name) {
        return new Response(
          JSON.stringify({ error: "E-mail, senha e nome completo são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Criar usuário no Supabase Auth
      const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });

      if (createError) throw createError;

      const newUserId = newAuthUser.user.id;

      // Inserir na tabela user_management
      const { error: mgmtError } = await supabaseAdmin
        .from("user_management")
        .insert({ user_id: newUserId, full_name, is_active: true });

      if (mgmtError) {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        throw mgmtError;
      }

      // Inserir role na tabela user_roles
      const { error: roleInsertError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUserId, role });

      if (roleInsertError) {
        await supabaseAdmin.from("user_management").delete().eq("user_id", newUserId);
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        throw roleInsertError;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== ATUALIZAR USUÁRIO =====
    if (action === "update") {
      const { user_id, email, full_name, password, role, is_active } = body;

      if (!user_id) throw new Error("user_id é obrigatório");

      // Atualizar Auth
      const authUpdates: any = {};
      if (email) authUpdates.email = email;
      if (password) authUpdates.password = password;
      if (full_name) authUpdates.user_metadata = { full_name };

      if (Object.keys(authUpdates).length > 0) {
        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(user_id, authUpdates);
        if (updateAuthError) throw updateAuthError;
      }

      // Atualizar user_management
      const mgmtUpdates: any = {};
      if (full_name !== undefined) mgmtUpdates.full_name = full_name;
      if (is_active !== undefined) mgmtUpdates.is_active = is_active;

      if (Object.keys(mgmtUpdates).length > 0) {
        const { error: mgmtUpdateError } = await supabaseAdmin
          .from("user_management")
          .update(mgmtUpdates)
          .eq("user_id", user_id);
        if (mgmtUpdateError) throw mgmtUpdateError;
      }

      // Atualizar role
      if (role) {
        await supabaseAdmin.from("user_roles").delete().eq("user_id", user_id);
        const { error: roleUpdateError } = await supabaseAdmin
          .from("user_roles")
          .insert({ user_id, role });
        if (roleUpdateError) throw roleUpdateError;
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== DELETAR USUÁRIO =====
    if (action === "delete") {
      const { user_id } = body;
      if (!user_id) throw new Error("user_id é obrigatório");
      if (user_id === callerUser.id) throw new Error("Não é possível deletar a própria conta");

      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
      if (deleteError) throw deleteError;

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== TOGGLE STATUS =====
    if (action === "toggle_status") {
      const { user_id, is_active } = body;
      if (!user_id) throw new Error("user_id é obrigatório");

      const { error: toggleError } = await supabaseAdmin
        .from("user_management")
        .update({ is_active })
        .eq("user_id", user_id);

      if (toggleError) throw toggleError;

      // Banir no Auth se inativo
      await supabaseAdmin.auth.admin.updateUserById(user_id, {
        ban_duration: is_active ? "none" : "876600h",
      });

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("Erro na função manage-users:", e);
    return new Response(
      JSON.stringify({ error: e.message || "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
