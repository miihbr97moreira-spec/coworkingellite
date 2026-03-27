-- CreateTable
CREATE TABLE webhook_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    method TEXT NOT NULL DEFAULT 'POST',
    headers JSONB,
    body_template TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenants can view their own webhook_configs." ON webhook_configs
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can insert their own webhook_configs." ON webhook_configs
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Tenants can update their own webhook_configs." ON webhook_configs
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can delete their own webhook_configs." ON webhook_configs
  FOR DELETE USING (tenant_id = auth.uid());
