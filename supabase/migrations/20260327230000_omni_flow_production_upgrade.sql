-- ========================================
-- OMNI FLOW: Production Upgrade
-- Novos Provedores de IA, Webhooks Bidirecionais e Automações Operacionais
-- ========================================

-- 1. Atualizar tabela omni_agent_config para suportar novos provedores
ALTER TABLE omni_agent_config
  DROP CONSTRAINT IF EXISTS omni_agent_config_ai_provider_check,
  ADD CONSTRAINT omni_agent_config_ai_provider_check 
    CHECK (ai_provider IN ('openai', 'anthropic', 'groq', 'openrouter', 'deepseek'));

-- Adicionar coluna para armazenar metadados do provedor
ALTER TABLE omni_agent_config
  ADD COLUMN IF NOT EXISTS provider_metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS is_production_ready BOOLEAN DEFAULT FALSE;

-- 2. Expandir tabela de Webhooks para suportar Outbound (POST)
CREATE TABLE IF NOT EXISTS webhook_outbound_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  webhook_name TEXT NOT NULL,
  webhook_description TEXT,
  payload_template JSONB NOT NULL DEFAULT '{}', -- Suporta variáveis: {lead_name}, {lead_email}
  headers JSONB DEFAULT '{}', -- Headers customizados
  retry_count INTEGER DEFAULT 3,
  retry_delay_ms INTEGER DEFAULT 1000,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, webhook_url)
);

-- 3. Tabela de histórico de Webhooks Outbound
CREATE TABLE IF NOT EXISTS webhook_outbound_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_config_id UUID NOT NULL REFERENCES webhook_outbound_configs(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payload_sent JSONB NOT NULL,
  response_status_code INTEGER,
  response_body JSONB,
  error_message TEXT,
  retry_attempt INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  INDEX webhook_outbound_logs_tenant_id_idx (tenant_id),
  INDEX webhook_outbound_logs_sent_at_idx (sent_at DESC)
);

-- 4. Atualizar tabela flow_actions para suportar POST Webhook
ALTER TABLE flow_actions
  DROP CONSTRAINT IF EXISTS flow_actions_action_type_check,
  ADD CONSTRAINT flow_actions_action_type_check 
    CHECK (action_type IN ('send_whatsapp', 'send_email', 'call_webhook', 'trigger_ai', 'post_webhook'));

-- 5. Tabela de Automações Completas (Melhorada)
ALTER TABLE automation_flows
  ADD COLUMN IF NOT EXISTS webhook_config_id UUID REFERENCES webhook_outbound_configs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_executed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS execution_success_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS execution_error_count INTEGER DEFAULT 0;

-- 6. Tabela de Variáveis de Sistema (para suporte a templates dinâmicos)
CREATE TABLE IF NOT EXISTS automation_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  variable_name TEXT NOT NULL, -- ex: "lead_name", "lead_email"
  variable_description TEXT,
  variable_type TEXT DEFAULT 'string' CHECK (variable_type IN ('string', 'number', 'boolean', 'date')),
  is_system BOOLEAN DEFAULT FALSE, -- TRUE para variáveis do sistema
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, variable_name)
);

-- 7. Inserir variáveis de sistema padrão
INSERT INTO automation_variables (tenant_id, variable_name, variable_description, variable_type, is_system)
SELECT 
  auth.users.id,
  var.name,
  var.description,
  var.type,
  TRUE
FROM auth.users
CROSS JOIN (
  VALUES 
    ('lead_name', 'Nome do Lead', 'string'),
    ('lead_email', 'Email do Lead', 'string'),
    ('lead_phone', 'Telefone do Lead', 'string'),
    ('lead_source', 'Fonte do Lead', 'string'),
    ('checkout_value', 'Valor do Checkout', 'number'),
    ('checkout_items', 'Itens do Checkout', 'string'),
    ('timestamp', 'Data/Hora do Evento', 'date'),
    ('event_type', 'Tipo do Evento', 'string')
) AS var(name, description, type)
ON CONFLICT (tenant_id, variable_name) DO NOTHING;

-- ========================================
-- ROW LEVEL SECURITY (RLS) - Novos Objetos
-- ========================================

ALTER TABLE webhook_outbound_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_outbound_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_variables ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para webhook_outbound_configs
CREATE POLICY "Users can view their own outbound webhook configs"
  ON webhook_outbound_configs FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert their own outbound webhook configs"
  ON webhook_outbound_configs FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own outbound webhook configs"
  ON webhook_outbound_configs FOR UPDATE
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can delete their own outbound webhook configs"
  ON webhook_outbound_configs FOR DELETE
  USING (tenant_id = auth.uid());

-- Políticas RLS para webhook_outbound_logs
CREATE POLICY "Users can view their own outbound webhook logs"
  ON webhook_outbound_logs FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "System can insert outbound webhook logs"
  ON webhook_outbound_logs FOR INSERT
  WITH CHECK (TRUE);

-- Políticas RLS para automation_variables
CREATE POLICY "Users can view their own automation variables"
  ON automation_variables FOR SELECT
  USING (tenant_id = auth.uid());

CREATE POLICY "Users can insert their own automation variables"
  ON automation_variables FOR INSERT
  WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Users can update their own automation variables"
  ON automation_variables FOR UPDATE
  USING (tenant_id = auth.uid());

-- ========================================
-- ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX webhook_outbound_configs_tenant_id_idx ON webhook_outbound_configs(tenant_id);
CREATE INDEX automation_variables_tenant_id_idx ON automation_variables(tenant_id);

-- ========================================
-- NOTIFICAÇÃO DE SCHEMA RELOAD
-- ========================================

NOTIFY pgrst, 'reload schema';
