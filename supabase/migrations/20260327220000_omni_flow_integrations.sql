-- ========================================
-- OMNI FLOW: Integrações e Automações
-- ========================================

-- 1. Tabela de Instâncias Z-API (WhatsApp)
CREATE TABLE IF NOT EXISTS zapi_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  instance_id TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  battery_level INTEGER,
  profile_picture_url TEXT,
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'connecting')),
  qr_code_data TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, instance_id)
);

-- 2. Tabela de Configurações de IA (Omni Agent)
CREATE TABLE IF NOT EXISTS omni_agent_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  ai_provider TEXT DEFAULT 'openai' CHECK (ai_provider IN ('openai', 'anthropic')),
  ai_model TEXT DEFAULT 'gpt-4o',
  ai_api_key TEXT, -- Será criptografado via Supabase Secrets
  ai_system_prompt TEXT,
  zapi_sync_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabela de Webhooks (Endpoints únicos por Tenant)
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  webhook_url TEXT UNIQUE NOT NULL,
  webhook_secret TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabela de Logs de Webhooks
CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payload JSONB NOT NULL,
  status_code INTEGER,
  response_data JSONB,
  error_message TEXT,
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  INDEX webhook_logs_tenant_id_idx (tenant_id),
  INDEX webhook_logs_received_at_idx (received_at DESC)
);

-- 5. Tabela de Triggers (Gatilhos para Automações)
CREATE TABLE IF NOT EXISTS flow_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('new_lead', 'checkout_abandoned', 'form_submission', 'custom_webhook')),
  trigger_name TEXT NOT NULL,
  trigger_description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, trigger_type)
);

-- 6. Tabela de Actions (Ações para Automações)
CREATE TABLE IF NOT EXISTS flow_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('send_whatsapp', 'send_email', 'call_webhook', 'trigger_ai')),
  action_name TEXT NOT NULL,
  action_description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, action_type)
);

-- 7. Tabela de Flows (Automações Completas)
CREATE TABLE IF NOT EXISTS automation_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flow_name TEXT NOT NULL,
  flow_description TEXT,
  trigger_id UUID NOT NULL REFERENCES flow_triggers(id) ON DELETE CASCADE,
  action_id UUID NOT NULL REFERENCES flow_actions(id) ON DELETE CASCADE,
  template_message TEXT, -- Suporta variáveis dinâmicas: {nome}, {email}, etc.
  is_active BOOLEAN DEFAULT TRUE,
  execution_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Tabela de Execuções de Flows (Histórico)
CREATE TABLE IF NOT EXISTS flow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES automation_flows(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trigger_data JSONB NOT NULL, -- Dados que acionaram o flow
  action_result JSONB, -- Resultado da ação executada
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX flow_executions_tenant_id_idx (tenant_id),
  INDEX flow_executions_executed_at_idx (executed_at DESC)
);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE zapi_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE omni_agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE flow_executions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para zapi_instances
CREATE POLICY "Users can view their own Z-API instances"
  ON zapi_instances FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert their own Z-API instances"
  ON zapi_instances FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own Z-API instances"
  ON zapi_instances FOR UPDATE
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can delete their own Z-API instances"
  ON zapi_instances FOR DELETE
  USING (tenant_id = auth.uid());

-- Políticas RLS para omni_agent_config
CREATE POLICY "Users can view their own Omni Agent config"
  ON omni_agent_config FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert their own Omni Agent config"
  ON omni_agent_config FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own Omni Agent config"
  ON omni_agent_config FOR UPDATE
  USING (tenant_id = auth.uid());

-- Políticas RLS para webhook_endpoints
CREATE POLICY "Users can view their own webhook endpoints"
  ON webhook_endpoints FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert their own webhook endpoints"
  ON webhook_endpoints FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own webhook endpoints"
  ON webhook_endpoints FOR UPDATE
  USING (tenant_id = auth.uid());

-- Políticas RLS para webhook_logs
CREATE POLICY "Users can view their own webhook logs"
  ON webhook_logs FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Service can insert webhook logs"
  ON webhook_logs FOR INSERT
  WITH CHECK (TRUE); -- Será validado via JWT token de webhook

-- Políticas RLS para flow_triggers
CREATE POLICY "Users can view their own flow triggers"
  ON flow_triggers FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert their own flow triggers"
  ON flow_triggers FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own flow triggers"
  ON flow_triggers FOR UPDATE
  USING (tenant_id = auth.uid());

-- Políticas RLS para flow_actions
CREATE POLICY "Users can view their own flow actions"
  ON flow_actions FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert their own flow actions"
  ON flow_actions FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own flow actions"
  ON flow_actions FOR UPDATE
  USING (tenant_id = auth.uid());

-- Políticas RLS para automation_flows
CREATE POLICY "Users can view their own automation flows"
  ON automation_flows FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert their own automation flows"
  ON automation_flows FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own automation flows"
  ON automation_flows FOR UPDATE
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can delete their own automation flows"
  ON automation_flows FOR DELETE
  USING (tenant_id = auth.uid());

-- Políticas RLS para flow_executions
CREATE POLICY "Users can view their own flow executions"
  ON flow_executions FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "System can insert flow executions"
  ON flow_executions FOR INSERT
  WITH CHECK (TRUE); -- Será validado via backend

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX zapi_instances_tenant_id_idx ON zapi_instances(tenant_id);
CREATE INDEX omni_agent_config_tenant_id_idx ON omni_agent_config(tenant_id);
CREATE INDEX webhook_endpoints_tenant_id_idx ON webhook_endpoints(tenant_id);
CREATE INDEX flow_triggers_tenant_id_idx ON flow_triggers(tenant_id);
CREATE INDEX flow_actions_tenant_id_idx ON flow_actions(tenant_id);
CREATE INDEX automation_flows_tenant_id_idx ON automation_flows(tenant_id);

-- ========================================
-- NOTIFICAÇÃO DE SCHEMA RELOAD
-- ========================================

NOTIFY pgrst, 'reload schema';
