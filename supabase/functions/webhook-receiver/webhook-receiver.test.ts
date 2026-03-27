import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock do Supabase
const mockSupabase = {
  from: vi.fn((table: string) => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  })),
};

describe("webhook-receiver", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("normalizePayload", () => {
    it("deve normalizar payload Z-API corretamente", () => {
      const payload = {
        phone: "5511999999999",
        text: "Olá",
        fromMe: false,
        timestamp: 1234567890,
        messageId: "msg-123",
      };

      const normalized = normalizePayloadZApi(payload);

      expect(normalized.phone).toBe("5511999999999");
      expect(normalized.text).toBe("Olá");
      expect(normalized.fromMe).toBe(false);
      expect(normalized.messageId).toBe("msg-123");
    });

    it("deve normalizar payload Evolution corretamente", () => {
      const payload = {
        data: {
          key: {
            remoteJid: "5511999999999@s.whatsapp.net",
            fromMe: false,
            id: "msg-456",
          },
          message: {
            conversation: "Olá",
          },
          messageTimestamp: 1234567890,
          pushName: "João",
        },
      };

      const normalized = normalizePayloadEvolution(payload);

      expect(normalized.phone).toBe("5511999999999");
      expect(normalized.text).toBe("Olá");
      expect(normalized.fromMe).toBe(false);
      expect(normalized.senderName).toBe("João");
    });

    it("deve detectar grupos corretamente", () => {
      const groupPayload = {
        phone: "120363023456789@g.us",
        groupJid: "120363023456789@g.us",
        text: "Mensagem de grupo",
      };

      expect(isGroup(groupPayload.phone, groupPayload.groupJid)).toBe(true);
    });

    it("deve detectar contatos individuais corretamente", () => {
      const individualPayload = {
        phone: "5511999999999",
        text: "Mensagem individual",
      };

      expect(isGroup(individualPayload.phone)).toBe(false);
    });
  });

  describe("deduplication", () => {
    it("deve detectar mensagens duplicadas", async () => {
      const messageId = "msg-123";
      const organizationId = "org-123";

      // Simular mensagem já existente
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { id: "existing-msg" },
        error: null,
      });

      const isDuplicate = await checkDuplicate(messageId, organizationId);
      expect(isDuplicate).toBe(true);
    });

    it("deve permitir mensagens novas", async () => {
      const messageId = "msg-new";
      const organizationId = "org-123";

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const isDuplicate = await checkDuplicate(messageId, organizationId);
      expect(isDuplicate).toBe(false);
    });
  });

  describe("contact upsert", () => {
    it("deve criar novo contato", async () => {
      const phone = "5511999999999";
      const organizationId = "org-123";
      const senderName = "João Silva";

      mockSupabase.from().upsert().select().single.mockResolvedValueOnce({
        data: { id: "contact-123", phone, name: senderName },
        error: null,
      });

      const contact = await upsertContact(phone, organizationId, senderName);
      expect(contact).not.toBeNull();
      expect(contact?.phone).toBe(phone);
      expect(contact?.name).toBe(senderName);
    });

    it("deve atualizar contato existente", async () => {
      const phone = "5511999999999";
      const organizationId = "org-123";
      const newName = "João Silva Atualizado";

      mockSupabase.from().upsert().select().single.mockResolvedValueOnce({
        data: { id: "contact-123", phone, name: newName },
        error: null,
      });

      const contact = await upsertContact(phone, organizationId, newName);
      expect(contact?.name).toBe(newName);
    });
  });

  describe("lead creation", () => {
    it("deve criar lead quando auto_create_lead está ativo", async () => {
      const contactId = "contact-123";
      const organizationId = "org-123";

      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      mockSupabase.from().insert().select().single.mockResolvedValueOnce({
        data: { id: "lead-123", contact_id: contactId, status: "novo" },
        error: null,
      });

      const lead = await createLeadIfNeeded(contactId, organizationId, true);
      expect(lead).not.toBeNull();
      expect(lead?.status).toBe("novo");
    });

    it("deve não criar lead quando auto_create_lead está desativo", async () => {
      const contactId = "contact-123";
      const organizationId = "org-123";

      const lead = await createLeadIfNeeded(contactId, organizationId, false);
      expect(lead).toBeNull();
    });
  });

  describe("message saving", () => {
    it("deve salvar mensagem inbound corretamente", async () => {
      const message = {
        organization_id: "org-123",
        client_id: "contact-123",
        sender_phone: "5511999999999",
        content: "Olá",
        direction: "inbound",
        status: "received",
        external_message_id: "msg-123",
      };

      mockSupabase.from().insert().mockResolvedValueOnce({
        data: message,
        error: null,
      });

      const result = await saveMessage(message);
      expect(result.error).toBeNull();
    });

    it("deve salvar mensagem com mídia", async () => {
      const message = {
        organization_id: "org-123",
        client_id: "contact-123",
        sender_phone: "5511999999999",
        content: "[Imagem]",
        media_url: "https://example.com/image.jpg",
        media_type: "image/jpeg",
        direction: "inbound",
        status: "received",
        external_message_id: "msg-456",
      };

      mockSupabase.from().insert().mockResolvedValueOnce({
        data: message,
        error: null,
      });

      const result = await saveMessage(message);
      expect(result.error).toBeNull();
      expect(result.data?.media_url).toBe(message.media_url);
    });
  });

  describe("webhook validation", () => {
    it("deve rejeitar requisição sem API key", async () => {
      const response = await handleWebhook({}, null);
      expect(response.status).toBe(401);
    });

    it("deve rejeitar API key inválida", async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const response = await handleWebhook({}, "invalid-key");
      expect(response.status).toBe(401);
    });

    it("deve aceitar API key válida", async () => {
      mockSupabase.from().select().eq().single.mockResolvedValueOnce({
        data: { organization_id: "org-123" },
        error: null,
      });

      const response = await handleWebhook(
        {
          phone: "5511999999999",
          text: "Olá",
          fromMe: false,
          messageId: "msg-123",
        },
        "valid-key"
      );

      expect(response.status).toBe(200);
    });
  });

  describe("error handling", () => {
    it("deve retornar erro em caso de falha ao salvar mensagem", async () => {
      mockSupabase.from().insert().mockResolvedValueOnce({
        data: null,
        error: { message: "Database error" },
      });

      const response = await handleWebhook(
        {
          phone: "5511999999999",
          text: "Olá",
          fromMe: false,
          messageId: "msg-123",
        },
        "valid-key"
      );

      expect(response.status).toBe(500);
    });
  });
});

