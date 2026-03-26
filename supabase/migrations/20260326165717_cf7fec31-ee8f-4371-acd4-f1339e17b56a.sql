
CREATE TABLE public.generated_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT 'Nova Página',
  html_content text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pages" ON public.generated_pages
  FOR ALL TO authenticated USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role)
  );

CREATE POLICY "Anyone can read published pages" ON public.generated_pages
  FOR SELECT TO public USING (status = 'published');

CREATE TRIGGER update_generated_pages_updated_at
  BEFORE UPDATE ON public.generated_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
