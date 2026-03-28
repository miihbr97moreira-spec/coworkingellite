
-- =============================================
-- PILAR 1: ALL MISSING TABLES WITH RLS
-- =============================================

-- 1. User Management (Super Admin manages tenants)
CREATE TABLE IF NOT EXISTS public.user_management (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email text NOT NULL,
  full_name text DEFAULT '',
  is_active boolean DEFAULT true,
  role text DEFAULT 'editor',
  max_domains integer DEFAULT 3,
  max_quizzes integer DEFAULT 10,
  max_pages integer DEFAULT 10,
  allowed_modules text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_management ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins manage user_management" ON public.user_management
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users read own management" ON public.user_management
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 2. Custom Domains
CREATE TABLE IF NOT EXISTS public.custom_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  domain text NOT NULL,
  slug text,
  is_native boolean DEFAULT false,
  content_type text NOT NULL DEFAULT 'main_lp',
  content_id uuid,
  is_active boolean DEFAULT true,
  ssl_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(domain)
);

ALTER TABLE public.custom_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own domains" ON public.custom_domains
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Public read active domains" ON public.custom_domains
  FOR SELECT TO anon
  USING (is_active = true);

-- 3. Omni Agent Config (BYOK keys per tenant)
CREATE TABLE IF NOT EXISTS public.omni_agent_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE,
  ai_provider text DEFAULT 'openai',
  ai_model text DEFAULT 'gpt-4o',
  ai_api_key text DEFAULT '',
  ai_system_prompt text DEFAULT '',
  zapi_sync_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.omni_agent_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own agent config" ON public.omni_agent_config
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid());

-- 4. Quiz Analytics (drop-off tracking)
CREATE TABLE IF NOT EXISTS public.quiz_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  step_id text NOT NULL,
  event_type text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.quiz_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert quiz analytics" ON public.quiz_analytics
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins read quiz analytics" ON public.quiz_analytics
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'editor'));

-- 5. Webhook Endpoints
CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  webhook_url text NOT NULL,
  webhook_secret text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own webhook endpoints" ON public.webhook_endpoints
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid());

-- 6. Webhook Logs
CREATE TABLE IF NOT EXISTS public.webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  endpoint_id uuid REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
  payload jsonb DEFAULT '{}',
  status_code integer DEFAULT 0,
  received_at timestamptz DEFAULT now()
);

ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own webhook logs" ON public.webhook_logs
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid());

-- 7. Z-API Instances (WhatsApp)
CREATE TABLE IF NOT EXISTS public.zapi_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE,
  instance_id text DEFAULT '',
  instance_token text DEFAULT '',
  phone_number text DEFAULT '',
  status text DEFAULT 'disconnected',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.zapi_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own zapi instances" ON public.zapi_instances
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid());

-- 8. WhatsApp Configs (referenced in OmniFlow)
CREATE TABLE IF NOT EXISTS public.whatsapp_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  provider text DEFAULT 'zapi',
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.whatsapp_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own whatsapp configs" ON public.whatsapp_configs
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid());

-- 9. Webhook Configs (referenced in OmniFlow)
CREATE TABLE IF NOT EXISTS public.webhook_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own webhook configs" ON public.webhook_configs
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid());

-- 10. API Keys (BYOK vault)
CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  provider text NOT NULL,
  api_key text NOT NULL,
  model text DEFAULT '',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own api keys" ON public.api_keys
  FOR ALL TO authenticated
  USING (tenant_id = auth.uid());

-- 11. Add lead_score to leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS lead_score integer DEFAULT 0;

-- 12. Add updated_at triggers
CREATE TRIGGER update_user_management_updated_at BEFORE UPDATE ON public.user_management
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_domains_updated_at BEFORE UPDATE ON public.custom_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_omni_agent_config_updated_at BEFORE UPDATE ON public.omni_agent_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
