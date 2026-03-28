import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, MessageCircle, Loader2, AlertCircle, CheckCircle2,
  Smartphone, Battery, User, LogOut, Plus, Copy, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface OmniFlowWhatsAppProps {
  onBack: () => void;
}

const OmniFlowWhatsApp: React.FC<OmniFlowWhatsAppProps> = ({ onBack }) => {
  const [instance, setInstance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [showQRSkeleton, setShowQRSkeleton] = useState(false);

  useEffect(() => {
    loadInstance();
  }, []);

  const loadInstance = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await (supabase
        .from("zapi_instances" as any)
        .select("*")
        .eq("tenant_id", user.id) as any)
        .single();

      setInstance(data);
    } catch (err) {
      console.error("Erro ao carregar instância:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectNumber = async () => {
    setConnecting(true);
    setShowQRSkeleton(true);

    try {
      // Simular geração de QR Code (em produção, seria uma chamada à Z-API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Simular QR Code
      setQrCode("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23fff' width='200' height='200'/%3E%3Crect fill='%23000' x='10' y='10' width='30' height='30'/%3E%3Crect fill='%23000' x='160' y='10' width='30' height='30'/%3E%3Crect fill='%23000' x='10' y='160' width='30' height='30'/%3E%3C/svg%3E");
      setShowQRSkeleton(false);
      toast.success("QR Code gerado! Escaneie com seu WhatsApp");
    } catch (err) {
      toast.error("Erro ao gerar QR Code");
      setShowQRSkeleton(false);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Tem certeza que deseja desconectar?")) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase
        .from("zapi_instances" as any) as any)
        .delete()
        .eq("tenant_id", user.id);

      setInstance(null);
      toast.success("WhatsApp desconectado");
    } catch (err) {
      toast.error("Erro ao desconectar");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header com Voltar */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            WhatsApp (Z-API)
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Conecte seu número do WhatsApp para automações e respostas em tempo real.
          </p>
        </div>
      </div>

      {!instance ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-8"
        >
          <div className="flex flex-col items-center text-center">
            <div className="p-4 rounded-full bg-green-500/20 mb-4">
              <MessageCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Nenhum número conectado</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Conecte seu número do WhatsApp para começar a usar automações e integrações.
            </p>
            <Button
              size="lg"
              onClick={() => setOpenModal(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Conectar Número
            </Button>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Instância Conectada */}
          <div className="rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-500/20">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Conectado</h3>
                  <p className="text-sm text-muted-foreground">Seu WhatsApp está pronto para automações</p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisconnect}
                className="gap-1"
              >
                <LogOut className="w-3 h-3" />
                Desconectar
              </Button>
            </div>

            {/* Dados da Instância */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Número</span>
                </div>
                <p className="text-lg font-mono font-bold">
                  {instance.phone_number || "Não disponível"}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Battery className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Bateria</span>
                </div>
                <p className="text-lg font-bold">
                  {instance.battery_level !== null ? `${instance.battery_level}%` : "N/A"}
                </p>
              </div>

              <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs font-semibold uppercase text-muted-foreground">Status</span>
                </div>
                <p className="text-lg font-bold capitalize">
                  {instance.connection_status || "Desconectado"}
                </p>
              </div>
            </div>
          </div>

          {/* Ações Rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Webhook URL
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`https://api.omnibuilder.com/webhook/${instance.tenant_id}`}
                  className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`https://api.omnibuilder.com/webhook/${instance.tenant_id}`);
                    toast.success("Copiado!");
                  }}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="p-4 rounded-lg border border-border/50 bg-secondary/20">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Z-API Dashboard
              </h4>
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                asChild
              >
                <a href="https://z-api.io" target="_blank" rel="noopener noreferrer">
                  Acessar Dashboard
                </a>
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Modal de Conexão */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-green-600" />
              Conectar WhatsApp
            </DialogTitle>
            <DialogDescription>
              Escaneie o código QR com seu WhatsApp para conectar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* QR Code Area */}
            <div className="flex justify-center">
              {showQRSkeleton ? (
                <div className="w-64 h-64 bg-secondary rounded-lg animate-pulse flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : qrCode ? (
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="w-64 h-64 rounded-lg border-2 border-green-500/30"
                />
              ) : (
                <div className="w-64 h-64 bg-secondary rounded-lg flex items-center justify-center border-2 border-dashed border-border">
                  <div className="text-center">
                    <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">QR Code aparecerá aqui</p>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="p-3 rounded-lg bg-secondary/20 border border-border/50">
              <p className="text-xs text-muted-foreground">
                <strong>Passo 1:</strong> Clique no botão abaixo para gerar o QR Code<br />
                <strong>Passo 2:</strong> Abra o WhatsApp no seu celular<br />
                <strong>Passo 3:</strong> Vá em Configurações &gt; Dispositivos Conectados<br />
                <strong>Passo 4:</strong> Escaneie o código QR
              </p>
            </div>

            {/* Action Button */}
            <Button
              onClick={handleConnectNumber}
              disabled={connecting || qrCode !== null}
              className="w-full gap-2"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gerando QR Code...
                </>
              ) : qrCode ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  QR Code Pronto
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Gerar QR Code
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OmniFlowWhatsApp;
