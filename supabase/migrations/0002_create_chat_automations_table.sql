-- CreateTable
CREATE TABLE chat_automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL, -- Regex, Keyword, Any message
    trigger_value TEXT,
    action_type TEXT NOT NULL, -- Auto-reply, AI Agent, Qualification
    action_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE chat_automations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Tenants can view their own chat_automations." ON chat_automations
  FOR SELECT USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can insert their own chat_automations." ON chat_automations
  FOR INSERT WITH CHECK (tenant_id = auth.uid());

CREATE POLICY "Tenants can update their own chat_automations." ON chat_automations
  FOR UPDATE USING (tenant_id = auth.uid());

CREATE POLICY "Tenants can delete their own chat_automations." ON chat_automations
  FOR DELETE USING (tenant_id = auth.uid());
