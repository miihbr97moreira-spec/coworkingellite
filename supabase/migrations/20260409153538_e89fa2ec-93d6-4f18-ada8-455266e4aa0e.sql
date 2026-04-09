
-- Forms table
CREATE TABLE public.forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID,
  title TEXT NOT NULL DEFAULT 'Novo Formulário',
  description TEXT,
  slug TEXT NOT NULL UNIQUE,
  questions JSONB DEFAULT '[]'::jsonb,
  theme JSONB DEFAULT '{"bgColor": "#0f172a", "textColor": "#ffffff", "fontFamily": "Inter", "buttonColor": "#FBBF24", "buttonTextColor": "#000000"}'::jsonb,
  logic_rules JSONB DEFAULT '[]'::jsonb,
  settings JSONB DEFAULT '{"show_progress": true, "allow_back": true, "ending_title": "Obrigado!", "ending_description": "Suas respostas foram enviadas com sucesso."}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft',
  crm_funnel_id UUID REFERENCES public.funnels(id) ON DELETE SET NULL,
  crm_stage_id UUID REFERENCES public.stages(id) ON DELETE SET NULL,
  source_tag TEXT DEFAULT '',
  meta_pixel_id TEXT DEFAULT '',
  ga_id TEXT DEFAULT '',
  logo_url TEXT,
  logo_position TEXT DEFAULT 'center',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage forms" ON public.forms FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Anyone can read published forms" ON public.forms FOR SELECT TO public
  USING (status = 'published');

CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON public.forms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Form submissions table
CREATE TABLE public.form_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  answers JSONB DEFAULT '[]'::jsonb,
  name TEXT,
  email TEXT,
  phone TEXT,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.form_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read form submissions" ON public.form_submissions FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'editor'::app_role));

CREATE POLICY "Anyone can insert form submissions" ON public.form_submissions FOR INSERT TO public
  WITH CHECK (true);

-- Trigger to auto-create CRM lead on form submission
CREATE OR REPLACE FUNCTION public.handle_form_submission_crm()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  form_record RECORD;
  lead_record RECORD;
  answers_summary TEXT := '';
  q RECORD;
BEGIN
  SELECT * INTO form_record FROM public.forms WHERE id = NEW.form_id;

  IF form_record.crm_funnel_id IS NOT NULL AND form_record.crm_stage_id IS NOT NULL THEN
    IF NEW.answers IS NOT NULL THEN
      FOR q IN SELECT * FROM jsonb_array_elements(NEW.answers::jsonb) AS elem
      LOOP
        answers_summary := answers_summary || COALESCE(q.elem->>'question', '') || ': ' || COALESCE(q.elem->>'answer', '') || E'\n';
      END LOOP;
    END IF;

    INSERT INTO public.leads (
      name, email, phone, funnel_id, stage_id, source, notes, sort_order, tags
    ) VALUES (
      COALESCE(NEW.name, 'Lead Form'),
      NEW.email,
      NEW.phone,
      form_record.crm_funnel_id,
      form_record.crm_stage_id,
      COALESCE('form:' || form_record.source_tag, 'form:' || form_record.slug),
      answers_summary,
      0,
      ARRAY[COALESCE(form_record.source_tag, form_record.slug)]
    ) RETURNING * INTO lead_record;

    NEW.lead_id := lead_record.id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_form_submission_crm
  BEFORE INSERT ON public.form_submissions
  FOR EACH ROW EXECUTE FUNCTION public.handle_form_submission_crm();
