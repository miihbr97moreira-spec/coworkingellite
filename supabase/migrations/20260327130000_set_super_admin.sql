
-- ===== DEFINIR jpm19990@gmail.com COMO SUPER ADMIN =====

DO $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Buscar o ID do usuário pelo email na tabela auth.users
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'jpm19990@gmail.com';

  -- Se o usuário existir, garantir que ele tenha a role super_admin
  IF target_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (target_user_id, 'super_admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Usuário jpm19990@gmail.com configurado como super_admin.';
  ELSE
    RAISE NOTICE 'Usuário jpm19990@gmail.com não encontrado na tabela auth.users. Ele precisa se cadastrar primeiro.';
  END IF;
END $$;
