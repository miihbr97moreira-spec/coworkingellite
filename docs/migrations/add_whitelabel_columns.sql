-- Migração: Adicionar colunas de White-label e SEO à tabela generated_pages
-- Objetivo: Permitir customização total de Favicon, Logo, Título e Descrição para cada página

-- Adicionar colunas à tabela generated_pages
ALTER TABLE generated_pages
ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255),
ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS favicon_url TEXT,
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS brand_color VARCHAR(7);

-- Criar índice para custom_domain para melhor performance
CREATE INDEX IF NOT EXISTS idx_generated_pages_custom_domain ON generated_pages(custom_domain);

-- Adicionar comentários às colunas para documentação
COMMENT ON COLUMN generated_pages.custom_domain IS 'Domínio customizado do cliente (ex: cliente.com)';
COMMENT ON COLUMN generated_pages.seo_title IS 'Título da página para SEO (aparece na aba do navegador)';
COMMENT ON COLUMN generated_pages.seo_description IS 'Descrição meta para SEO (aparece nos resultados de busca)';
COMMENT ON COLUMN generated_pages.favicon_url IS 'URL do favicon armazenado no Supabase Storage';
COMMENT ON COLUMN generated_pages.logo_url IS 'URL do logo armazenado no Supabase Storage';
COMMENT ON COLUMN generated_pages.brand_color IS 'Cor principal da marca em formato HEX (ex: #FF5733)';

-- Criar tabela de auditoria para rastrear mudanças de White-label
CREATE TABLE IF NOT EXISTS whitelabel_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES generated_pages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar índice na tabela de auditoria
CREATE INDEX IF NOT EXISTS idx_whitelabel_audit_page_id ON whitelabel_audit(page_id);
CREATE INDEX IF NOT EXISTS idx_whitelabel_audit_user_id ON whitelabel_audit(user_id);
