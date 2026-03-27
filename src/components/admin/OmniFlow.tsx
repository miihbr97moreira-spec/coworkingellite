import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle, Webhook, Brain, ChevronRight, Loader2, AlertCircle,
  CheckCircle2, Circle, Settings2, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import OmniFlowWhatsApp from "./OmniFlow/OmniFlowWhatsApp";
import OmniFlowWebhooks from "./OmniFlow/OmniFlowWebhooks";
import OmniFlowAgent from "./OmniFlow/OmniFlowAgent";
import OmniFlowBuilder from "./OmniFlow/OmniFlowBuilder";
import TooltipHelp from "@/components/ui/tooltip-help";

interface IntegrationStatus {
  whatsapp: "connected" | "disconnected" | "connecting";
  webhooks: "active" | "inactive";
  agent: "configured" | "unconfigured";
}

const OmniFlow = React.forwardRef<HTMLDivElement>((_, ref) => {
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [status, setStatus] = useState<IntegrationStatus>({
    whatsapp: "disconnected",
    webhooks: "inactive",
    agent: "unconfigured",
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIntegrationStatus();
  }, []);

  const loadIntegrationStatus = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Verificar Z-API
      const { data: zapiData } = await supabase
        .from("zapi_instances")
        .select("connection_status")
        .eq("tenant_id", user.id)
        .single();

      // Verificar Webhooks
      const { data: webhookData } = await supabase
        .from("webhook_endpoints")
        .select("is_active")
        .eq("tenant_id", user.id)
        .single();

      // Verificar Omni Agent
      const { data: agentData } = await supabase
        .from("omni_agent_config")
        .select("ai_api_key")
        .eq("tenant_id", user.id)
        .single();

      setStatus({
        whatsapp: (zapiData?.connection_status as any) || "disconnected",
        webhooks: webhookData?.is_active ? "active" : "inactive",
        agent: agentData?.ai_api_key ? "configured" : "unconfigured",
      });
    } catch (err) {
      console.error("Erro ao carregar status:", err);
    } finally {
      setLoading(false);
    }
  };

  const integrations = [
    {
      id: "whatsapp",
      title: "WhatsApp (Z-API)",
      description: "Conecte seu número do WhatsApp para automações",
      icon: MessageCircle,
      status: status.whatsapp,
      color: "from-green-500/20 to-emerald-500/20",
      borderColor: "border-green-500/30",
      statusColor: status.whatsapp === "connected" ? "text-green-500" : "text-amber-500",
    },
    {
      id: "webhooks",
      title: "Webhooks",
      description: "Receba eventos em tempo real via webhook",
      icon: Webhook,
      status: status.webhooks,
      color: "from-blue-500/20 to-cyan-500/20",
      borderColor: "border-blue-500/30",
      statusColor: status.webhooks === "active" ? "text-blue-500" : "text-muted-foreground",
    },
    {
      id: "agent",
      title: "Omni Agent (IA)",
      description: "Configure sua IA para respostas automáticas",
      icon: Brain,
      status: status.agent,
      color: "from-purple-500/20 to-pink-500/20",
      borderColor: "border-purple-500/30",
      statusColor: status.agent === "configured" ? "text-purple-500" : "text-muted-foreground",
    },
  ];

  if (loading) {
    return (
      <div ref={ref} className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (activeModule === "whatsapp") {
    return <OmniFlowWhatsApp onBack={() => { setActiveModule(null); loadIntegrationStatus(); }} />;
  }

  if (activeModule === "webhooks") {
    return <OmniFlowWebhooks onBack={() => { setActiveModule(null); loadIntegrationStatus(); }} />;
  }

  if (activeModule === "agent") {
    return <OmniFlowAgent onBack={() => { setActiveModule(null); loadIntegrationStatus(); }} />;
  }

  if (activeModule === "builder") {
    return <OmniFlowBuilder onBack={() => { setActiveModule(null); loadIntegrationStatus(); }} />;
  }

  return (
    <div ref={ref} className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30">
            <Settings2 className="w-6 h-6 text-amber-600" />
          </div>
          Omni Flow
          <TooltipHelp content="Hub central para gerenciar integrações (WhatsApp, Webhooks) e criar automações com IA. Tudo isolado e seguro por tenant." />
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Hub central de integrações e automações para seu projeto. Conecte WhatsApp, configure webhooks e ative sua IA.
        </p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-3 gap-4">
        {integrations.map((integration) => (
          <motion.div
            key={integration.id}
            whileHover={{ scale: 1.02 }}
            className={`p-4 rounded-lg border ${integration.borderColor} bg-gradient-to-br ${integration.color} backdrop-blur-sm`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-background/50">
                  <integration.icon className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold">{integration.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {integration.status === "connected" || integration.status === "active" || integration.status === "configured"
                      ? "✓ Ativo"
                      : "○ Inativo"}
                  </p>
                </div>
              </div>
              <Circle className={`w-3 h-3 ${integration.statusColor} fill-current`} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bento Grid - Integration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-max">
        {integrations.map((integration, idx) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`group relative overflow-hidden rounded-2xl border ${integration.borderColor} bg-gradient-to-br ${integration.color} backdrop-blur-sm p-6 cursor-pointer hover:shadow-lg transition-all ${
              idx === 1 ? "md:col-span-1 md:row-span-2" : ""
            }`}
            onClick={() => setActiveModule(integration.id)}
          >
            {/* Background Gradient Accent */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-background/50 group-hover:bg-background/70 transition-colors">
                  <integration.icon className="w-6 h-6 text-foreground" />
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  integration.status === "connected" || integration.status === "active" || integration.status === "configured"
                    ? "bg-green-500/20 text-green-700 border border-green-500/30"
                    : "bg-muted text-muted-foreground border border-border/50"
                }`}>
                  {integration.status === "connected" || integration.status === "active" || integration.status === "configured" ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Ativo
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3 h-3" />
                      Inativo
                    </>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-bold mb-2">{integration.title}</h3>
              <p className="text-sm text-muted-foreground mb-6 flex-1">{integration.description}</p>

              {/* CTA Button */}
              <Button
                className="w-full gap-2 group/btn"
                variant={integration.status === "connected" || integration.status === "active" || integration.status === "configured" ? "outline" : "default"}
              >
                {integration.status === "connected" || integration.status === "active" || integration.status === "configured" ? "Gerenciar" : "Conectar"}
                <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </Button>
            </div>
          </motion.div>
        ))}

        {/* Flow Builder Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="group relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm p-6 cursor-pointer hover:shadow-lg transition-all"
          onClick={() => setActiveModule("builder")}
        >
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" />
          </div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-xl bg-background/50 group-hover:bg-background/70 transition-colors">
                <Zap className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-700 border border-amber-500/30">
                <CheckCircle2 className="w-3 h-3" />
                Ativo
              </div>
            </div>

            <h3 className="text-lg font-bold mb-2">Flow Builder</h3>
            <p className="text-sm text-muted-foreground mb-6 flex-1">Crie automações conectando gatilhos e ações</p>

            <Button
              className="w-full gap-2 group/btn"
              variant="default"
            >
              Abrir Builder
              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Info Section */}
      <div className="rounded-xl border border-border/40 bg-secondary/20 p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          Documentação e Suporte
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Precisa de ajuda para configurar suas integrações? Consulte nossa documentação completa ou entre em contato com o suporte.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" size="sm">
            Documentação
          </Button>
          <Button variant="outline" size="sm">
            Suporte
          </Button>
        </div>
      </div>
    </div>
  );
});

OmniFlow.displayName = "OmniFlow";
export default OmniFlow;
