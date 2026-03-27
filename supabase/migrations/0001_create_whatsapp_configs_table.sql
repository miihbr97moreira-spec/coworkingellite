-- CreateTable
CREATE TABLE whatsapp_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    api_type TEXT NOT NULL,
    base_url TEXT NOT NULL,
    token TEXT NOT NULL,
    instance_id TEXT NOT NULL,
    client_token TEXT,
    pipeline_id UUID,
    initial_stage_id UUID,
    auto_create_lead BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE whatsapp_configs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenants can view their own whatsapp_configs." ON whatsapp_configs
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can insert their own whatsapp_configs." ON whatsapp_configs
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Tenants can update their own whatsapp_configs." ON whatsapp_configs
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can delete their own whatsapp_configs." ON whatsapp_configs
  FOR DELETE USING (tenant_id = auth.uid());
