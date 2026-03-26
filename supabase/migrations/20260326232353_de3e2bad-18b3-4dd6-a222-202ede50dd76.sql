
-- Quizzes table
CREATE TABLE public.quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT 'Novo Quiz',
  slug text NOT NULL UNIQUE,
  description text,
  logo_url text,
  logo_position text DEFAULT 'center',
  theme jsonb DEFAULT '{"bgColor":"#0f172a","textColor":"#ffffff","buttonColor":"#FBBF24","buttonTextColor":"#000000","fontFamily":"Inter"}'::jsonb,
  questions jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  crm_funnel_id uuid REFERENCES public.funnels(id) ON DELETE SET NULL,
  crm_stage_id uuid REFERENCES public.stages(id) ON DELETE SET NULL,
  meta_pixel_id text DEFAULT '',
  ga_id text DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage quizzes" ON public.quizzes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'editor'));

CREATE POLICY "Anyone can read published quizzes" ON public.quizzes
  FOR SELECT TO public
  USING (status = 'published');

-- Quiz submissions table
CREATE TABLE public.quiz_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  answers jsonb DEFAULT '[]'::jsonb,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert quiz submissions" ON public.quiz_submissions
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Admins can read quiz submissions" ON public.quiz_submissions
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'editor'));
