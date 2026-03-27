
-- ===== SISTEMA DE LIMITES E PERMISSÕES POR USUÁRIO =====

-- 1. Adicionar colunas de limites e permissões na tabela user_management
ALTER TABLE public.user_management 
ADD COLUMN IF NOT EXISTS max_domains INTEGER DEFAULT 9999, -- Padrão: ilimitado (9999)
ADD COLUMN IF NOT EXISTS max_quizzes INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS max_pages INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS allowed_modules TEXT[] DEFAULT ARRAY['builder', 'quiz', 'reviews', 'pixels', 'crm', 'domains'];

-- 2. Atualizar super_admin existente para ter limites ilimitados (representado por -1 ou valor alto)
UPDATE public.user_management 
SET max_domains = 9999, max_quizzes = 9999, max_pages = 9999, 
    allowed_modules = ARRAY['builder', 'quiz_builder', 'reviews', 'pixels', 'crm', 'domains', 'settings']
WHERE role = 'super_admin';

-- 3. Colunas de slug e is_native já estão definidas na criação da tabela custom_domains
-- Não é necessário adicionar novamente

-- 4. Garantir que a tabela user_creation_queue também suporte esses novos campos
ALTER TABLE public.user_creation_queue
ADD COLUMN IF NOT EXISTS max_domains INTEGER DEFAULT 9999, -- Padrão: ilimitado
ADD COLUMN IF NOT EXISTS max_quizzes INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS max_pages INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS allowed_modules TEXT[] DEFAULT ARRAY['builder', 'quiz', 'reviews', 'pixels', 'crm', 'domains'];

-- 5. Função para verificar se o usuário atingiu o limite de domínios
-- Removida: Agora todos os usuários tém domínios ilimitados (max_domains = 9999)
-- A validação de limite foi desabilitada para permitir domínios ilimitados
DROP TRIGGER IF EXISTS tr_check_domain_limit ON public.custom_domains;
DROP FUNCTION IF EXISTS public.check_domain_limit();

-- 6. Recarregar Cache de Schema
NOTIFY pgrst, 'reload schema';
