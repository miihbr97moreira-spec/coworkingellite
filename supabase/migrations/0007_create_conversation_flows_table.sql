-- CreateTable
CREATE TABLE conversation_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    flow_data JSONB, -- Store React Flow JSON here
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE conversation_flows ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenants can view their own conversation_flows." ON conversation_flows
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can insert their own conversation_flows." ON conversation_flows
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Tenants can update their own conversation_flows." ON conversation_flows
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can delete their own conversation_flows." ON conversation_flows
  FOR DELETE USING (tenant_id = auth.uid());
