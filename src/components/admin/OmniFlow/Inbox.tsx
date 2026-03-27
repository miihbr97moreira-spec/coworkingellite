import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useInbox } from "./inbox/useInbox";
import ConversationList from "./inbox/ConversationList";
import ChatArea from "./inbox/ChatArea";
import ChatSidebar from "./inbox/ChatSidebar";
import TooltipHelp from "@/components/ui/tooltip-help";

interface InboxProps {
  onBack: () => void;
}

const Inbox: React.FC<InboxProps> = ({ onBack }) => {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("organizations")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (data) {
          setOrganizationId(data.id);
        }
      } catch (err) {
        console.error("Erro ao carregar organização:", err);
        toast.error("Erro ao carregar dados da organização");
      } finally {
        setLoadingOrg(false);
      }
    };

    loadOrganization();
  }, []);

  const inbox = useInbox(organizationId || "");

  const selectedConversation = inbox.conversations.find(
    (c) => c.client_id === inbox.selectedClientId
  );

  if (loadingOrg) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#D97757]" />
      </div>
    );
  }

  if (!organizationId) {
    return (
      <div className="space-y-4">
        <Button onClick={onBack} variant="ghost" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhuma organização encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={onBack} variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#D97757]/20 to-[#D97757]/10 border border-[#D97757]/30">
                <MessageCircle className="w-6 h-6 text-[#D97757]" />
              </div>
              Omni Inbox
              <TooltipHelp content="Gerenciador de conversas WhatsApp com layout 3 colunas (estilo Kommo). Suporta filtros, automações e notas internas." />
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie todas as suas conversas em um único lugar
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={() => setShowSidebar(!showSidebar)}
          className="hidden lg:flex gap-2"
        >
          {showSidebar ? "Ocultar" : "Mostrar"} Contexto
        </Button>
      </div>

      {/* Layout 3 Colunas */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-200px)] rounded-lg overflow-hidden border border-border/50 bg-background"
      >
        {/* Coluna 1: Lista de Conversas (340px) */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className={`${isMobile && inbox.selectedClientId ? "hidden" : "col-span-1"} border-r border-border/50`}
        >
          <ConversationList
            conversations={inbox.conversations}
            selectedClientId={inbox.selectedClientId}
            loading={inbox.loading}
            onSelectConversation={inbox.setSelectedClientId}
            onDeleteConversation={inbox.deleteConversation}
            onPinConversation={inbox.pinConversation}
            onMarkAsRead={inbox.markAsRead}
            onMarkAsUnread={inbox.markAsUnread}
          />
        </motion.div>

        {/* Coluna 2: Área de Chat (flex) */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`${isMobile && !inbox.selectedClientId ? "hidden" : "col-span-1"} lg:col-span-2 flex flex-col`}
        >
          <ChatArea
            messages={inbox.messages}
            selectedClientId={inbox.selectedClientId}
            whatsAppActive={inbox.whatsAppActive}
            sending={inbox.sending}
            onSendMessage={inbox.sendMessage}
            onFetchMoreMessages={inbox.fetchMoreMessages}
            hasMoreMessages={inbox.hasMoreMessages}
          />
        </motion.div>

        {/* Coluna 3: Contexto do Lead (288px) */}
        <AnimatePresence>
          {showSidebar && !isMobile && (
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ delay: 0.3 }}
              className="col-span-1 border-l border-border/50"
            >
              <ChatSidebar
                conversation={selectedConversation || null}
                onClose={() => setShowSidebar(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sidebar Mobile */}
        <AnimatePresence>
          {showSidebar && isMobile && inbox.selectedClientId && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed inset-0 z-50 bg-background"
            >
              <ChatSidebar
                conversation={selectedConversation || null}
                onClose={() => setShowSidebar(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Status Bar */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-4 py-2 bg-muted/30 rounded-lg">
        <div className="flex items-center gap-4">
          <span>
            {inbox.conversations.length} conversa{inbox.conversations.length !== 1 ? "s" : ""}
          </span>
          <span>
            {inbox.conversations.reduce((acc, c) => acc + c.unread_count, 0)} não lida
            {inbox.conversations.reduce((acc, c) => acc + c.unread_count, 0) !== 1 ? "s" : ""}
          </span>
        </div>
        <span className={inbox.whatsAppActive ? "text-green-600" : "text-amber-600"}>
          {inbox.whatsAppActive ? "✓ WhatsApp Ativo" : "○ WhatsApp Inativo"}
        </span>
      </div>
    </div>
  );
};

export default Inbox;