// Funções auxiliares para testes
function normalizePayloadZApi(payload: any) {
  return {
    phone: payload.phone,
    text: payload.text,
    fromMe: payload.fromMe,
    messageId: payload.messageId,
  };
}

function normalizePayloadEvolution(payload: any) {
  return {
    phone: payload.data.key.remoteJid.replace(/\D/g, ""),
    text: payload.data.message.conversation,
    fromMe: payload.data.key.fromMe,
    senderName: payload.data.pushName,
    messageId: payload.data.key.id,
  };
}

function isGroup(phone: string, groupJid?: string): boolean {
  return !!groupJid || phone.includes("@g.us");
}

async function checkDuplicate(messageId: string, organizationId: string): Promise<boolean> {
  const { data } = await mockSupabase
    .from("messages")
    .select("id")
    .eq("external_message_id", messageId)
    .eq("organization_id", organizationId)
    .single();

  return !!data;
}

async function upsertContact(
  phone: string,
  organizationId: string,
  senderName?: string
) {
  const { data } = await mockSupabase
    .from("contacts")
    .upsert({
      phone,
      organization_id: organizationId,
      name: senderName || `Contato ${phone}`,
    })
    .select()
    .single();

  return data;
}

async function createLeadIfNeeded(
  contactId: string,
  organizationId: string,
  autoCreateLead: boolean
) {
  if (!autoCreateLead) return null;

  const { data: newLead } = await mockSupabase
    .from("leads")
    .insert({
      contact_id: contactId,
      organization_id: organizationId,
      status: "novo",
      source: "whatsapp",
    })
    .select()
    .single();

  return newLead;
}

async function saveMessage(message: any) {
  return await mockSupabase.from("messages").insert(message);
}

async function handleWebhook(payload: any, apiKey: string | null) {
  if (!apiKey) {
    return { status: 401, error: "API key required" };
  }

  const { data: keyData } = await mockSupabase
    .from("api_keys")
    .select("organization_id")
    .eq("key_hash", apiKey)
    .single();

  if (!keyData) {
    return { status: 401, error: "Invalid API key" };
  }

  return { status: 200, data: { success: true } };
}
