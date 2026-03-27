
-- Allow public users to UPDATE quiz_submissions (for lead_id linking)
CREATE POLICY "Anyone can update own quiz submissions"
ON public.quiz_submissions FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create a trigger function to auto-create CRM leads from quiz submissions
CREATE OR REPLACE FUNCTION public.handle_quiz_submission_crm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  quiz_record RECORD;
  lead_record RECORD;
  answers_summary TEXT := '';
  q RECORD;
BEGIN
  SELECT * INTO quiz_record FROM public.quizzes WHERE id = NEW.quiz_id;
  
  IF quiz_record.crm_funnel_id IS NOT NULL AND quiz_record.crm_stage_id IS NOT NULL THEN
    IF NEW.answers IS NOT NULL THEN
      FOR q IN SELECT * FROM jsonb_each_text(NEW.answers::jsonb)
      LOOP
        answers_summary := answers_summary || q.key || ': ' || q.value || E'\n';
      END LOOP;
    END IF;
    
    INSERT INTO public.leads (
      name, email, phone, funnel_id, stage_id, source, notes, sort_order
    ) VALUES (
      COALESCE(NEW.name, 'Lead Quiz'),
      NEW.email,
      NEW.phone,
      quiz_record.crm_funnel_id,
      quiz_record.crm_stage_id,
      'quiz:' || quiz_record.slug,
      answers_summary,
      0
    ) RETURNING * INTO lead_record;
    
    NEW.lead_id := lead_record.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_quiz_submission_create_lead
  BEFORE INSERT ON public.quiz_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_quiz_submission_crm();
