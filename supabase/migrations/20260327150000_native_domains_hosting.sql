
-- ===== SISTEMA DE HOSPEDAGEM E DOMÍNIOS NATIVOS =====

-- Tabela para cadastrar domínios customizados
CREATE TABLE IF NOT EXISTS public.custom_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE, -- Ex: meusite.com.br
  content_type TEXT CHECK (content_type IN ('landing_page', 'quiz', 'page', 'main_lp')),
  content_id UUID, -- ID da landing_page, quiz ou page (null para main_lp)
  is_active BOOLEAN DEFAULT true,
  ssl_status TEXT DEFAULT 'pending', -- pending, active, error
  slug TEXT, -- Caminho personalizado para domínios nativos
  is_native BOOLEAN DEFAULT false, -- true para domínios nativos, false para customizados
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

-- Políticas para custom_domains
DROP POLICY IF EXISTS "Users can only see their own domains" ON public.custom_domains;
CREATE POLICY "Users can only see their own domains" ON public.custom_domains
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Public can read active custom_domains" ON public.custom_domains;
CREATE POLICY "Public can read active custom_domains" ON public.custom_domains
  FOR SELECT USING (is_active = true);

-- Trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_custom_domains_updated_at ON public.custom_domains;
CREATE TRIGGER update_custom_domains_updated_at
    BEFORE UPDATE ON public.custom_domains
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Recarregar Cache de Schema do PostgREST
NOTIFY pgrst, 'reload schema';
