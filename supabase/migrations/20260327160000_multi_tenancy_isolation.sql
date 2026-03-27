
-- ===== ISOLAMENTO TOTAL DE DADOS POR USUÁRIO (MULTI-TENANCY) =====

-- 1. Adicionar coluna user_id em tabelas que ainda não possuem
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.funnels ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.stages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.generated_pages ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.quizzes ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE public.custom_domains ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

-- 2. Atualizar registros existentes para o usuário atual (se houver)
UPDATE public.leads SET user_id = auth.uid() WHERE user_id IS NULL;
UPDATE public.funnels SET user_id = auth.uid() WHERE user_id IS NULL;
UPDATE public.stages SET user_id = auth.uid() WHERE user_id IS NULL;
UPDATE public.generated_pages SET user_id = auth.uid() WHERE user_id IS NULL;
UPDATE public.quizzes SET user_id = auth.uid() WHERE user_id IS NULL;
UPDATE public.custom_domains SET user_id = auth.uid() WHERE user_id IS NULL;

-- 3. Habilitar RLS em todas as tabelas críticas
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

-- 4. Criar Políticas de Isolamento (Cada usuário vê apenas o seu)

-- LEADS
DROP POLICY IF EXISTS "Users can only see their own leads" ON public.leads;
CREATE POLICY "Users can only see their own leads" ON public.leads
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- FUNNELS
DROP POLICY IF EXISTS "Users can only see their own funnels" ON public.funnels;
CREATE POLICY "Users can only see their own funnels" ON public.funnels
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- STAGES
DROP POLICY IF EXISTS "Users can only see their own stages" ON public.stages;
CREATE POLICY "Users can only see their own stages" ON public.stages
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- GENERATED PAGES
DROP POLICY IF EXISTS "Users can only see their own pages" ON public.generated_pages;
CREATE POLICY "Users can only see their own pages" ON public.generated_pages
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- QUIZZES
DROP POLICY IF EXISTS "Users can only see their own quizzes" ON public.quizzes;
CREATE POLICY "Users can only see their own quizzes" ON public.quizzes
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- CUSTOM DOMAINS
DROP POLICY IF EXISTS "Users can only see their own domains" ON public.custom_domains;
CREATE POLICY "Users can only see their own domains" ON public.custom_domains
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 5. Garantir que o público ainda possa ver páginas e quizzes publicados (via slug)
-- Mas apenas se estiverem marcados como publicados
CREATE POLICY "Public can view published pages by slug" ON public.generated_pages
  FOR SELECT USING (status = 'published');

CREATE POLICY "Public can view published quizzes by slug" ON public.quizzes
  FOR SELECT USING (status = 'published');
