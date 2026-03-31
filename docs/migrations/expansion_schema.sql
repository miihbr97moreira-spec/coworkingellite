-- Expansão do Banco de Dados para Omni Builder CRM (Sistema Operacional de Vendas)

-- 1. Extensão da tabela leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS probability INTEGER DEFAULT 50;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_revenue DECIMAL(12,2);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'; -- active, won, lost, archived
ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'medium'; -- low, medium, high, urgent

-- 2. Tabela de Negócios (Deals) - Um lead pode ter vários negócios
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    value DECIMAL(12,2) DEFAULT 0,
    probability INTEGER DEFAULT 50,
    stage_id UUID REFERENCES stages(id),
    status TEXT DEFAULT 'open', -- open, won, lost, abandoned
    expected_closing_date DATE,
    actual_closing_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- 3. Tabela de Tarefas (Tasks)
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending', -- pending, completed, cancelled
    priority TEXT DEFAULT 'medium',
    task_type TEXT DEFAULT 'follow_up', -- call, email, meeting, follow_up, task
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Atividades (Activities) - Timeline completa
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- call, message, email, stage_change, note, task_completed
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    performed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Tabela de Metas (Goals)
CREATE TABLE IF NOT EXISTS goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    team_id UUID, -- Placeholder para times
    goal_type TEXT NOT NULL, -- sales_value, contacts_count, conversion_rate
    target_value DECIMAL(12,2) NOT NULL,
    current_value DECIMAL(12,2) DEFAULT 0,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    period TEXT DEFAULT 'monthly', -- daily, weekly, monthly, quarterly
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Tabela de Notificações (Notifications)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- info, warning, success, error, alert
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Campos Personalizados (Custom Fields)
CREATE TABLE IF NOT EXISTS custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL, -- lead, deal
    name TEXT NOT NULL,
    label TEXT NOT NULL,
    field_type TEXT NOT NULL, -- text, number, date, select, boolean
    options JSONB, -- Para campos do tipo select
    is_required BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Valores dos Campos Personalizados (Custom Field Values)
CREATE TABLE IF NOT EXISTS custom_field_values (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    field_id UUID NOT NULL REFERENCES custom_fields(id) ON DELETE CASCADE,
    entity_id UUID NOT NULL, -- lead_id ou deal_id
    value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(field_id, entity_id)
);

-- 9. Times (Teams)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de membros do time
CREATE TABLE IF NOT EXISTS team_members (
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- leader, member
    PRIMARY KEY (team_id, user_id)
);

-- 10. Anexos (Attachments)
CREATE TABLE IF NOT EXISTS attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Playbooks e Checklists
CREATE TABLE IF NOT EXISTS playbooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    target_stage_id UUID REFERENCES stages(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS playbook_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    playbook_id UUID REFERENCES playbooks(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    item_type TEXT DEFAULT 'checklist', -- checklist, script, recommendation
    sort_order INTEGER DEFAULT 0
);

-- Checklists de execução por lead/deal
CREATE TABLE IF NOT EXISTS activity_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL, -- lead_id ou deal_id
    playbook_item_id UUID REFERENCES playbook_items(id) ON DELETE CASCADE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_deals_lead_id ON deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
