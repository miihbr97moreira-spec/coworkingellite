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

// Stages for a funnel (pass null for all stages)
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

// Leads for a funnel (pass null for all leads)
export const useLeads = (funnelId: string | null) =>
  useQuery({
    queryKey: ["leads", funnelId],
    queryFn: async () => {
      let query = supabase.from("leads").select("*").order("sort_order");
      if (funnelId) query = query.eq("funnel_id", funnelId);
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

// Track event (no auth needed)
export const trackEvent = async (eventType: string, metadata?: Record<string, any>) => {
  await supabase.from("lp_events").insert({ event_type: eventType, metadata: metadata ?? {} });
};