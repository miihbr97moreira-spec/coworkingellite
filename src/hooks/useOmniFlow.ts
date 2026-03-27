import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Hook para gerenciar mensagens do Inbox
 */
export function useMessages(organizationId: string | null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;

    loadMessages();
    subscribeToMessages();
  }, [organizationId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("messages")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (err) throw err;
      setMessages(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      toast.error("Erro ao carregar mensagens");
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`messages-${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setMessages((prev) => [payload.new as any, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setMessages((prev) =>
              prev.map((m) => (m.id === payload.new.id ? payload.new : m))
            );
          } else if (payload.eventType === "DELETE") {
            setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return { messages, loading, error, refetch: loadMessages };
}

/**
 * Hook para gerenciar notificações
 */
export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    loadNotifications();
    subscribeToNotifications();
  }, [userId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("owner_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (err) throw err;

      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => !n.is_read).length);
    } catch (err: any) {
      console.error("Erro ao carregar notificações:", err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToNotifications = () => {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "owner_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as any, ...prev]);
          setUnreadCount((prev) => prev + 1);
          toast.info(payload.new.title);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from("owner_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error("Erro ao marcar como lido:", err);
    }
  };

  return { notifications, unreadCount, loading, markAsRead, refetch: loadNotifications };
}

/**
 * Hook para gerenciar contatos
 */
export function useContacts(organizationId: string | null) {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    loadContacts();
  }, [organizationId]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("contacts")
        .select("*")
        .eq("organization_id", organizationId)
        .order("updated_at", { ascending: false });

      if (err) throw err;
      setContacts(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar contatos:", err);
      toast.error("Erro ao carregar contatos");
    } finally {
      setLoading(false);
    }
  };

  return { contacts, loading, refetch: loadContacts };
}

/**
 * Hook para gerenciar automações
 */
export function useAutomations(organizationId: string | null) {
  const [automations, setAutomations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    loadAutomations();
  }, [organizationId]);

  const loadAutomations = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("chat_automations")
        .select("*")
        .eq("organization_id", organizationId)
        .order("priority", { ascending: false });

      if (err) throw err;
      setAutomations(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar automações:", err);
    } finally {
      setLoading(false);
    }
  };

  return { automations, loading, refetch: loadAutomations };
}

/**
 * Hook para gerenciar leads
 */
export function useLeads(organizationId: string | null) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) return;

    loadLeads();
  }, [organizationId]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("leads")
        .select("*, contact:contacts(*)")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (err) throw err;
      setLeads(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar leads:", err);
    } finally {
      setLoading(false);
    }
  };

  return { leads, loading, refetch: loadLeads };
}

/**
 * Hook para obter organização do usuário
 */
export function useOrganization() {
  const [organization, setOrganization] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganization();
  }, []);

  const loadOrganization = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error: err } = await supabase
        .from("organizations")
        .select("*")
        .eq("owner_id", user.id)
        .single();

      if (err) throw err;
      setOrganization(data);
    } catch (err: any) {
      console.error("Erro ao carregar organização:", err);
    } finally {
      setLoading(false);
    }
  };

  return { organization, loading, refetch: loadOrganization };
}

/**
 * Hook para enviar mensagem WhatsApp
 */
export function useSendWhatsApp() {
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (phone: string, content: string, mediaUrl?: string) => {
    try {
      setLoading(true);

      // Chamar Edge Function via Supabase
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          phone,
          content,
          media_url: mediaUrl,
        },
      });

      if (error) throw error;

      toast.success("Mensagem enviada com sucesso");
      return data;
    } catch (err: any) {
      console.error("Erro ao enviar mensagem:", err);
      toast.error("Erro ao enviar mensagem");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendMessage, loading };
}

/**
 * Hook para chamar AI Proxy
 */
export function useAIProxy() {
  const [loading, setLoading] = useState(false);

  const generateResponse = useCallback(
    async (messages: any[], provider = "groq", stream = false) => {
      try {
        setLoading(true);

        const { data, error } = await supabase.functions.invoke("ai-proxy", {
          body: {
            messages,
            provider,
            stream,
          },
        });

        if (error) throw error;

        return data;
      } catch (err: any) {
        console.error("Erro ao gerar resposta:", err);
        toast.error("Erro ao gerar resposta");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { generateResponse, loading };
}

/**
 * Hook para fazer upload de mídia
 */
export function useUploadMedia() {
  const [loading, setLoading] = useState(false);

  const uploadFile = useCallback(async (file: File, organizationId: string) => {
    try {
      setLoading(true);

      // Converter arquivo para base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });

      reader.readAsDataURL(file);
      const dataUrl = await base64Promise;
      const base64Data = dataUrl.split(",")[1];

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke("upload-media", {
        body: {
          organization_id: organizationId,
          file_name: file.name,
          file_data: base64Data,
          media_type: file.type,
        },
      });

      if (error) throw error;

      toast.success("Arquivo enviado com sucesso");
      return data;
    } catch (err: any) {
      console.error("Erro ao fazer upload:", err);
      toast.error("Erro ao fazer upload");
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { uploadFile, loading };
}
