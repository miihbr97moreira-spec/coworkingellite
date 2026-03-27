
-- ===== LIBERAR CRM PARA TODOS OS USUÁRIOS AUTENTICADOS =====

-- Remover políticas restritivas antigas para leads
DROP POLICY IF EXISTS "Authenticated users can manage leads" ON public.leads;
CREATE POLICY "Authenticated users can manage leads" ON public.leads
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Remover políticas restritivas antigas para lead_notes
DROP POLICY IF EXISTS "Authenticated users can manage lead notes" ON public.lead_notes;
CREATE POLICY "Authenticated users can manage lead notes" ON public.lead_notes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Remover políticas restritivas antigas para stages
DROP POLICY IF EXISTS "Admins can manage stages" ON public.stages;
CREATE POLICY "Authenticated users can manage stages" ON public.stages
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Remover políticas restritivas antigas para funnels
DROP POLICY IF EXISTS "Admins can manage funnels" ON public.funnels;
CREATE POLICY "Authenticated users can manage funnels" ON public.funnels
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
