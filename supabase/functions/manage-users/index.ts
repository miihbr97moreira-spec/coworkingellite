import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Validate caller is super_admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Não autorizado");

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Não autorizado");

    // Check super_admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "super_admin")
      .maybeSingle();

    if (!roleData) throw new Error("Acesso negado: apenas Super Admin");

    const body = await req.json();
    const { action } = body;

    if (action === "list_users") {
      const { data: { users }, error } = await adminClient.auth.admin.listUsers();
      if (error) throw error;

      // Enrich with user_management data
      const { data: mgmtData } = await adminClient.from("user_management").select("*");
      const mgmtMap = new Map((mgmtData || []).map(m => [m.user_id, m]));

      const enrichedUsers = (users || []).map(u => ({
        id: u.id,
        email: u.email || "",
        full_name: mgmtMap.get(u.id)?.full_name || u.user_metadata?.full_name || "",
        role: mgmtMap.get(u.id)?.role || "editor",
        max_domains: mgmtMap.get(u.id)?.max_domains || 1,
        max_quizzes: mgmtMap.get(u.id)?.max_quizzes || 5,
        max_pages: mgmtMap.get(u.id)?.max_pages || 10,
        allowed_modules: mgmtMap.get(u.id)?.allowed_modules || [],
        is_active: mgmtMap.get(u.id)?.is_active ?? true,
        created_at: u.created_at,
      }));

      return new Response(JSON.stringify({ users: enrichedUsers }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "create_user") {
      const { email, password, full_name, role, max_domains, max_quizzes, max_pages, allowed_modules } = body;
      if (!email || !password || !full_name) throw new Error("Campos obrigatórios: email, password, full_name");

      // Create auth user
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name },
      });
      if (authError) throw authError;
      const userId = authData.user.id;

      // Insert into user_roles
      const appRole = role === "super_admin" ? "super_admin" : "editor";
      await adminClient.from("user_roles").insert({ user_id: userId, role: appRole });

      // Insert into user_management
      await adminClient.from("user_management").insert({
        user_id: userId,
        email,
        full_name,
        role: appRole,
        max_domains: max_domains || 1,
        max_quizzes: max_quizzes || 5,
        max_pages: max_pages || 10,
        allowed_modules: allowed_modules || ["builder", "quiz_builder", "pixels", "crm"],
        is_active: true,
      });

      return new Response(JSON.stringify({ success: true, user_id: userId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete_user") {
      const { user_id } = body;
      if (!user_id) throw new Error("user_id obrigatório");

      // Prevent deleting self
      if (user_id === caller.id) throw new Error("Não é possível deletar a si mesmo");

      await adminClient.from("user_management").delete().eq("user_id", user_id);
      await adminClient.from("user_roles").delete().eq("user_id", user_id);
      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_metrics") {
      const [
        { count: totalUsers },
        { count: totalDomains },
        { count: totalPages },
        { count: totalQuizzes },
      ] = await Promise.all([
        adminClient.from("user_management").select("*", { count: "exact", head: true }),
        adminClient.from("custom_domains").select("*", { count: "exact", head: true }),
        adminClient.from("generated_pages").select("*", { count: "exact", head: true }),
        adminClient.from("quizzes").select("*", { count: "exact", head: true }),
      ]);

      return new Response(JSON.stringify({
        total_users: totalUsers || 0,
        total_domains: totalDomains || 0,
        total_pages: totalPages || 0,
        total_quizzes: totalQuizzes || 0,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Ação desconhecida: ${action}`);
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
