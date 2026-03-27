-- CreateTable
CREATE TABLE ai_provider_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL,
    config_data JSONB, -- Store provider-specific configurations
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE ai_provider_configs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenants can view their own ai_provider_configs." ON ai_provider_configs
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can insert their own ai_provider_configs." ON ai_provider_configs
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Tenants can update their own ai_provider_configs." ON ai_provider_configs
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can delete their own ai_provider_configs." ON ai_provider_configs
  FOR DELETE USING (tenant_id = auth.uid());
