import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Schedule, ScheduleService, Appointment, AvailabilityRule, CapacityRule, BlockedDate, ScheduleAutomation, ScheduleAnalytics } from "@/types/schedules";

// ===== SCHEDULES =====
export const useSchedules = () =>
  useQuery({
    queryKey: ["schedules"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Schedule[];
    },
  });

export const useScheduleBySlug = (slug: string | null) =>
  useQuery({
    queryKey: ["schedule", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();
      if (error) throw error;
      return data as Schedule;
    },
    enabled: !!slug,
  });

export const useScheduleById = (id: string | null) =>
  useQuery({
    queryKey: ["schedule", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("schedules")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as Schedule;
    },
    enabled: !!id,
  });

export const useCreateSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (schedule: Omit<Schedule, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("schedules")
        .insert([schedule])
        .select()
        .single();
      if (error) throw error;
      return data as Schedule;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });
};

export const useUpdateSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Schedule> & { id: string }) => {
      const { data, error } = await supabase
        .from("schedules")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Schedule;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedules"] });
      qc.invalidateQueries({ queryKey: ["schedule"] });
    },
  });
};

export const useDeleteSchedule = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedules"] }),
  });
};

// ===== SCHEDULE SERVICES =====
export const useScheduleServices = (scheduleId: string | null) =>
  useQuery({
    queryKey: ["schedule-services", scheduleId],
    queryFn: async () => {
      let query = supabase.from("schedule_services").select("*");
      if (scheduleId) query = query.eq("schedule_id", scheduleId);
      const { data, error } = await query.order("sort_order");
      if (error) throw error;
      return data as ScheduleService[];
    },
    enabled: !!scheduleId,
  });

export const useCreateScheduleService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (service: Omit<ScheduleService, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("schedule_services")
        .insert([service])
        .select()
        .single();
      if (error) throw error;
      return data as ScheduleService;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["schedule-services", variables.schedule_id] });
    },
  });
};

export const useUpdateScheduleService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, schedule_id, ...updates }: Partial<ScheduleService> & { id: string; schedule_id: string }) => {
      const { data, error } = await supabase
        .from("schedule_services")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as ScheduleService;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["schedule-services", variables.schedule_id] });
    },
  });
};

export const useDeleteScheduleService = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, schedule_id }: { id: string; schedule_id: string }) => {
      const { error } = await supabase.from("schedule_services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["schedule-services", variables.schedule_id] });
    },
  });
};

// ===== APPOINTMENTS =====
export const useAppointments = (scheduleId: string | null) =>
  useQuery({
    queryKey: ["appointments", scheduleId],
    queryFn: async () => {
      let query = supabase.from("appointments").select("*");
      if (scheduleId) query = query.eq("schedule_id", scheduleId);
      const { data, error } = await query.order("appointment_date", { ascending: false });
      if (error) throw error;
      return data as Appointment[];
    },
    enabled: !!scheduleId,
  });

export const useCreateAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (appointment: Omit<Appointment, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("appointments")
        .insert([appointment])
        .select()
        .single();
      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["appointments", variables.schedule_id] });
    },
  });
};

export const useUpdateAppointment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, schedule_id, ...updates }: Partial<Appointment> & { id: string; schedule_id: string }) => {
      const { data, error } = await supabase
        .from("appointments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Appointment;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["appointments", variables.schedule_id] });
    },
  });
};

// ===== AVAILABILITY RULES =====
export const useAvailabilityRules = (scheduleId: string | null) =>
  useQuery({
    queryKey: ["availability-rules", scheduleId],
    queryFn: async () => {
      let query = supabase.from("availability_rules").select("*");
      if (scheduleId) query = query.eq("schedule_id", scheduleId);
      const { data, error } = await query.order("day_of_week");
      if (error) throw error;
      return data as AvailabilityRule[];
    },
    enabled: !!scheduleId,
  });

export const useUpdateAvailabilityRules = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ scheduleId, rules }: { scheduleId: string; rules: Omit<AvailabilityRule, "id" | "user_id" | "created_at" | "updated_at">[] }) => {
      // Delete existing rules
      await supabase.from("availability_rules").delete().eq("schedule_id", scheduleId);
      // Insert new rules
      const { data, error } = await supabase
        .from("availability_rules")
        .insert(rules)
        .select();
      if (error) throw error;
      return data as AvailabilityRule[];
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["availability-rules", variables.scheduleId] });
    },
  });
};

// ===== CAPACITY RULES =====
export const useCapacityRules = (scheduleId: string | null) =>
  useQuery({
    queryKey: ["capacity-rules", scheduleId],
    queryFn: async () => {
      if (!scheduleId) return null;
      const { data, error } = await supabase
        .from("capacity_rules")
        .select("*")
        .eq("schedule_id", scheduleId)
        .single();
      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
      return data as CapacityRule | null;
    },
    enabled: !!scheduleId,
  });

export const useUpdateCapacityRules = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ scheduleId, ...rules }: Partial<CapacityRule> & { scheduleId: string }) => {
      const { data, error } = await supabase
        .from("capacity_rules")
        .upsert({ ...rules, schedule_id: scheduleId })
        .select()
        .single();
      if (error) throw error;
      return data as CapacityRule;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["capacity-rules", variables.scheduleId] });
    },
  });
};

// ===== BLOCKED DATES =====
export const useBlockedDates = (scheduleId: string | null) =>
  useQuery({
    queryKey: ["blocked-dates", scheduleId],
    queryFn: async () => {
      let query = supabase.from("blocked_dates").select("*");
      if (scheduleId) query = query.eq("schedule_id", scheduleId);
      const { data, error } = await query.order("start_date");
      if (error) throw error;
      return data as BlockedDate[];
    },
    enabled: !!scheduleId,
  });

export const useCreateBlockedDate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (blockedDate: Omit<BlockedDate, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("blocked_dates")
        .insert([blockedDate])
        .select()
        .single();
      if (error) throw error;
      return data as BlockedDate;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["blocked-dates", variables.schedule_id] });
    },
  });
};

export const useDeleteBlockedDate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, schedule_id }: { id: string; schedule_id: string }) => {
      const { error } = await supabase.from("blocked_dates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["blocked-dates", variables.schedule_id] });
    },
  });
};

// ===== SCHEDULE AUTOMATIONS =====
export const useScheduleAutomations = (scheduleId: string | null) =>
  useQuery({
    queryKey: ["schedule-automations", scheduleId],
    queryFn: async () => {
      let query = supabase.from("schedule_automations").select("*");
      if (scheduleId) query = query.eq("schedule_id", scheduleId);
      const { data, error } = await query.order("created_at");
      if (error) throw error;
      return data as ScheduleAutomation[];
    },
    enabled: !!scheduleId,
  });

export const useCreateScheduleAutomation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (automation: Omit<ScheduleAutomation, "id" | "user_id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("schedule_automations")
        .insert([automation])
        .select()
        .single();
      if (error) throw error;
      return data as ScheduleAutomation;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["schedule-automations", variables.schedule_id] });
    },
  });
};

export const useUpdateScheduleAutomation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, schedule_id, ...updates }: Partial<ScheduleAutomation> & { id: string; schedule_id: string }) => {
      const { data, error } = await supabase
        .from("schedule_automations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as ScheduleAutomation;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["schedule-automations", variables.schedule_id] });
    },
  });
};

export const useDeleteScheduleAutomation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, schedule_id }: { id: string; schedule_id: string }) => {
      const { error } = await supabase.from("schedule_automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["schedule-automations", variables.schedule_id] });
    },
  });
};
