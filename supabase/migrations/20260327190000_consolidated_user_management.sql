
-- ===== SQL CONSOLIDADO: GESTÃO DE USUÁRIOS RESILIENTE =====
-- Execute este script no SQL Editor do Supabase para ativar a gestão de usuários.

-- 1. Criar Tabela de Gestão de Usuários (se não existir)
CREATE TABLE IF NOT EXISTS public.user_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role public.app_role DEFAULT 'editor',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Criar Tabela de Fila de Criação (Queue)
CREATE TABLE IF NOT EXISTS public.user_creation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role public.app_role DEFAULT 'editor',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ
);

-- 3. Habilitar RLS em ambas
ALTER TABLE public.user_management ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_creation_queue ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança (Super Admin)
DROP POLICY IF EXISTS "Admins manage user_management" ON public.user_management;
CREATE POLICY "Admins manage user_management" ON public.user_management
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Admins manage queue" ON public.user_creation_queue;
CREATE POLICY "Admins manage queue" ON public.user_creation_queue
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- 5. Trigger: Sincronizar Auth -> User Management automaticamente
CREATE OR REPLACE FUNCTION public.sync_auth_to_management()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_management (user_id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'editor'
  ) ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', EXCLUDED.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_auth_user ON auth.users;
CREATE TRIGGER tr_sync_auth_user
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_auth_to_management();

-- 6. Trigger: Sincronizar Roles
CREATE OR REPLACE FUNCTION public.sync_roles_to_management()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_management SET role = NEW.role WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_sync_user_roles ON public.user_roles;
CREATE TRIGGER tr_sync_user_roles
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.sync_roles_to_management();

-- 7. Recarregar Cache de Schema (importante para evitar erro de 'table not found')
NOTIFY pgrst, 'reload schema';
