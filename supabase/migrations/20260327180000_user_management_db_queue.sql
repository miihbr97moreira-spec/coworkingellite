
-- ===== SISTEMA DE GESTÃO DE USUÁRIOS VIA BANCO DE DADOS (DATABASE QUEUE) =====
-- Este sistema elimina a necessidade de chamar Edge Functions diretamente do navegador,
-- evitando erros de CORS, DNS e rede ("Failed to fetch").

-- 1. Garantir que a tabela user_management existe e tem as colunas necessárias
CREATE TABLE IF NOT EXISTS public.user_management (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT, -- Adicionado para facilitar a listagem sem Auth Admin API
  role public.app_role DEFAULT 'editor',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS e criar políticas de acesso para o Super Admin
ALTER TABLE public.user_management ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage all user_management" ON public.user_management;
CREATE POLICY "Super admins can manage all user_management"
  ON public.user_management
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Users can view own record" ON public.user_management;
CREATE POLICY "Users can view own record"
  ON public.user_management
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 3. Tabela de Fila para Criação de Usuários (Queue)
-- O Super Admin insere aqui, e um Webhook ou Trigger processa a criação real no Auth
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

-- Habilitar RLS para a Fila
ALTER TABLE public.user_creation_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage queue" ON public.user_creation_queue;
CREATE POLICY "Super admins can manage queue"
  ON public.user_creation_queue
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 4. Sincronizar automaticamente auth.users -> user_management
-- Isso garante que qualquer usuário criado (mesmo manualmente) apareça na lista
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_management (user_id, full_name, email, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 
    NEW.email,
    'editor'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', EXCLUDED.full_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- 5. Sincronizar roles automaticamente
CREATE OR REPLACE FUNCTION public.sync_user_management_role()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.user_management 
  SET role = NEW.role 
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_role_sync ON public.user_roles;
CREATE TRIGGER on_user_role_sync
  AFTER INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.sync_user_management_role();
