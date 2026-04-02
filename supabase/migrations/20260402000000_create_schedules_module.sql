-- ===== MÓDULO DE AGENDA (SCHEDULES) =====
-- Estrutura completa para agendamento inteligente com CRM integration

-- 1. Tabela de Agendas (Schedules)
CREATE TABLE IF NOT EXISTS public.schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    slug TEXT NOT NULL UNIQUE,
    timezone TEXT DEFAULT 'America/Sao_Paulo',
    default_duration_minutes INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    is_published BOOLEAN DEFAULT FALSE,
    whatsapp_number TEXT,
    whatsapp_message_template TEXT DEFAULT 'Olá {nome}! Seu agendamento para {servico} está confirmado para {data} às {hora}.',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Serviços (Services)
CREATE TABLE IF NOT EXISTS public.schedule_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL,
    price DECIMAL(10, 2),
    color TEXT DEFAULT '#3B82F6',
    pipeline_id UUID,
    stage_id UUID,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Agendamentos (Appointments)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.schedule_services(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    appointment_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'no_show', 'completed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Regras de Disponibilidade (Availability Rules)
CREATE TABLE IF NOT EXISTS public.availability_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabela de Regras de Capacidade (Capacity Rules)
CREATE TABLE IF NOT EXISTS public.capacity_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
    max_appointments_per_day INTEGER DEFAULT 10,
    max_appointments_per_slot INTEGER DEFAULT 1,
    buffer_minutes_between INTEGER DEFAULT 0,
    allow_overbooking BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabela de Datas Bloqueadas (Blocked Dates)
CREATE TABLE IF NOT EXISTS public.blocked_dates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabela de Automações (Schedule Automations)
CREATE TABLE IF NOT EXISTS public.schedule_automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
    trigger_event TEXT NOT NULL CHECK (trigger_event IN ('appointment_created', 'appointment_cancelled', 'appointment_confirmed', 'appointment_no_show')),
    action_type TEXT NOT NULL CHECK (action_type IN ('create_lead', 'update_stage', 'create_task', 'update_status')),
    action_config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabela de Eventos do Sistema (Schedule Events)
CREATE TABLE IF NOT EXISTS public.schedule_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    schedule_id UUID NOT NULL REFERENCES public.schedules(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===== ÍNDICES =====
CREATE INDEX idx_schedules_user_id ON public.schedules(user_id);
CREATE INDEX idx_schedules_slug ON public.schedules(slug);
CREATE INDEX idx_schedule_services_schedule_id ON public.schedule_services(schedule_id);
CREATE INDEX idx_schedule_services_user_id ON public.schedule_services(user_id);
CREATE INDEX idx_appointments_schedule_id ON public.appointments(schedule_id);
CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_lead_id ON public.appointments(lead_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_availability_rules_schedule_id ON public.availability_rules(schedule_id);
CREATE INDEX idx_capacity_rules_schedule_id ON public.capacity_rules(schedule_id);
CREATE INDEX idx_blocked_dates_schedule_id ON public.blocked_dates(schedule_id);
CREATE INDEX idx_schedule_automations_schedule_id ON public.schedule_automations(schedule_id);
CREATE INDEX idx_schedule_events_schedule_id ON public.schedule_events(schedule_id);

-- ===== ROW LEVEL SECURITY (RLS) =====
ALTER TABLE public.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacity_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;

-- ===== POLICIES =====
-- Schedules
CREATE POLICY "Users can view their own schedules" ON public.schedules
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own schedules" ON public.schedules
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own schedules" ON public.schedules
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own schedules" ON public.schedules
    FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Public can view published schedules by slug" ON public.schedules
    FOR SELECT USING (is_published = TRUE);

-- Schedule Services
CREATE POLICY "Users can view their own schedule services" ON public.schedule_services
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own schedule services" ON public.schedule_services
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own schedule services" ON public.schedule_services
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own schedule services" ON public.schedule_services
    FOR DELETE USING (user_id = auth.uid());

-- Appointments
CREATE POLICY "Users can view their own appointments" ON public.appointments
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own appointments" ON public.appointments
    FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update their own appointments" ON public.appointments
    FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own appointments" ON public.appointments
    FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Public can create appointments on published schedules" ON public.appointments
    FOR INSERT WITH CHECK (TRUE);

-- Availability Rules
CREATE POLICY "Users can view their own availability rules" ON public.availability_rules
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own availability rules" ON public.availability_rules
    FOR ALL USING (user_id = auth.uid());

-- Capacity Rules
CREATE POLICY "Users can view their own capacity rules" ON public.capacity_rules
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own capacity rules" ON public.capacity_rules
    FOR ALL USING (user_id = auth.uid());

-- Blocked Dates
CREATE POLICY "Users can view their own blocked dates" ON public.blocked_dates
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own blocked dates" ON public.blocked_dates
    FOR ALL USING (user_id = auth.uid());

-- Schedule Automations
CREATE POLICY "Users can view their own automations" ON public.schedule_automations
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can manage their own automations" ON public.schedule_automations
    FOR ALL USING (user_id = auth.uid());

-- Schedule Events
CREATE POLICY "Users can view their own schedule events" ON public.schedule_events
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert their own schedule events" ON public.schedule_events
    FOR INSERT WITH CHECK (user_id = auth.uid());
