-- ========================================
-- OMNI FLOW: Critical Refactor for Production
-- Correção de Persistência, Expansão CRM e Z-API
-- ========================================

-- 1. Atualizar tabela automation_flows para suportar JSON completo (Triggers + Actions)
ALTER TABLE automation_flows
  ADD COLUMN IF NOT EXISTS flow_config JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS trigger_config JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS action_config JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS cadence_messages JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS crm_action_type TEXT CHECK (crm_action_type IN ('move_to_stage', 'mark_won', 'mark_lost', 'add_tag', 'none')),
  ADD COLUMN IF NOT EXISTS crm_stage_id TEXT,
  ADD COLUMN IF NOT EXISTS last_executed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS execution_error_count INTEGER DEFAULT 0;

-- 2. Remover constraint de UNIQUE em trigger_id e action_id para permitir múltiplas automações
ALTER TABLE automation_flows
  DROP CONSTRAINT IF EXISTS automation_flows_trigger_id_action_id_key;

-- 3. Atualizar tabela flow_triggers para suportar novos tipos de CRM
ALTER TABLE flow_triggers
  DROP CONSTRAINT IF EXISTS flow_triggers_trigger_type_check,
  ADD CONSTRAINT flow_triggers_trigger_type_check 
    CHECK (trigger_type IN (
      'new_lead', 
      'checkout_abandoned', 
      'form_submission', 
      'custom_webhook',
      'lead_moved_to_stage',
      'lead_created_in_funnel',
      'lead_tagged',
      'scheduled_time'
    ));

-- 4. Atualizar tabela flow_actions para suportar novas ações de CRM
ALTER TABLE flow_actions
  DROP CONSTRAINT IF EXISTS flow_actions_action_type_check,
  ADD CONSTRAINT flow_actions_action_type_check 
    CHECK (action_type IN (
      'send_whatsapp', 
      'send_email', 
      'call_webhook', 
      'trigger_ai',
      'move_to_stage',
      'mark_won',
      'mark_lost',
      'add_tag',
      'send_cadence'
    ));

-- 5. Melhorar tabela zapi_instances com campos de autenticação real
ALTER TABLE zapi_instances
  ADD COLUMN IF NOT EXISTS instance_token TEXT,
  ADD COLUMN IF NOT EXISTS api_url TEXT DEFAULT 'https://api.z-api.io',
  ADD COLUMN IF NOT EXISTS webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS last_status_check TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS is_authenticated BOOLEAN DEFAULT FALSE;

-- 6. Criar tabela para armazenar Cadências de Mensagens (Sequências)
CREATE TABLE IF NOT EXISTS message_cadences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cadence_name TEXT NOT NULL,
  cadence_description TEXT,
  messages JSONB NOT NULL DEFAULT '[]', -- Array de {delay_minutes, message_text, template_variables}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, cadence_name)
);

-- 7. Criar tabela para Estágios de CRM (Funis)
CREATE TABLE IF NOT EXISTS crm_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage_name TEXT NOT NULL,
  stage_order INTEGER NOT NULL,
  funnel_id TEXT,
  color_hex TEXT DEFAULT '#D97757',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, stage_name)
);

-- 8. Criar tabela para Leads do CRM (Integração)
CREATE TABLE IF NOT EXISTS crm_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_name TEXT NOT NULL,
  lead_email TEXT,
  lead_phone TEXT,
  lead_source TEXT,
  current_stage_id UUID REFERENCES crm_stages(id) ON DELETE SET NULL,
  tags JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX crm_leads_tenant_id_idx (tenant_id),
  INDEX crm_leads_email_idx (lead_email)
);

-- 9. Criar tabela para Histórico de Execução de Automações
CREATE TABLE IF NOT EXISTS automation_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_flow_id UUID NOT NULL REFERENCES automation_flows(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_data JSONB NOT NULL,
  action_data JSONB,
  execution_status TEXT DEFAULT 'pending' CHECK (execution_status IN ('pending', 'success', 'failed', 'skipped')),
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  INDEX automation_execution_logs_tenant_id_idx (tenant_id),
  INDEX automation_execution_logs_executed_at_idx (executed_at DESC)
);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

ALTER TABLE message_cadences ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_execution_logs ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para message_cadences
CREATE POLICY "Users can view their own cadences"
  ON message_cadences FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can manage their own cadences"
  ON message_cadences FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own cadences"
  ON message_cadences FOR UPDATE
  USING (tenant_id = auth.uid());

-- Políticas RLS para crm_stages
CREATE POLICY "Users can view their own stages"
  ON crm_stages FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can manage their own stages"
  ON crm_stages FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

-- Políticas RLS para crm_leads
CREATE POLICY "Users can view their own leads"
  ON crm_leads FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can manage their own leads"
  ON crm_leads FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own leads"
  ON crm_leads FOR UPDATE
  USING (tenant_id = auth.uid());

-- Políticas RLS para automation_execution_logs
CREATE POLICY "Users can view their own execution logs"
  ON automation_execution_logs FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "System can insert execution logs"
  ON automation_execution_logs FOR INSERT
  WITH CHECK (TRUE);

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX automation_flows_tenant_id_idx ON automation_flows(tenant_id);
CREATE INDEX automation_flows_is_active_idx ON automation_flows(is_active);
CREATE INDEX message_cadences_tenant_id_idx ON message_cadences(tenant_id);
CREATE INDEX crm_stages_tenant_id_idx ON crm_stages(tenant_id);
CREATE INDEX crm_leads_tenant_id_idx ON crm_leads(tenant_id);

-- ========================================
-- NOTIFICAÇÃO DE SCHEMA RELOAD
-- ========================================

NOTIFY pgrst, 'reload schema';
