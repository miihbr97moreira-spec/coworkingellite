-- CreateTable
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    provider TEXT NOT NULL,
    api_key TEXT NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenants can view their own api_keys." ON api_keys
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can insert their own api_keys." ON api_keys
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Tenants can update their own api_keys." ON api_keys
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can delete their own api_keys." ON api_keys
  FOR DELETE USING (tenant_id = auth.uid());
