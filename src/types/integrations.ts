export type WhatsAppConfig = {
  id: string;
  tenant_id: string;
  name: string;
  api_type: 'z-api' | 'evolution';
  base_url: string;
  token: string;
  instance_id: string;
  client_token?: string;
  pipeline_id?: string;
  initial_stage_id?: string;
  auto_create_lead: boolean;
  created_at: string;
  updated_at: string;
};

export type ChatAutomation = {
  id: string;
  tenant_id: string;
  name: string;
  trigger_type: 'regex' | 'keyword' | 'all';
  trigger_value?: string;
  action_type: 'auto-reply' | 'ai-agent' | 'qualification';
  action_value?: string;
  created_at: string;
  updated_at: string;
};

export type WebhookConfig = {
  id: string;
  tenant_id: string;
  name: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body_template?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type WebhookLog = {
  id: string;
  tenant_id: string;
  direction: 'IN' | 'OUT';
  event: string;
  url: string;
  status: number;
  response_body?: string;
  request_body?: string;
  created_at: string;
};

export type APIKey = {
  id: string;
  tenant_id: string;
  name: string;
  provider: 'groq' | 'openai' | 'google-gemini';
  api_key: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type ConversationFlow = {
  id: string;
  tenant_id: string;
  name: string;
  flow_data: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
