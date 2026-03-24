
-- ===== ROLES & AUTH =====
CREATE TYPE public.app_role AS ENUM ('super_admin', 'editor');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Super admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- ===== LANDING PAGE CONFIG =====
CREATE TABLE public.landing_page_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.landing_page_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read LP config" ON public.landing_page_config
  FOR SELECT USING (true);
CREATE POLICY "Admins can update LP config" ON public.landing_page_config
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'editor')
  );

-- ===== REVIEWS / TESTIMONIALS =====
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  text TEXT NOT NULL,
  stars INT NOT NULL DEFAULT 5 CHECK (stars >= 1 AND stars <= 5),
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active reviews" ON public.reviews
  FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage reviews" ON public.reviews
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'editor')
  );

-- ===== LOGOS (TRUST SCORE) =====
CREATE TABLE public.logos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.logos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active logos" ON public.logos
  FOR SELECT USING (active = true);
CREATE POLICY "Admins can manage logos" ON public.logos
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'editor')
  );

-- ===== CRM: FUNNELS =====
CREATE TABLE public.funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read funnels" ON public.funnels
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage funnels" ON public.funnels
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- ===== CRM: STAGES =====
CREATE TABLE public.stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#FBBF24',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read stages" ON public.stages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage stages" ON public.stages
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'super_admin'));

-- ===== CRM: LEADS =====
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES public.stages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  deal_value DECIMAL(12,2) DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  source TEXT DEFAULT 'manual',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read leads" ON public.leads
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage leads" ON public.leads
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'editor')
  );

-- ===== LEAD NOTES / HISTORY =====
CREATE TABLE public.lead_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lead_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read lead notes" ON public.lead_notes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage lead notes" ON public.lead_notes
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'editor')
  );

-- ===== LP VISIT TRACKING =====
CREATE TABLE public.lp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.lp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert events" ON public.lp_events
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read events" ON public.lp_events
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'editor')
  );

-- ===== STORAGE BUCKETS =====
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

CREATE POLICY "Public read gallery" ON storage.objects FOR SELECT USING (bucket_id = 'gallery');
CREATE POLICY "Admins upload gallery" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery' AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'editor')));
CREATE POLICY "Admins delete gallery" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'editor')));

CREATE POLICY "Public read logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
CREATE POLICY "Admins upload logos" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'logos' AND (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'editor')));

CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload avatars" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');

-- ===== UPDATED_AT TRIGGER =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_funnels_updated_at BEFORE UPDATE ON public.funnels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_lp_config_updated_at BEFORE UPDATE ON public.landing_page_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== SEED: DEFAULT LP CONFIG =====
INSERT INTO public.landing_page_config (key, value) VALUES
  ('hero', '{"headline": "Saia do amadorismo do Home Office. Feche contratos de alto valor em um ambiente de elite.", "subheadline": "O coworking premium em Moema para profissionais que exigem excelência. Sua próxima conquista começa aqui."}'),
  ('whatsapp', '{"number": "5511976790653"}'),
  ('pixels', '{"metaPixelId": "", "googleAnalyticsId": ""}'),
  ('plans', '{"plans": [{"id": "hora", "name": "Hora", "price": "R$ 40", "priceNote": "/hora", "features": ["1 estação de trabalho", "Internet rápida", "Café e água free"], "whatsappMessage": "Olá, tenho interesse no plano por hora de R$ 40.", "highlight": false}, {"id": "diaria", "name": "Diária", "price": "R$ 200", "priceNote": "/dia", "features": ["2 estações de trabalho", "Internet rápida", "Café e água free"], "whatsappMessage": "Olá, tenho interesse no plano diário de R$ 200.", "highlight": true}, {"id": "mensal", "name": "Mensal", "price": "R$ 130", "priceNote": "/dia (mín. 10 diárias)", "features": ["3 estações de trabalho", "2 diárias na sala de reunião (4 pessoas)", "Internet rápida", "Café e água free", "Frigobar exclusivo"], "whatsappMessage": "Olá, tenho interesse no plano mensal a partir de R$ 130/dia.", "highlight": false}]}'),
  ('theme', '{"background": "220 15% 6%", "primary": "45 100% 56%", "fontFamily": "Space Grotesk"}');

-- Seed default reviews
INSERT INTO public.reviews (name, role, text, stars, sort_order) VALUES
  ('Dr. Marcos Oliveira', 'Advogado', 'Trabalhar em casa tirava minha autoridade. No Ellite, fechei 3 clientes no primeiro mês só pela apresentação da sala de reunião.', 5, 1),
  ('Dra. Camila Santos', 'Médica Dermatologista', 'O ambiente premium passa credibilidade imediata. Meus pacientes me enxergam de forma diferente desde que migrei para cá.', 5, 2),
  ('Ricardo Mendes', 'Corretor de Imóveis', 'Fechei vendas de alto padrão porque o espaço transmite exatamente o que meu cliente espera: excelência.', 5, 3),
  ('Ana Beatriz Costa', 'Consultora de Marketing', 'Saí do home office e tripliquei meu faturamento em 4 meses. O networking aqui é incomparável.', 5, 4),
  ('Fernando Lima', 'Arquiteto', 'Receber clientes no Ellite é outra experiência. O design do espaço já vende por mim.', 5, 5),
  ('Patrícia Almeida', 'Psicóloga', 'Ambiente silencioso, privativo e elegante. Perfeito para minhas sessões e atendimentos.', 5, 6),
  ('Carlos Eduardo', 'Advogado Tributarista', 'A localização perto do metrô Moema é estratégica. Meus clientes agradecem a acessibilidade.', 5, 7),
  ('Juliana Rocha', 'Designer de Interiores', 'O café premium incluso e o ambiente inspirador fazem toda diferença na minha produtividade.', 5, 8),
  ('Dr. Henrique Bastos', 'Consultor Financeiro', 'Profissionalismo que gera confiança. Meus clientes percebem o valor desde o primeiro contato.', 5, 9),
  ('Mariana Fonseca', 'Coach Executiva', 'Cada detalhe do espaço comunica sofisticação. É exatamente o que minha marca precisa.', 5, 10),
  ('Thiago Amaral', 'Corretor de Seguros', 'Investir no Ellite foi o melhor custo-benefício para meu negócio. Retorno imediato em credibilidade.', 5, 11),
  ('Renata Duarte', 'Nutricionista', 'Ambiente perfeito para consultas. Meus pacientes se sentem acolhidos e valorizados.', 5, 12);

-- Seed default funnel
INSERT INTO public.funnels (id, name, description) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Vendas B2B', 'Funil principal de vendas para empresas');
INSERT INTO public.stages (id, funnel_id, name, color, sort_order) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Novo Lead', '#3B82F6', 0),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Contato Feito', '#F59E0B', 1),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Proposta Enviada', '#8B5CF6', 2),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Fechado', '#10B981', 3);
