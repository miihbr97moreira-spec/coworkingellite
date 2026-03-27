import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  MessageSquare,
  Zap,
  Brain,
  GitBranch,
  Key,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import WhatsAppConfigTab from "./tabs/WhatsAppConfigTab";
import ChatAutomationsTab from "./tabs/ChatAutomationsTab";
import AgentLibraryTab from "./tabs/AgentLibraryTab";
import ConversationFlowsTab from "./tabs/ConversationFlowsTab";
import AIProviderSettings from "./tabs/AIProviderSettings";
import WebhooksTab from "./tabs/WebhooksTab";
import TooltipHelp from "@/components/ui/tooltip-help";

interface IntegrationsProps {
  onBack: () => void;
}

const Integrations: React.FC<IntegrationsProps> = ({ onBack }) => {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
      }
    };

    loadOrganization();
  }, []);

  if (loading) {
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button onClick={onBack} variant="ghost" size="icon">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#D97757]/20 to-[#D97757]/10 border border-[#D97757]/30">
              <Zap className="w-6 h-6 text-[#D97757]" />
            </div>
            Hub de Integrações
            <TooltipHelp content="Configure todos os seus provedores, automações, agentes IA, fluxos e webhooks em um único lugar." />
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Centralize suas integrações com WhatsApp, IA e automações
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-lg border border-border/50 bg-background overflow-hidden">
        <Tabs defaultValue="whatsapp" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b border-border/50 bg-muted/30 p-0 h-auto">
            <TabsTrigger
              value="whatsapp"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D97757] data-[state=active]:bg-transparent"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger
              value="automations"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D97757] data-[state=active]:bg-transparent"
            >
              <Zap className="w-4 h-4 mr-2" />
              Automações
            </TabsTrigger>
            <TabsTrigger
              value="agents"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D97757] data-[state=active]:bg-transparent"
            >
              <Brain className="w-4 h-4 mr-2" />
              Agentes IA
            </TabsTrigger>
            <TabsTrigger
              value="flows"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D97757] data-[state=active]:bg-transparent"
            >
              <GitBranch className="w-4 h-4 mr-2" />
              Fluxos
            </TabsTrigger>
            <TabsTrigger
              value="ai-keys"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D97757] data-[state=active]:bg-transparent"
            >
              <Key className="w-4 h-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger
              value="webhooks"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#D97757] data-[state=active]:bg-transparent"
            >
              <Webhook className="w-4 h-4 mr-2" />
              Webhooks
            </TabsTrigger>
          </TabsList>

          {/* Conteúdo das Abas */}
          <div className="p-6">
            <TabsContent value="whatsapp" className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <WhatsAppConfigTab organizationId={organizationId} />
              </motion.div>
            </TabsContent>

            <TabsContent value="automations" className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <ChatAutomationsTab organizationId={organizationId} />
              </motion.div>
            </TabsContent>

            <TabsContent value="agents" className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <AgentLibraryTab organizationId={organizationId} />
              </motion.div>
            </TabsContent>

            <TabsContent value="flows" className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <ConversationFlowsTab organizationId={organizationId} />
              </motion.div>
            </TabsContent>

            <TabsContent value="ai-keys" className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <AIProviderSettings organizationId={organizationId} />
              </motion.div>
            </TabsContent>

            <TabsContent value="webhooks" className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <WebhooksTab organizationId={organizationId} />
              </motion.div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </motion.div>
  );
};

export default Integrations;
