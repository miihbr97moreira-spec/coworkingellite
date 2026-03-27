import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Criar cliente com service_role para operações administrativas
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Criar cliente com a chave anon para verificar o usuário que fez a requisição
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        auth: { autoRefreshToken: false, persistSession: false },
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      }
    );

    // Verificar autenticação do solicitante
    const { data: { user: callerUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar se o solicitante é super_admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerUser.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) {
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
        .select("id, user_id, full_name, is_active, created_at")
        .order("created_at", { ascending: false });

      if (listError) throw listError;

      // Buscar emails dos usuários no auth.users
      const userIds = (managedUsers ?? []).map((u: { user_id: string }) => u.user_id).filter(Boolean);
      const emailMap: Record<string, string> = {};

      if (userIds.length > 0) {
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
        if (authUsers?.users) {
          for (const au of authUsers.users) {
            emailMap[au.id] = au.email ?? "";
          }
        }
      }

      // Buscar roles
      const { data: rolesData } = await supabaseAdmin
        .from("user_roles")
        .select("user_id, role");

      const rolesMap: Record<string, string> = {};
      if (rolesData) {
        for (const r of rolesData) {
          rolesMap[r.user_id] = r.role;
        }
      }

      const result = (managedUsers ?? []).map((u: {
        id: string;
        user_id: string;
        full_name: string;
        is_active: boolean;
        created_at: string;
      }) => ({
        id: u.id,
        user_id: u.user_id,
        email: emailMap[u.user_id] ?? "",
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
          JSON.stringify({ error: "email, password e full_name são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Criar usuário no Supabase Auth
      const { data: newAuthUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: { full_name },
      });

      if (createError) {
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const newUserId = newAuthUser.user.id;

      // Inserir na tabela user_management
      const { error: mgmtError } = await supabaseAdmin
        .from("user_management")
        .insert({ user_id: newUserId, full_name, is_active: true });

      if (mgmtError) {
        // Rollback: deletar usuário criado
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        throw mgmtError;
      }

      // Inserir role na tabela user_roles
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUserId, role });

      if (roleError) {
        // Rollback
        await supabaseAdmin.from("user_management").delete().eq("user_id", newUserId);
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
        throw roleError;
      }

      return new Response(
        JSON.stringify({
          success: true,
          user: {
            user_id: newUserId,
            email,
            full_name,
            role,
            is_active: true,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== ATUALIZAR USUÁRIO =====
    if (action === "update") {
      const { user_id, email, full_name, password, role, is_active } = body;

      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Atualizar dados no Supabase Auth
      const authUpdates: Record<string, unknown> = {};
      if (email) authUpdates.email = email;
      if (password) authUpdates.password = password;
      if (full_name) authUpdates.user_metadata = { full_name };

      if (Object.keys(authUpdates).length > 0) {
        const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
          user_id,
          authUpdates
        );
        if (updateAuthError) throw updateAuthError;
      }

      // Atualizar user_management
      const mgmtUpdates: Record<string, unknown> = {};
      if (full_name !== undefined) mgmtUpdates.full_name = full_name;
      if (is_active !== undefined) mgmtUpdates.is_active = is_active;

      if (Object.keys(mgmtUpdates).length > 0) {
        const { error: mgmtUpdateError } = await supabaseAdmin
          .from("user_management")
          .update(mgmtUpdates)
          .eq("user_id", user_id);
        if (mgmtUpdateError) throw mgmtUpdateError;
      }

      // Atualizar role se fornecida
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

      if (!user_id) {
        return new Response(
          JSON.stringify({ error: "user_id é obrigatório" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Não permitir deletar a si mesmo
      if (user_id === callerUser.id) {
        return new Response(
          JSON.stringify({ error: "Você não pode deletar sua própria conta" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Deletar do auth (cascata remove user_roles e user_management por FK)
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

      if (!user_id || is_active === undefined) {
        return new Response(
          JSON.stringify({ error: "user_id e is_active são obrigatórios" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: toggleError } = await supabaseAdmin
        .from("user_management")
        .update({ is_active })
        .eq("user_id", user_id);

      if (toggleError) throw toggleError;

      // Se desativar, banir o usuário no Supabase Auth
      if (!is_active) {
        await supabaseAdmin.auth.admin.updateUserById(user_id, {
          ban_duration: "876600h", // ~100 anos
        });
      } else {
        await supabaseAdmin.auth.admin.updateUserById(user_id, {
          ban_duration: "none",
        });
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("manage-users error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
