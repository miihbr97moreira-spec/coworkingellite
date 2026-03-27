import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Conversation {
  id: string;
  client_id: string;
  contact_name: string;
  contact_phone: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_group: boolean;
  group_jid?: string;
  is_pinned: boolean;
  is_marked_unread: boolean;
  avatar_url?: string;
  behavior_tag?: string;
}

export interface Message {
  id: string;
  client_id: string;
  sender_phone: string;
  sender_name: string;
  content: string;
  media_url?: string;
  media_type?: string;
  direction: "inbound" | "outbound" | "internal";
  status: string;
  created_at: string;
  is_group: boolean;
}

interface UseInboxReturn {
  conversations: Conversation[];
  messages: Message[];
  selectedClientId: string | null;
  whatsAppActive: boolean;
  hasMoreMessages: boolean;
  loading: boolean;
  sending: boolean;
  setSelectedClientId: (id: string | null) => void;
  sendMessage: (content: string, mediaUrl?: string, mediaType?: string) => Promise<void>;
  fetchMoreMessages: () => Promise<void>;
  deleteConversation: (clientId: string) => Promise<void>;
  pinConversation: (clientId: string, isPinned: boolean) => Promise<void>;
  markAsRead: (clientId: string) => Promise<void>;
  markAsUnread: (clientId: string) => Promise<void>;
}

