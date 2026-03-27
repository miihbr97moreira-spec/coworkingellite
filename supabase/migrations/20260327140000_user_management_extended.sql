
-- ===== GERENCIAMENTO DE USUÁRIOS E PERMISSÕES ESTENDIDAS =====

-- Adicionar coluna de status na tabela de perfis (se existir) ou criar tabela de metadados de usuários
CREATE TABLE IF NOT EXISTS public.user_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.user_management ENABLE ROW LEVEL SECURITY;

-- Políticas para user_management
DROP POLICY IF EXISTS "Admins can manage user_management" ON public.user_management;
CREATE POLICY "Admins can manage user_management" ON public.user_management
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('super_admin', 'editor')
    )
  );

-- Garantir que todos os usuários autenticados possam ver os perfis básicos
DROP POLICY IF EXISTS "Authenticated users can view user_management" ON public.user_management;
CREATE POLICY "Authenticated users can view user_management" ON public.user_management
  FOR SELECT TO authenticated USING (true);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_management_updated_at ON public.user_management;
CREATE TRIGGER update_user_management_updated_at
    BEFORE UPDATE ON public.user_management
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
