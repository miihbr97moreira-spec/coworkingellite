import { Schedule, ScheduleService, Appointment, AvailabilityRule, CapacityRule, BlockedDate, AppointmentSlot } from "@/types/schedules";
import { addMinutes, format, parse, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval, eachHourOfInterval, startOfHour, isBefore, isAfter, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

/**
 * Generate available time slots for a given date
 */
export const generateAvailableSlots = (
  date: Date,
  schedule: Schedule,
  service: ScheduleService,
  availabilityRules: AvailabilityRule[],
  capacityRules: CapacityRule | null,
  blockedDates: BlockedDate[],
  existingAppointments: Appointment[]
): AppointmentSlot[] => {
  const slots: AppointmentSlot[] = [];
  const dayOfWeek = date.getDay();

  // Check if date is blocked
  const isDateBlocked = blockedDates.some((bd) => {
    const start = new Date(bd.start_date);
    const end = new Date(bd.end_date);
    return isWithinInterval(date, { start, end });
  });

  if (isDateBlocked) {
    return [{ date: format(date, "yyyy-MM-dd"), time: "00:00", available: false, reason: "Data bloqueada" }];
  }

  // Get availability rules for this day
  const dayRules = availabilityRules.filter((r) => r.day_of_week === dayOfWeek && r.is_available);

  if (dayRules.length === 0) {
    return [{ date: format(date, "yyyy-MM-dd"), time: "00:00", available: false, reason: "Dia não disponível" }];
  }

  // Generate slots for each availability rule
  dayRules.forEach((rule) => {
    const startTime = parse(rule.start_time, "HH:mm", date);
    const endTime = parse(rule.end_time, "HH:mm", date);
    const buffer = capacityRules?.buffer_minutes_between || 0;

    let currentTime = startTime;
    while (isBefore(currentTime, endTime)) {
      const slotEnd = addMinutes(currentTime, service.duration_minutes);

      // Check if slot fits within availability window
      if (!isAfter(slotEnd, endTime)) {
        const slotDateStr = format(date, "yyyy-MM-dd");
        const slotTimeStr = format(currentTime, "HH:mm");

        // Check capacity
        const appointmentsInSlot = existingAppointments.filter((apt) => {
          const aptStart = new Date(apt.appointment_date);
          const aptEnd = new Date(apt.appointment_end);
          return (
            isSameDay(aptStart, date) &&
            isWithinInterval(currentTime, { start: aptStart, end: aptEnd }) &&
            apt.status !== "cancelled"
          );
        });

        const maxPerSlot = capacityRules?.max_appointments_per_slot || 1;
        const isAvailable = appointmentsInSlot.length < maxPerSlot;

        slots.push({
          date: slotDateStr,
          time: slotTimeStr,
          available: isAvailable,
          reason: isAvailable ? undefined : "Horário indisponível",
        });
      }

      currentTime = addMinutes(currentTime, service.duration_minutes + buffer);
    }
  });

  return slots;
};

/**
 * Get available dates for next N days
 */
export const getAvailableDates = (
  schedule: Schedule,
  service: ScheduleService,
  availabilityRules: AvailabilityRule[],
  capacityRules: CapacityRule | null,
  blockedDates: BlockedDate[],
  existingAppointments: Appointment[],
  daysAhead: number = 30
): Date[] => {
  const dates: Date[] = [];
  const today = startOfDay(new Date());

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);

    const slots = generateAvailableSlots(date, schedule, service, availabilityRules, capacityRules, blockedDates, existingAppointments);
    if (slots.some((s) => s.available)) {
      dates.push(date);
    }
  }

  return dates;
};

/**
 * Check if a specific time slot is available
 */
export const isSlotAvailable = (
  appointmentDate: Date,
  service: ScheduleService,
  availabilityRules: AvailabilityRule[],
  capacityRules: CapacityRule | null,
  blockedDates: BlockedDate[],
  existingAppointments: Appointment[]
): boolean => {
  const slots = generateAvailableSlots(appointmentDate, {} as Schedule, service, availabilityRules, capacityRules, blockedDates, existingAppointments);
  return slots.some((s) => s.available);
};

/**
 * Generate slug from schedule name
 */
export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Format appointment date and time for display
 */
export const formatAppointmentDateTime = (date: string, time?: string): string => {
  try {
    const appointmentDate = new Date(date);
    if (time) {
      const [hours, minutes] = time.split(":");
      appointmentDate.setHours(parseInt(hours), parseInt(minutes));
    }
    return format(appointmentDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return date;
  }
};

/**
 * Get appointment status label
 */
export const getAppointmentStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    scheduled: "Agendado",
    confirmed: "Confirmado",
    cancelled: "Cancelado",
    no_show: "Não compareceu",
    completed: "Concluído",
  };
  return labels[status] || status;
};

/**
 * Get appointment status color
 */
export const getAppointmentStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    confirmed: "bg-green-500/10 text-green-500 border-green-500/20",
    cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
    no_show: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    completed: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };
  return colors[status] || "bg-gray-500/10 text-gray-500 border-gray-500/20";
};

/**
 * Calculate analytics for a schedule
 */
export const calculateScheduleAnalytics = (appointments: Appointment[], services: ScheduleService[]) => {
  const total = appointments.length;
  const confirmed = appointments.filter((a) => a.status === "confirmed").length;
  const cancelled = appointments.filter((a) => a.status === "cancelled").length;
  const noShow = appointments.filter((a) => a.status === "no_show").length;
  const completed = appointments.filter((a) => a.status === "completed").length;

  const attendanceRate = total > 0 ? ((completed + confirmed) / total) * 100 : 0;

  // Most booked service
  const serviceCounts = services.map((s) => ({
    service: s,
    count: appointments.filter((a) => a.service_id === s.id).length,
  }));
  const mostBookedService = serviceCounts.sort((a, b) => b.count - a.count)[0]?.service || null;

  // Most booked time
  const timeCounts: Record<string, number> = {};
  appointments.forEach((a) => {
    const time = format(new Date(a.appointment_date), "HH:00");
    timeCounts[time] = (timeCounts[time] || 0) + 1;
  });
  const mostBookedTime = Object.entries(timeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

  return {
    total_appointments: total,
    confirmed_appointments: confirmed,
    cancelled_appointments: cancelled,
    no_show_appointments: noShow,
    completed_appointments: completed,
    attendance_rate: Math.round(attendanceRate),
    most_booked_service: mostBookedService,
    most_booked_time: mostBookedTime,
    total_revenue: 0, // Will be calculated from services with prices
    leads_generated: 0, // Will be calculated from appointments with lead_id
  };
};

/**
 * Generate WhatsApp message with variables
 */
export const generateWhatsAppMessage = (
  template: string,
  clientName: string,
  serviceName: string,
  appointmentDate: string,
  appointmentTime: string
): string => {
  return template
    .replace("{nome}", clientName)
    .replace("{servico}", serviceName)
    .replace("{data}", format(new Date(appointmentDate), "dd/MM/yyyy", { locale: ptBR }))
    .replace("{hora}", appointmentTime);
};

/**
 * Generate WhatsApp link
 */
export const generateWhatsAppLink = (
  phoneNumber: string,
  clientName: string,
  serviceName: string,
  appointmentDate: string,
  appointmentTime: string,
  template: string
): string => {
  const message = generateWhatsAppMessage(template, clientName, serviceName, appointmentDate, appointmentTime);
  const encodedMessage = encodeURIComponent(message);
  const cleanPhone = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
};
