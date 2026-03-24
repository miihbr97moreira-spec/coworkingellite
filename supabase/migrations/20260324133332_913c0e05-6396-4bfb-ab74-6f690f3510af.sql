
-- Fix permissive INSERT on lp_events: restrict to specific event types only
DROP POLICY "Anyone can insert events" ON public.lp_events;
CREATE POLICY "Anyone can insert events" ON public.lp_events
  FOR INSERT WITH CHECK (
    event_type IN ('page_view', 'cta_click', 'plan_click', 'whatsapp_click', 'scroll_depth')
  );
