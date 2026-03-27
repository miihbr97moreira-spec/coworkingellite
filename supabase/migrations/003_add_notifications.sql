-- Migration 003: Adicionar tabelas de notificações
-- Data: 2026-03-27
-- Autor: Omni Flow Team
-- Versão: 1.0.0

-- ============================================================================
-- Tabela de Notificações do Proprietário
-- ============================================================================

CREATE TABLE IF NOT EXISTS owner_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  event_type VARCHAR(100),
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE owner_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON owner_notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON owner_notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notifications"
  ON owner_notifications FOR DELETE
  USING (user_id = auth.uid());

CREATE INDEX idx_owner_notifications_user ON owner_notifications(user_id);
CREATE INDEX idx_owner_notifications_organization ON owner_notifications(organization_id);
CREATE INDEX idx_owner_notifications_created ON owner_notifications(created_at DESC);
CREATE INDEX idx_owner_notifications_unread ON owner_notifications(user_id, is_read) WHERE is_read = FALSE;

-- ============================================================================
-- Tabela de Preferências de Notificação
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email BOOLEAN DEFAULT TRUE,
  sms BOOLEAN DEFAULT FALSE,
  push BOOLEAN DEFAULT TRUE,
  email_frequency VARCHAR(50) DEFAULT 'immediate' CHECK (email_frequency IN ('immediate', 'daily', 'weekly', 'never')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
  ON notification_preferences FOR UPDATE
  USING (user_id = auth.uid());

CREATE INDEX idx_notification_preferences_user ON notification_preferences(user_id);

-- ============================================================================
-- Tabela de Logs de Notificação
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(100),
  title TEXT,
  content TEXT,
  channels TEXT[] DEFAULT ARRAY[]::TEXT[],
  results JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their notification logs"
  ON notification_logs FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE INDEX idx_notification_logs_organization ON notification_logs(organization_id);
CREATE INDEX idx_notification_logs_user ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_created ON notification_logs(created_at DESC);

-- ============================================================================
-- Trigger para atualizar updated_at
-- ============================================================================

CREATE TRIGGER update_owner_notifications_updated_at BEFORE UPDATE ON owner_notifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
