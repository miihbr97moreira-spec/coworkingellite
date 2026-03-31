import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Landing page config
export const useLPConfig = () =>
  useQuery({
    queryKey: ["lp-config"],
    queryFn: async () => {
      const { data, error } = await supabase.from("landing_page_config").select("*");
      if (error) throw error;
      const map: Record<string, any> = {};
      data?.forEach((r) => (map[r.key] = r.value));
      return map;
    },
    staleTime: 30000,
  });

export const useUpdateLPConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from("landing_page_config")
        .update({ value })
        .eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lp-config"] }),
  });
};

// Reviews
export const useReviews = () =>
  useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

// Funnels
export const useFunnels = () =>
  useQuery({
    queryKey: ["funnels"],
    queryFn: async () => {
      const { data, error } = await supabase.from("funnels").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

// Stages for a funnel (null = load ALL stages)
export const useStages = (funnelId: string | null) =>
  useQuery({
    queryKey: ["stages", funnelId],
    queryFn: async () => {
      let query = supabase.from("stages").select("*").order("sort_order");
      if (funnelId) query = query.eq("funnel_id", funnelId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

// Leads for a funnel (null = load ALL leads)
export const useLeads = (funnelId: string | null) =>
  useQuery({
    queryKey: ["leads", funnelId],
    queryFn: async () => {
      let query = supabase.from("leads").select("*, assigned_to(id, email), stage_id(id, name), probability, expected_revenue, last_activity_at, status, priority").order("sort_order");
      if (funnelId) query = query.eq("funnel_id", funnelId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

export const useDeals = (leadId: string | null) =>
  useQuery({
    queryKey: ["deals", leadId],
    queryFn: async () => {
      let query = supabase.from("deals").select("*, stage_id(id, name)").order("created_at");
      if (leadId) query = query.eq("lead_id", leadId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

export const useTasks = (leadId: string | null) =>
  useQuery({
    queryKey: ["tasks", leadId],
    queryFn: async () => {
      let query = supabase.from("tasks").select("*, assigned_to(id, email)").order("due_date");
      if (leadId) query = query.eq("lead_id", leadId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

export const useActivities = (leadId: string | null) =>
  useQuery({
    queryKey: ["activities", leadId],
    queryFn: async () => {
      let query = supabase.from("activities").select("*, performed_by(id, email)").order("created_at", { ascending: false });
      if (leadId) query = query.eq("lead_id", leadId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

export const useGoals = (userId: string | null) =>
  useQuery({
    queryKey: ["goals", userId],
    queryFn: async () => {
      let query = supabase.from("goals").select("*").order("end_date");
      if (userId) query = query.eq("user_id", userId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

export const useNotifications = (userId: string | null) =>
  useQuery({
    queryKey: ["notifications", userId],
    queryFn: async () => {
      let query = supabase.from("notifications").select("*").order("created_at", { ascending: false });
      if (userId) query = query.eq("user_id", userId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

export const useCustomFields = (entityType: string | null) =>
  useQuery({
    queryKey: ["custom_fields", entityType],
    queryFn: async () => {
      let query = supabase.from("custom_fields").select("*").order("created_at");
      if (entityType) query = query.eq("entity_type", entityType);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

export const useCustomFieldValues = (entityId: string | null) =>
  useQuery({
    queryKey: ["custom_field_values", entityId],
    queryFn: async () => {
      let query = supabase.from("custom_field_values").select("*, field_id(*)");
      if (entityId) query = query.eq("entity_id", entityId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

export const useTeams = () =>
  useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase.from("teams").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

export const useTeamMembers = (teamId: string | null) =>
  useQuery({
    queryKey: ["team_members", teamId],
    queryFn: async () => {
      let query = supabase.from("team_members").select("*, user_id(id, email)");
      if (teamId) query = query.eq("team_id", teamId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

export const useAttachments = (entityId: string | null) =>
  useQuery({
    queryKey: ["attachments", entityId],
    queryFn: async () => {
      let query = supabase.from("attachments").select("*, uploaded_by(id, email)").order("created_at", { ascending: false });
      if (entityId) query = query.eq("lead_id", entityId).or("deal_id", entityId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

export const usePlaybooks = (stageId: string | null) =>
  useQuery({
    queryKey: ["playbooks", stageId],
    queryFn: async () => {
      let query = supabase.from("playbooks").select("*").order("name");
      if (stageId) query = query.eq("target_stage_id", stageId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

export const usePlaybookItems = (playbookId: string | null) =>
  useQuery({
    queryKey: ["playbook_items", playbookId],
    queryFn: async () => {
      let query = supabase.from("playbook_items").select("*").order("sort_order");
      if (playbookId) query = query.eq("playbook_id", playbookId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

export const useActivityChecklists = (entityId: string | null) =>
  useQuery({
    queryKey: ["activity_checklists", entityId],
    queryFn: async () => {
      let query = supabase.from("activity_checklists").select("*, playbook_item_id(*), completed_by(id, email)");
      if (entityId) query = query.eq("entity_id", entityId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

// Lead notes
export const useLeadNotes = (leadId: string | null) =>
  useQuery({
    queryKey: ["lead-notes", leadId],
    queryFn: async () => {
      if (!leadId) return [];
      const { data, error } = await supabase
        .from("lead_notes")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!leadId,
  });

// LP Events for analytics
export const useLPEvents = () =>
  useQuery({
    queryKey: ["lp-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lp_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data;
    },
  });

// Quizzes
export const useQuizzes = () =>
  useQuery({
    queryKey: ["quizzes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

// Quiz submissions
export const useQuizSubmissions = (quizId: string | null) =>
  useQuery({
    queryKey: ["quiz-submissions", quizId],
    queryFn: async () => {
      let query = supabase.from("quiz_submissions").select("*").order("created_at", { ascending: false });
      if (quizId) query = query.eq("quiz_id", quizId);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

// Track event (no auth needed)
export const trackEvent = async (eventType: string, metadata?: Record<string, any>) => {
  await supabase.from("lp_events").insert({ event_type: eventType, metadata: metadata ?? {} });
};
