
-- ===== EVOLUÇÃO DO QUIZ BUILDER: ANALYTICS & WEBHOOKS =====

-- 1. Adicionar colunas de configuração avançada na tabela quizzes
ALTER TABLE public.quizzes 
ADD COLUMN IF NOT EXISTS webhook_url TEXT,
ADD COLUMN IF NOT EXISTS custom_scripts TEXT, -- Pixels isolados por quiz
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{
  "auto_advance": true,
  "show_progress_bar": true,
  "enable_fake_loading": true,
  "fake_loading_text": "Analisando perfil...",
  "enable_timer": false,
  "timer_seconds": 300,
  "piping_enabled": true
}'::jsonb;

-- 2. Criar tabela para rastreamento de Drop-off (Analytics por etapa)
CREATE TABLE IF NOT EXISTS public.quiz_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE,
  session_id UUID NOT NULL, -- Identificador único da sessão do usuário
  step_id TEXT NOT NULL,    -- ID da pergunta ou etapa (ex: 'q1', 'lead_capture', 'result')
  event_type TEXT NOT NULL, -- 'view', 'complete', 'drop'
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS para Analytics
ALTER TABLE public.quiz_analytics ENABLE ROW LEVEL SECURITY;

-- Permitir que qualquer pessoa insira eventos de analytics (público)
DROP POLICY IF EXISTS "Public can insert quiz analytics" ON public.quiz_analytics;
CREATE POLICY "Public can insert quiz analytics" ON public.quiz_analytics
  FOR INSERT TO public WITH CHECK (true);

-- Apenas admins podem ver os dados de analytics
DROP POLICY IF EXISTS "Admins can view quiz analytics" ON public.quiz_analytics;
CREATE POLICY "Admins can view quiz analytics" ON public.quiz_analytics
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'editor')
  );

-- 4. Adicionar suporte a Webhooks na fila de processamento (opcional, mas bom para background)
-- Por enquanto, faremos o disparo via Edge Function ou direto no client para agilidade.

-- 5. Recarregar Cache de Schema
NOTIFY pgrst, 'reload schema';
