-- CreateTable
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    direction TEXT NOT NULL, -- 'IN' or 'OUT'
    event TEXT NOT NULL,
    url TEXT NOT NULL,
    status INTEGER,
    response_body TEXT,
    request_body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenants can view their own webhook_logs." ON webhook_logs
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can insert their own webhook_logs." ON webhook_logs
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Tenants can update their own webhook_logs." ON webhook_logs
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can delete their own webhook_logs." ON webhook_logs
  FOR DELETE USING (tenant_id = auth.uid());
