-- ============================================================================
-- SCHEMA SUPABASE - CRM OMNICHANNEL MULTI-TENANT
-- Arquitetura: Integrações & Chat do CRM Religare
-- Data: 2026-03-27
-- ============================================================================

-- ============================================================================
-- 1. TABELAS BASE - MULTI-TENANT
-- ============================================================================

-- Tabela de organizações (tenants)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(owner_id)
);

-- RLS para organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own organization"
  ON organizations FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can update their own organization"
  ON organizations FOR UPDATE
  USING (auth.uid() = owner_id);

-- ============================================================================
-- 2. CONFIGURAÇÕES WHATSAPP - MULTI-PROVEDOR
-- ============================================================================

CREATE TABLE IF NOT EXISTS whatsapp_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  api_type VARCHAR(50) NOT NULL CHECK (api_type IN ('z-api', 'evolution', 'codechat', 'baileys', 'botconversa', 'ultramsg', 'chatpro', 'wassenger', 'custom')),
  base_url TEXT NOT NULL,
  api_token TEXT NOT NULL,
  instance_id TEXT,
  extra_headers JSONB DEFAULT '{}',
  default_pipeline_id UUID,
  default_stage_id UUID,
  auto_create_lead BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE whatsapp_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their WhatsApp configs"
  ON whatsapp_configs FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE POLICY "Organizations can manage their WhatsApp configs"
  ON whatsapp_configs FOR ALL
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- ============================================================================
-- 3. CONTATOS/CLIENTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  phone VARCHAR(20) NOT NULL,
  name TEXT,
  email VARCHAR(255),
  company TEXT,
  avatar_url TEXT,
  behavior_tag VARCHAR(50),
  is_group BOOLEAN DEFAULT FALSE,
  group_jid TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, phone)
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their contacts"
  ON contacts FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE POLICY "Organizations can manage their contacts"
  ON contacts FOR ALL
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- ============================================================================
-- 4. MENSAGENS
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  external_message_id TEXT,
  sender_phone VARCHAR(20),
  sender_name TEXT,
  content TEXT,
  media_url TEXT,
  media_type VARCHAR(50),
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound', 'internal')),
  status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'pending')),
  is_group BOOLEAN DEFAULT FALSE,
  group_jid TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, external_message_id)
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their messages"
  ON messages FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE POLICY "Organizations can manage their messages"
  ON messages FOR ALL
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE INDEX idx_messages_organization_client ON messages(organization_id, client_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_external_id ON messages(external_message_id);

-- ============================================================================
-- 5. HISTÓRICO DE CONTATO (NOTAS INTERNAS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS contact_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  direction VARCHAR(20) NOT NULL CHECK (direction IN ('inbound', 'outbound', 'internal')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE contact_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their contact history"
  ON contact_history FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE POLICY "Organizations can manage their contact history"
  ON contact_history FOR ALL
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- ============================================================================
-- 6. AUTOMAÇÕES DE CHAT
-- ============================================================================

CREATE TABLE IF NOT EXISTS chat_automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type VARCHAR(100) NOT NULL,
  trigger_value JSONB,
  actions JSONB NOT NULL,
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  cooldown_seconds INTEGER DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE chat_automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their automations"
  ON chat_automations FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE POLICY "Organizations can manage their automations"
  ON chat_automations FOR ALL
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- ============================================================================
-- 7. CAMPANHAS DE PROSPECÇÃO (AGENTES IA)
-- ============================================================================

CREATE TABLE IF NOT EXISTS prospecting_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  agent_type VARCHAR(50) NOT NULL CHECK (agent_type IN ('atendimento', 'prospeccao')),
  agent_personality TEXT,
  agent_style VARCHAR(50),
  agent_tone VARCHAR(50),
  prompt TEXT,
  pipeline_id UUID,
  initial_stage_id UUID,
  ai_provider_config_id UUID,
  interval_minutes INTEGER DEFAULT 60,
  response_delay_seconds INTEGER DEFAULT 0,
  follow_up_enabled BOOLEAN DEFAULT FALSE,
  follow_up_delay_hours INTEGER DEFAULT 24,
  max_follow_ups INTEGER DEFAULT 3,
  stage_rules JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE prospecting_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their campaigns"
  ON prospecting_campaigns FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE POLICY "Organizations can manage their campaigns"
  ON prospecting_campaigns FOR ALL
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- ============================================================================
-- 8. BASE DE CONHECIMENTO DE CAMPANHAS
-- ============================================================================

CREATE TABLE IF NOT EXISTS campaign_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES prospecting_campaigns(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('pdf', 'url', 'spreadsheet', 'text')),
  source_url TEXT,
  content TEXT,
  extracted_text TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE campaign_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their knowledge"
  ON campaign_knowledge FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE POLICY "Organizations can manage their knowledge"
  ON campaign_knowledge FOR ALL
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- ============================================================================
-- 9. FLUXOS DE CONVERSA
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  template_type VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE conversation_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their flows"
  ON conversation_flows FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE POLICY "Organizations can manage their flows"
  ON conversation_flows FOR ALL
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- ============================================================================
-- 10. NÓS DE FLUXO DE CONVERSA
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_flow_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID NOT NULL REFERENCES conversation_flows(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  node_type VARCHAR(100) NOT NULL,
  node_label TEXT,
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE conversation_flow_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their flow nodes"
  ON conversation_flow_nodes FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE POLICY "Organizations can manage their flow nodes"
  ON conversation_flow_nodes FOR ALL
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- ============================================================================
-- 11. SESSÕES DE FLUXO DE CONVERSA
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_flow_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  flow_id UUID NOT NULL REFERENCES conversation_flows(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  current_node_id UUID REFERENCES conversation_flow_nodes(id),
  variables JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE conversation_flow_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their flow sessions"
  ON conversation_flow_sessions FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE POLICY "Organizations can manage their flow sessions"
  ON conversation_flow_sessions FOR ALL
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- ============================================================================
-- 12. CONFIGURAÇÕES DE WEBHOOK
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  event_types TEXT[] NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  retry_count INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their webhooks"
  ON webhook_configs FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE POLICY "Organizations can manage their webhooks"
  ON webhook_configs FOR ALL
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- ============================================================================
-- 13. LOGS DE WEBHOOK
-- ============================================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  webhook_config_id UUID REFERENCES webhook_configs(id) ON DELETE CASCADE,
  event_type VARCHAR(100) NOT NULL,
  payload JSONB,
  response_status INTEGER,
  response_body TEXT,
  error_message TEXT,
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their webhook logs"
  ON webhook_logs FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE INDEX idx_webhook_logs_organization ON webhook_logs(organization_id);
CREATE INDEX idx_webhook_logs_created_at ON webhook_logs(created_at DESC);

-- ============================================================================
-- 14. CHAVES DE API
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_preview TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their API keys"
  ON api_keys FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE POLICY "Organizations can manage their API keys"
  ON api_keys FOR ALL
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- ============================================================================
-- 15. CONFIGURAÇÕES DE PROVEDORES DE IA
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_provider_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider_name VARCHAR(100) NOT NULL CHECK (provider_name IN ('groq', 'openai', 'gemini')),
  api_key TEXT NOT NULL,
  model_name VARCHAR(255),
  custom_label TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE ai_provider_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their AI configs"
  ON ai_provider_configs FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE POLICY "Organizations can manage their AI configs"
  ON ai_provider_configs FOR ALL
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

-- ============================================================================
-- 16. PREFERÊNCIAS DE CONVERSA
-- ============================================================================

CREATE TABLE IF NOT EXISTS conversation_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_marked_unread BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, user_id, client_id)
);

ALTER TABLE conversation_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their preferences"
  ON conversation_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their preferences"
  ON conversation_preferences FOR ALL
  USING (user_id = auth.uid());

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX idx_whatsapp_configs_org ON whatsapp_configs(organization_id);
CREATE INDEX idx_contacts_org_phone ON contacts(organization_id, phone);
CREATE INDEX idx_chat_automations_org ON chat_automations(organization_id);
CREATE INDEX idx_prospecting_campaigns_org ON prospecting_campaigns(organization_id);
CREATE INDEX idx_conversation_flows_org ON conversation_flows(organization_id);
CREATE INDEX idx_webhook_configs_org ON webhook_configs(organization_id);
CREATE INDEX idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX idx_ai_provider_configs_org ON ai_provider_configs(organization_id);
CREATE INDEX idx_conversation_preferences_org_user ON conversation_preferences(organization_id, user_id);

-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================