export const useInbox = (organizationId: string): UseInboxReturn => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [whatsAppActive, setWhatsAppActive] = useState(true);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageOffset, setMessageOffset] = useState(0);
  const messagesPerPage = 50;
  const subscriptionRef = useRef<any>(null);

  // Carregar status do WhatsApp
  useEffect(() => {
    const checkWhatsAppStatus = async () => {
      try {
        const { data } = await supabase
          .from("whatsapp_configs")
          .select("is_active")
          .eq("organization_id", organizationId)
          .eq("is_active", true)
          .single();

        setWhatsAppActive(!!data);
      } catch (err) {
        console.error("Erro ao verificar WhatsApp:", err);
        setWhatsAppActive(false);
      }
    };

    checkWhatsAppStatus();
  }, [organizationId]);

  // Carregar conversas
  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar todas as mensagens
      const { data: allMessages, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (messagesError) throw messagesError;

      // Buscar preferências do usuário
      const { data: prefs } = await supabase
        .from("conversation_preferences")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("user_id", user.id);

      // Agrupar mensagens por cliente
      const conversationMap = new Map<string, Message[]>();
      const clientsMap = new Map<string, any>();

      for (const msg of allMessages || []) {
        const key = msg.is_group ? `group_${msg.group_jid}` : msg.client_id;

        if (!conversationMap.has(key)) {
          conversationMap.set(key, []);
        }
        conversationMap.get(key)!.push(msg);

        // Carregar dados do contato
        if (!clientsMap.has(msg.client_id) && msg.client_id) {
          const { data: contact } = await supabase
            .from("contacts")
            .select("*")
            .eq("id", msg.client_id)
            .single();

          if (contact) {
            clientsMap.set(msg.client_id, contact);
          }
        }
      }

      // Construir conversas
      const convs: Conversation[] = [];

      for (const [key, msgs] of conversationMap) {
        const lastMsg = msgs[0];
        const pref = prefs?.find((p) => p.client_id === lastMsg.client_id);
        const contact = clientsMap.get(lastMsg.client_id);

        const unreadCount = msgs.filter(
          (m) => m.direction === "inbound" && m.status !== "read"
        ).length;

        convs.push({
          id: key,
          client_id: lastMsg.client_id,
          contact_name: contact?.name || lastMsg.sender_name || "Desconhecido",
          contact_phone: lastMsg.sender_phone,
          last_message: lastMsg.content?.substring(0, 100) || "[Mídia]",
          last_message_time: lastMsg.created_at,
          unread_count: unreadCount + (pref?.is_marked_unread ? 1 : 0),
          is_group: lastMsg.is_group || false,
          group_jid: lastMsg.group_jid,
          is_pinned: pref?.is_pinned || false,
          is_marked_unread: pref?.is_marked_unread || false,
          avatar_url: contact?.avatar_url,
          behavior_tag: contact?.behavior_tag,
        });
      }

      // Ordenar: fixados primeiro, depois mais recentes
      convs.sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
      });

      setConversations(convs);
    } catch (err) {
      console.error("Erro ao carregar conversas:", err);
      toast.error("Erro ao carregar conversas");
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  // Carregar mensagens da conversa selecionada
  const fetchMessages = useCallback(async (clientId: string, offset: number = 0) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("client_id", clientId)
        .order("created_at", { ascending: false })
        .range(offset, offset + messagesPerPage - 1);

      if (error) throw error;

      const msgs = (data || []).reverse();

      if (offset === 0) {
        setMessages(msgs);
        // Marcar como lidas
        await supabase
          .from("messages")
          .update({ status: "read" })
          .eq("client_id", clientId)
          .eq("direction", "inbound");
      } else {
        setMessages((prev) => [...msgs, ...prev]);
      }

      setHasMoreMessages((data || []).length === messagesPerPage);
      setMessageOffset(offset + messagesPerPage);
    } catch (err) {
      console.error("Erro ao carregar mensagens:", err);
      toast.error("Erro ao carregar mensagens");
    }
  }, [organizationId]);

  // Enviar mensagem
  const sendMessage = useCallback(
    async (content: string, mediaUrl?: string, mediaType?: string) => {
      if (!selectedClientId) {
        toast.error("Selecione uma conversa");
        return;
      }

      setSending(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        // Buscar contato
        const { data: contact } = await supabase
          .from("contacts")
          .select("phone")
          .eq("id", selectedClientId)
          .single();

        if (!contact?.phone) throw new Error("Telefone do contato não encontrado");

        // Invocar Edge Function para enviar
        const { data, error } = await supabase.functions.invoke("send-whatsapp", {
          body: {
            phone: contact.phone,
            content,
            media_url: mediaUrl,
            media_type: mediaType,
          },
        });

        if (error) throw error;

        // Adicionar mensagem ao estado local
        const newMessage: Message = {
          id: Math.random().toString(),
          client_id: selectedClientId,
          sender_phone: "",
          sender_name: "Você",
          content,
          media_url: mediaUrl,
          media_type: mediaType,
          direction: "outbound",
          status: data?.external_sent ? "delivered" : "pending",
          created_at: new Date().toISOString(),
          is_group: false,
        };

        setMessages((prev) => [...prev, newMessage]);
        toast.success("✓ Mensagem enviada");
      } catch (err: any) {
        console.error("Erro ao enviar:", err);
        toast.error(err.message || "Erro ao enviar mensagem");
      } finally {
        setSending(false);
      }
    },
    [selectedClientId]
  );

  // Carregar mais mensagens (scroll up)
  const fetchMoreMessages = useCallback(async () => {
    if (!selectedClientId || !hasMoreMessages) return;
    await fetchMessages(selectedClientId, messageOffset);
  }, [selectedClientId, hasMoreMessages, messageOffset, fetchMessages]);

  // Deletar conversa
  const deleteConversation = useCallback(async (clientId: string) => {
    try {
      await supabase.from("messages").delete().eq("client_id", clientId);

      setConversations((prev) => prev.filter((c) => c.client_id !== clientId));
      if (selectedClientId === clientId) {
        setSelectedClientId(null);
        setMessages([]);
      }

      toast.success("✓ Conversa deletada");
    } catch (err: any) {
      console.error("Erro ao deletar:", err);
      toast.error(err.message || "Erro ao deletar");
    }
  }, [selectedClientId]);

  // Fixar conversa
  const pinConversation = useCallback(async (clientId: string, isPinned: boolean) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      await supabase
        .from("conversation_preferences")
        .upsert({
          organization_id: organizationId,
          user_id: user.id,
          client_id: clientId,
          is_pinned: !isPinned,
        });

      setConversations((prev) =>
        prev.map((c) =>
          c.client_id === clientId ? { ...c, is_pinned: !isPinned } : c
        )
      );

      toast.success(isPinned ? "✓ Desafixado" : "✓ Afixado");
    } catch (err: any) {
      console.error("Erro ao fixar:", err);
      toast.error(err.message || "Erro ao fixar");
    }
  }, [organizationId]);

  // Marcar como lido
  const markAsRead = useCallback(async (clientId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      await supabase
        .from("conversation_preferences")
        .upsert({
          organization_id: organizationId,
          user_id: user.id,
          client_id: clientId,
          is_marked_unread: false,
        });

      setConversations((prev) =>
        prev.map((c) =>
          c.client_id === clientId ? { ...c, is_marked_unread: false, unread_count: 0 } : c
        )
      );
    } catch (err: any) {
      console.error("Erro ao marcar como lido:", err);
    }
  }, [organizationId]);

  // Marcar como não lido
  const markAsUnread = useCallback(async (clientId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      await supabase
        .from("conversation_preferences")
        .upsert({
          organization_id: organizationId,
          user_id: user.id,
          client_id: clientId,
          is_marked_unread: true,
        });

      setConversations((prev) =>
        prev.map((c) =>
          c.client_id === clientId ? { ...c, is_marked_unread: true, unread_count: 1 } : c
        )
      );
    } catch (err: any) {
      console.error("Erro ao marcar como não lido:", err);
    }
  }, [organizationId]);

  // Efeito: Carregar conversas ao montar
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Efeito: Carregar mensagens ao selecionar conversa
  useEffect(() => {
    if (selectedClientId) {
      setMessageOffset(0);
      fetchMessages(selectedClientId, 0);
    }
  }, [selectedClientId, fetchMessages]);

  // Efeito: Realtime subscription para novas mensagens
  useEffect(() => {
    const channel = supabase
      .channel(`inbox-messages-${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `organization_id=eq.${organizationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;

          // Adicionar à lista de mensagens se for da conversa selecionada
          if (newMsg.client_id === selectedClientId) {
            setMessages((prev) => [...prev, newMsg]);
          }

          // Atualizar lista de conversas
          setConversations((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((c) => c.client_id === newMsg.client_id);

            if (idx >= 0) {
              updated[idx] = {
                ...updated[idx],
                last_message: newMsg.content?.substring(0, 100) || "[Mídia]",
                last_message_time: newMsg.created_at,
                unread_count:
                  newMsg.direction === "inbound"
                    ? updated[idx].unread_count + 1
                    : updated[idx].unread_count,
              };
            }

            return updated.sort((a, b) => {
              if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
              return (
                new Date(b.last_message_time).getTime() -
                new Date(a.last_message_time).getTime()
              );
            });
          });
        }
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [organizationId, selectedClientId]);

  return {
    conversations,
    messages,
    selectedClientId,
    whatsAppActive,
    hasMoreMessages,
    loading,
    sending,
    setSelectedClientId,
    sendMessage,
    fetchMoreMessages,
    deleteConversation,
    pinConversation,
    markAsRead,
    markAsUnread,
  };
};
