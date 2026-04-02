// Schedule Types
export interface Schedule {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  slug: string;
  timezone: string;
  default_duration_minutes: number;
  is_active: boolean;
  is_published: boolean;
  whatsapp_number?: string;
  whatsapp_message_template?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleService {
  id: string;
  user_id: string;
  schedule_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
  color: string;
  pipeline_id?: string;
  stage_id?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  schedule_id: string;
  service_id: string;
  lead_id?: string;
  client_name: string;
  client_email: string;
  client_phone: string;
  appointment_date: string;
  appointment_end: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'no_show' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface AvailabilityRule {
  id: string;
  user_id: string;
  schedule_id: string;
  day_of_week: number; // 0-6 (Sunday-Saturday)
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  is_available: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CapacityRule {
  id: string;
  user_id: string;
  schedule_id: string;
  max_appointments_per_day: number;
  max_appointments_per_slot: number;
  buffer_minutes_between: number;
  allow_overbooking: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlockedDate {
  id: string;
  user_id: string;
  schedule_id: string;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
  reason?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleAutomation {
  id: string;
  user_id: string;
  schedule_id: string;
  trigger_event: 'appointment_created' | 'appointment_cancelled' | 'appointment_confirmed' | 'appointment_no_show';
  action_type: 'create_lead' | 'update_stage' | 'create_task' | 'update_status';
  action_config: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScheduleEvent {
  id: string;
  user_id: string;
  schedule_id: string;
  appointment_id?: string;
  event_type: string;
  event_data?: Record<string, any>;
  created_at: string;
}

export interface AppointmentSlot {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  available: boolean;
  reason?: string;
}

export interface ScheduleAnalytics {
  total_appointments: number;
  confirmed_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  completed_appointments: number;
  attendance_rate: number;
  most_booked_service: ScheduleService | null;
  most_booked_time: string | null;
  total_revenue: number;
  leads_generated: number;
}
