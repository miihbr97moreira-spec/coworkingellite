import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  MessageCircle, Webhook, Brain, ChevronRight, Loader2, AlertCircle,
  CheckCircle2, Circle, Settings2, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import OmniFlowWhatsApp from "./OmniFlow/OmniFlowWhatsApp";
import OmniFlowWebhooks from "./OmniFlow/OmniFlowWebhooks";
import OmniFlowAgent from "./OmniFlow/OmniFlowAgent";
import Integrations from "@/pages/Integrations";

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

      const { data: zapiData } = await supabase
        .from("whatsapp_configs" as any)
        .select("id")
        .eq("tenant_id", user.id)
        .limit(1);

      const { data: webhookData } = await supabase
        .from("webhook_configs" as any)
        .select("is_active")
        .eq("tenant_id", user.id)
        .limit(1);

      const { data: agentData } = await supabase
        .from("api_keys" as any)
        .select("id")
        .eq("tenant_id", user.id)
        .limit(1);

      setStatus({
        whatsapp: zapiData?.length ? "connected" : "disconnected",
        webhooks: webhookData?.length ? "active" : "inactive",
        agent: agentData?.length ? "configured" : "unconfigured",
      });
    } catch (err) {
      console.error("Erro ao carregar status:", err);
    } finally {
      setLoading(false);
    }
  };

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

  if (activeModule === "integrations") {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => setActiveModule(null)} className="mb-4 text-slate-400">
          <ChevronRight className="w-4 h-4 mr-2 rotate-180" /> Voltar ao Dashboard
        </Button>
        <Integrations />
      </div>
    );
  }

  return (
    <div ref={ref} className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-[#D97757]/20 to-orange-500/20 border border-[#D97757]/30">
            <Zap className="w-6 h-6 text-[#D97757]" />
          </div>
          Omni Flow Hub
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Hub central de integrações bidirecionais. Conecte WhatsApp, configure webhooks e ative sua IA.
        </p>
      </div>

      {/* Hero Card - NOVO HUB */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group relative overflow-hidden rounded-2xl border border-[#D97757]/30 bg-gradient-to-br from-[#D97757]/20 to-slate-900 backdrop-blur-sm p-8 cursor-pointer hover:shadow-2xl transition-all"
        onClick={() => setActiveModule("integrations")}
      >
        <div className="absolute top-0 right-0 p-4">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-[#D97757] text-white animate-pulse">
            NOVO HUB ATIVO
          </span>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="p-6 rounded-2xl bg-slate-950/50 border border-[#D97757]/20">
            <Zap className="w-12 h-12 text-[#D97757]" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-white mb-2">Acessar Hub de Integrações Completo</h2>
            <p className="text-slate-400 mb-6">Gerencie WhatsApp, Automações, Webhooks, Logs, Playbooks, Agentes IA, Fluxos Visuais e API Keys em um único lugar.</p>
            <Button className="bg-[#D97757] hover:bg-[#c86647] text-white px-8 py-6 text-lg font-bold rounded-xl shadow-lg shadow-[#D97757]/20">
              Entrar no Omni Flow Hub
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Mini Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4">
            <MessageCircle className="w-5 h-5 text-green-500" />
            <h3 className="font-bold text-white">WhatsApp</h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">Status: {status.whatsapp === "connected" ? "✅ Conectado" : "❌ Desconectado"}</p>
          <Button variant="outline" size="sm" className="w-full border-slate-700" onClick={() => setActiveModule("whatsapp")}>Gerenciar</Button>
        </div>
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4">
            <Webhook className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-white">Webhooks</h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">Status: {status.webhooks === "active" ? "✅ Ativo" : "❌ Inativo"}</p>
          <Button variant="outline" size="sm" className="w-full border-slate-700" onClick={() => setActiveModule("webhooks")}>Gerenciar</Button>
        </div>
        <div className="p-6 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-5 h-5 text-purple-500" />
            <h3 className="font-bold text-white">Agentes IA</h3>
          </div>
          <p className="text-sm text-slate-400 mb-4">Status: {status.agent === "configured" ? "✅ Configurado" : "❌ Sem Chaves"}</p>
          <Button variant="outline" size="sm" className="w-full border-slate-700" onClick={() => setActiveModule("agent")}>Gerenciar</Button>
        </div>
      </div>
    </div>
  );
});

OmniFlow.displayName = "OmniFlow";
export default OmniFlow;
