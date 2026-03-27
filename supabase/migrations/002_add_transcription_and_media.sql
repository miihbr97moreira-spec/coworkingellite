-- Migration 002: Adicionar tabelas de transcrição e mídia
-- Data: 2026-03-27
-- Autor: Omni Flow Team
-- Versão: 1.0.0

-- ============================================================================
-- Tabela de Logs de Transcrição
-- ============================================================================

CREATE TABLE IF NOT EXISTS transcription_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  audio_url TEXT NOT NULL,
  transcription TEXT,
  language VARCHAR(10),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE transcription_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their transcription logs"
  ON transcription_logs FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE POLICY "Organizations can manage their transcription logs"
  ON transcription_logs FOR ALL
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE INDEX idx_transcription_logs_organization ON transcription_logs(organization_id);
CREATE INDEX idx_transcription_logs_message ON transcription_logs(message_id);
CREATE INDEX idx_transcription_logs_created ON transcription_logs(created_at DESC);

-- ============================================================================
-- Tabela de Arquivos de Mídia
-- ============================================================================

CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  media_type VARCHAR(100) NOT NULL,
  file_size BIGINT,
  public_url TEXT,
  storage_bucket VARCHAR(255) DEFAULT 'omni-flow-media',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organizations can view their media files"
  ON media_files FOR SELECT
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE POLICY "Organizations can manage their media files"
  ON media_files FOR ALL
  USING (organization_id = (SELECT id FROM organizations WHERE owner_id = auth.uid()));

CREATE INDEX idx_media_files_organization ON media_files(organization_id);
CREATE INDEX idx_media_files_message ON media_files(message_id);
CREATE INDEX idx_media_files_created ON media_files(created_at DESC);

-- ============================================================================
-- Adicionar coluna de transcrição à tabela messages
-- ============================================================================

ALTER TABLE messages ADD COLUMN IF NOT EXISTS transcription TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS transcription_language VARCHAR(10);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_transcribed BOOLEAN DEFAULT FALSE;

-- ============================================================================
-- Atualizar trigger de updated_at para messages
-- ============================================================================

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Criar índices adicionais para performance
-- ============================================================================

CREATE INDEX idx_messages_is_transcribed ON messages(is_transcribed) WHERE is_transcribed = FALSE;
CREATE INDEX idx_messages_media_type ON messages(media_type) WHERE media_type IS NOT NULL;
