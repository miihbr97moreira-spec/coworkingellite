
-- ===== CORREÇÃO DE POLÍTICAS: USER MANAGEMENT =====
-- Garante que a tabela user_management existe com as políticas corretas
-- para o fluxo de criação de usuários pelo super admin via Edge Function

-- Criar tabela se não existir (idempotente)
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

-- Remover políticas antigas para recriar corretamente
DROP POLICY IF EXISTS "Admins can manage user_management" ON public.user_management;
DROP POLICY IF EXISTS "Authenticated users can view user_management" ON public.user_management;
DROP POLICY IF EXISTS "Super admins can manage user_management" ON public.user_management;
DROP POLICY IF EXISTS "Service role bypass" ON public.user_management;

-- Política: Super admins podem gerenciar todos os registros
CREATE POLICY "Super admins can manage user_management"
  ON public.user_management
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Política: Usuários autenticados podem ver seus próprios dados
CREATE POLICY "Users can view own management record"
  ON public.user_management
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Política: Editors podem ver todos os registros (para listagem)
CREATE POLICY "Editors can view all user_management"
  ON public.user_management
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'editor')
  );

-- Função e trigger para updated_at (idempotente)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_user_management_updated_at ON public.user_management;
CREATE TRIGGER update_user_management_updated_at
    BEFORE UPDATE ON public.user_management
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- Garantir que a policy de user_roles permite super_admin ver todos os roles
DROP POLICY IF EXISTS "Super admins can read all roles" ON public.user_roles;
CREATE POLICY "Super admins can read all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));
