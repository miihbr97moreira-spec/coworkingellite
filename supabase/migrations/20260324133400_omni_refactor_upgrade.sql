
-- ===== MÓDULO 1: CRM / FUNIL (Ajustes de Schema) =====
-- Adicionando campos faltantes na tabela leads para o Kanban Profissional
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS value NUMERIC DEFAULT 0;

-- Atualizando a tabela stages para incluir position (já existe sort_order, mas vamos padronizar conforme solicitado)
ALTER TABLE public.stages 
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS project_id UUID; -- Para suporte a múltiplos projetos se necessário

-- ===== MÓDULO 5: CTAs (Central de Redirecionamentos) =====
CREATE TABLE IF NOT EXISTS public.cta_buttons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  label TEXT NOT NULL,
  type TEXT NOT NULL, -- 'whatsapp' | 'url' | 'email' | 'phone' | 'anchor'
  destination TEXT NOT NULL,
  icon TEXT,
  color TEXT DEFAULT '#25D366',
  position INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.cta_buttons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active CTAs" ON public.cta_buttons
  FOR SELECT USING (active = true);

CREATE POLICY "Admins can manage CTAs" ON public.cta_buttons
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'editor')
  );

-- Seed inicial de CTAs baseado na config atual se possível (opcional, mas bom para não quebrar a UI)
INSERT INTO public.cta_buttons (label, type, destination, icon, color, position)
VALUES 
('Falar no WhatsApp', 'whatsapp', '5511976790653', 'MessageCircle', '#25D366', 0),
('Ver Planos', 'anchor', '#pricing', 'LayoutGrid', '#FBBF24', 1);
