-- Adicionar coluna cta_type à tabela lp_events para rastreamento de tipos de CTA
ALTER TABLE lp_events ADD COLUMN IF NOT EXISTS cta_type VARCHAR(50);

-- Adicionar coluna cta_label para rastreamento do rótulo do botão
ALTER TABLE lp_events ADD COLUMN IF NOT EXISTS cta_label VARCHAR(255);

-- Criar índice para melhorar performance de queries
CREATE INDEX IF NOT EXISTS idx_lp_events_cta_type ON lp_events(cta_type);
CREATE INDEX IF NOT EXISTS idx_lp_events_cta_label ON lp_events(cta_label);
CREATE INDEX IF NOT EXISTS idx_lp_events_session_id ON lp_events(session_id);

-- Criar view para análise de cliques por CTA
CREATE OR REPLACE VIEW lp_events_cta_summary AS
SELECT
  cta_label,
  cta_type,
  COUNT(*) as total_clicks,
  COUNT(DISTINCT session_id) as unique_sessions,
  DATE(created_at) as click_date
FROM lp_events
WHERE event_type = 'button_click' AND cta_label IS NOT NULL
GROUP BY cta_label, cta_type, DATE(created_at)
ORDER BY click_date DESC, total_clicks DESC;

-- Criar view para análise de conversão (visitantes -> leads)
CREATE OR REPLACE VIEW lp_conversion_funnel AS
SELECT
  DATE(created_at) as date,
  COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN session_id END) as unique_visitors,
  COUNT(DISTINCT CASE WHEN event_type = 'button_click' THEN session_id END) as button_clickers,
  COUNT(DISTINCT CASE WHEN event_type = 'button_click' AND cta_type = 'whatsapp' THEN session_id END) as whatsapp_clickers,
  ROUND(
    COUNT(DISTINCT CASE WHEN event_type = 'button_click' THEN session_id END)::numeric /
    NULLIF(COUNT(DISTINCT CASE WHEN event_type = 'page_view' THEN session_id END), 0) * 100,
    2
  ) as ctr_percentage
FROM lp_events
GROUP BY DATE(created_at)
ORDER BY date DESC;
