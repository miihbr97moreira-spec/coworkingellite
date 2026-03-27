
-- ===== SISTEMA DE LIMITES E PERMISSÕES POR USUÁRIO =====

-- 1. Adicionar colunas de limites e permissões na tabela user_management
ALTER TABLE public.user_management 
ADD COLUMN IF NOT EXISTS max_domains INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_quizzes INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS max_pages INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS allowed_modules TEXT[] DEFAULT ARRAY['builder', 'quiz', 'reviews', 'pixels', 'crm', 'domains'];

-- 2. Atualizar super_admin existente para ter limites ilimitados (representado por -1 ou valor alto)
UPDATE public.user_management 
SET max_domains = 9999, max_quizzes = 9999, max_pages = 9999, 
    allowed_modules = ARRAY['builder', 'quiz_builder', 'reviews', 'pixels', 'crm', 'domains', 'settings']
WHERE role = 'super_admin';

-- 3. Atualizar a tabela de domínios para suportar slugs (caminhos personalizados)
-- Se o domínio for o nativo, o slug é obrigatório. Se for customizado, o slug é opcional.
ALTER TABLE public.custom_domains
ADD COLUMN IF NOT EXISTS slug TEXT,
ADD COLUMN IF NOT EXISTS is_native BOOLEAN DEFAULT false;

-- 4. Garantir que a tabela user_creation_queue também suporte esses novos campos
ALTER TABLE public.user_creation_queue
ADD COLUMN IF NOT EXISTS max_domains INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS max_quizzes INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS max_pages INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS allowed_modules TEXT[] DEFAULT ARRAY['builder', 'quiz', 'reviews', 'pixels', 'crm', 'domains'];

-- 5. Função para verificar se o usuário atingiu o limite de domínios
CREATE OR REPLACE FUNCTION public.check_domain_limit()
RETURNS TRIGGER AS $$
DECLARE
  current_count INTEGER;
  max_allowed INTEGER;
BEGIN
  -- Buscar limite do usuário
  SELECT max_domains INTO max_allowed FROM public.user_management WHERE user_id = NEW.user_id;
  
  -- Contar domínios atuais (excluindo o que está sendo inserido)
  SELECT COUNT(*) INTO current_count FROM public.custom_domains WHERE user_id = NEW.user_id AND is_native = false;
  
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Limite de domínios atingido (% de %)', current_count, max_allowed;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para validar limite antes de inserir novo domínio customizado
DROP TRIGGER IF EXISTS tr_check_domain_limit ON public.custom_domains;
CREATE TRIGGER tr_check_domain_limit
  BEFORE INSERT ON public.custom_domains
  FOR EACH ROW 
  WHEN (NEW.is_native = false)
  EXECUTE FUNCTION public.check_domain_limit();

-- 6. Recarregar Cache de Schema
NOTIFY pgrst, 'reload schema';
