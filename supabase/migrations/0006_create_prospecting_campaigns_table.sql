-- CreateTable
CREATE TABLE prospecting_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    target_audience JSONB,
    message_template TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE prospecting_campaigns ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenants can view their own prospecting_campaigns." ON prospecting_campaigns
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can insert their own prospecting_campaigns." ON prospecting_campaigns
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Tenants can update their own prospecting_campaigns." ON prospecting_campaigns
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can delete their own prospecting_campaigns." ON prospecting_campaigns
  FOR DELETE USING (tenant_id = auth.uid());
