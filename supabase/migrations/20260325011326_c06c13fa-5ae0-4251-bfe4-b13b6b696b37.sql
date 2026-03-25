
CREATE TABLE public.cta_buttons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  type text NOT NULL DEFAULT 'whatsapp',
  destination text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT '#FBBF24',
  active boolean NOT NULL DEFAULT true,
  position integer NOT NULL DEFAULT 0,
  whatsapp_message text,
  plan_specific boolean DEFAULT false,
  plan_messages jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.cta_buttons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active CTAs" ON public.cta_buttons
  FOR SELECT TO public USING (active = true);

CREATE POLICY "Admins can manage CTAs" ON public.cta_buttons
  FOR ALL TO authenticated USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)
  );
