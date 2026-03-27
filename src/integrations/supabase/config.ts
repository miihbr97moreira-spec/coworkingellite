/**
 * Configuração do Supabase Client
 * Centraliza todas as constantes e configurações do Supabase
 */

export const SUPABASE_CONFIG = {
  // URLs e chaves
  url: import.meta.env.VITE_SUPABASE_URL || "",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "",

  // Timeouts
  requestTimeout: 30000,
  realtimeTimeout: 5000,

  // Realtime
  realtimeEnabled: true,
  realtimeChannels: {
    messages: "messages",
    notifications: "owner_notifications",
    automations: "chat_automations",
    contacts: "contacts",
  },

  // Storage
  storage: {
    bucket: import.meta.env.VITE_STORAGE_BUCKET || "omni-flow-media",
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "video/mp4",
      "video/webm",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
  },

  // Tables
  tables: {
    organizations: "organizations",
    users: "users",
    contacts: "contacts",
    messages: "messages",
    leads: "leads",
    whatsappConfigs: "whatsapp_configs",
    chatAutomations: "chat_automations",
    prospectingCampaigns: "prospecting_campaigns",
    campaignKnowledge: "campaign_knowledge",
    conversationFlows: "conversation_flows",
    conversationFlowNodes: "conversation_flow_nodes",
    conversationFlowSessions: "conversation_flow_sessions",
    webhookConfigs: "webhook_configs",
    webhookLogs: "webhook_logs",
    apiKeys: "api_keys",
    aiProviderConfigs: "ai_provider_configs",
    mediaFiles: "media_files",
    transcriptionLogs: "transcription_logs",
    ownerNotifications: "owner_notifications",
    notificationPreferences: "notification_preferences",
    notificationLogs: "notification_logs",
  },

  // RLS Policies
  rls: {
    enabled: true,
    multiTenant: true,
    organizationIdField: "organization_id",
  },

  // Logging
  logging: {
    enabled: import.meta.env.VITE_APP_DEBUG === "true",
    level: (import.meta.env.VITE_LOG_LEVEL || "info") as "debug" | "info" | "warn" | "error",
  },
};

/**
 * Validar configuração do Supabase
 */
export function validateSupabaseConfig(): boolean {
  if (!SUPABASE_CONFIG.url) {
    console.error("❌ VITE_SUPABASE_URL não está configurado");
    return false;
  }

  if (!SUPABASE_CONFIG.anonKey) {
    console.error("❌ VITE_SUPABASE_ANON_KEY não está configurado");
    return false;
  }

  console.log("✅ Configuração do Supabase validada");
  return true;
}

/**
 * Log de configuração (apenas em desenvolvimento)
 */
export function logSupabaseConfig(): void {
  if (SUPABASE_CONFIG.logging.enabled) {
    console.group("🔧 Configuração do Supabase");
    console.log("URL:", SUPABASE_CONFIG.url);
    console.log("Realtime habilitado:", SUPABASE_CONFIG.realtimeEnabled);
    console.log("Storage bucket:", SUPABASE_CONFIG.storage.bucket);
    console.log("Tabelas:", Object.keys(SUPABASE_CONFIG.tables).length);
    console.groupEnd();
  }
}
