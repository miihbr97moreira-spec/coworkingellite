import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, MessageCircle, Loader2, AlertCircle, CheckCircle2,
  Copy, RefreshCw, Eye, EyeOff, Zap, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import TooltipHelp from "@/components/ui/tooltip-help";

interface OmniFlowWhatsAppProps {
  onBack: () => void;
}

interface ZapiInstance {
  id?: string;
  instance_id: string;
  instance_token: string;
  phone_number?: string;
  battery_level?: number;
  connection_status: "connected" | "disconnected" | "connecting";
  is_authenticated: boolean;
}

const OmniFlowWhatsApp: React.FC<OmniFlowWhatsAppProps> = ({ onBack }) => {
  const [instance, setInstance] = useState<ZapiInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [formData, setFormData] = useState({
    instance_id: "",
    instance_token: "",
  });

  useEffect(() => {
    loadInstance();
  }, []);

  const loadInstance = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("zapi_instances")
        .select("*")
        .eq("tenant_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setInstance(data);
        setFormData({
          instance_id: data.instance_id || "",
          instance_token: data.instance_token || "",
        });
      }
    } catch (err: any) {
      console.error("Erro ao carregar instância Z-API:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    if (!formData.instance_id || !formData.instance_token) {
      toast.error("Informe Instance ID e Token");
      return;
    }

    setTesting(true);
    try {
      // Simular ping para validar credenciais
      // Em produção, isso faria uma chamada real à API do Z-API
      const response = await fetch(
        `https://api.z-api.io/instances/${formData.instance_id}/status`,
        {
          headers: {
            "Authorization": `Bearer ${formData.instance_token}`,
          },
        }
      ).catch(() => null);

      if (response?.ok) {
        toast.success("✓ Conexão validada com sucesso!");
        setInstance({
          ...instance!,
          is_authenticated: true,
          connection_status: "connected",
        });
      } else {
        toast.error("❌ Credenciais inválidas. Verifique Instance ID e Token.");
      }
    } catch (err: any) {
      console.error("Erro ao testar conexão:", err);
      toast.error("Erro ao testar conexão. Verifique os dados.");
    } finally {
      setTesting(false);
    }
  };

  const handleSaveInstance = async () => {
    if (!formData.instance_id || !formData.instance_token) {
      toast.error("Informe Instance ID e Token");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const payload = {
        tenant_id: user.id,
        instance_id: formData.instance_id,
        instance_token: formData.instance_token,
        connection_status: "connecting",
        is_authenticated: false,
      };

      if (instance?.id) {
        const { error } = await supabase
          .from("zapi_instances")
          .update(payload)
          .eq("id", instance.id);

        if (error) throw error;
        toast.success("Instância atualizada!");
      } else {
        const { error } = await supabase
          .from("zapi_instances")
          .insert([payload]);

        if (error) throw error;
        toast.success("Instância criada!");
      }

      await loadInstance();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Desconectar WhatsApp?")) return;

    try {
      const { error } = await supabase
        .from("zapi_instances")
        .delete()
        .eq("id", instance?.id);

      if (error) throw error;
      setInstance(null);
      setFormData({ instance_id: "", instance_token: "" });
      toast.success("WhatsApp desconectado");
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#D97757]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
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
            <TooltipHelp content="Para conectar o WhatsApp: Leia o QR Code ou insira sua Instance ID e Token gerados no painel oficial do Z-API. Teste a conexão antes de ativar." />
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Configure sua instância do WhatsApp via Z-API para enviar mensagens automáticas.
          </p>
        </div>
      </div>

      {instance?.is_authenticated ? (
        // Status Conectado
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <div>
                <h2 className="text-lg font-bold text-green-600">Conectado com Sucesso</h2>
                <p className="text-sm text-muted-foreground">Sua instância está pronta para enviar mensagens</p>
              </div>
            </div>
            <Button
              variant="destructive"
              onClick={handleDisconnect}
              className="gap-2"
            >
              Desconectar
            </Button>
          </div>

          {/* Dados da Instância */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">Número do WhatsApp</span>
              <p className="font-mono font-semibold text-lg">{instance.phone_number || "N/A"}</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-border/50">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">Bateria do Dispositivo</span>
              <p className="font-mono font-semibold text-lg">{instance.battery_level || "N/A"}%</p>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-border/50 col-span-2">
              <span className="text-xs font-semibold text-muted-foreground block mb-1">Instance ID</span>
              <div className="flex items-center gap-2">
                <p className="font-mono font-semibold flex-1 break-all">{instance.instance_id}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(instance.instance_id);
                    toast.success("Copiado!");
                  }}
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        // Formulário de Conexão
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#D97757]/30 bg-gradient-to-br from-[#D97757]/10 to-orange-500/10 p-6 space-y-6"
        >
          <div className="flex items-start gap-3 p-4 rounded-lg bg-[#D97757]/10 border border-[#D97757]/20">
            <Info className="w-5 h-5 text-[#D97757] flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-[#D97757] mb-1">Como conectar:</p>
              <ol className="text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Acesse <a href="https://z-api.io" target="_blank" rel="noopener noreferrer" className="text-[#D97757] hover:underline">z-api.io</a></li>
                <li>Crie uma instância do WhatsApp</li>
                <li>Copie a <strong>Instance ID</strong> e o <strong>Instance Token</strong></li>
                <li>Cole nos campos abaixo e clique em "Testar Conexão"</li>
              </ol>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold block mb-2 flex items-center gap-2">
                Instance ID
                <TooltipHelp content="Identificador único da sua instância no Z-API. Encontre no painel de configurações." />
              </label>
              <input
                type="text"
                value={formData.instance_id}
                onChange={(e) => setFormData({ ...formData, instance_id: e.target.value })}
                placeholder="Ex: 1234567890"
                className="w-full px-4 py-2 rounded-lg bg-background border border-border text-sm font-mono"
              />
            </div>

            <div>
              <label className="text-sm font-semibold block mb-2 flex items-center gap-2">
                Instance Token
                <TooltipHelp content="Chave de autenticação segura. Nunca compartilhe este token com ninguém." />
              </label>
              <div className="flex gap-2">
                <input
                  type={showToken ? "text" : "password"}
                  value={formData.instance_token}
                  onChange={(e) => setFormData({ ...formData, instance_token: e.target.value })}
                  placeholder="Ex: eyJhbGciOiJIUzI1NiIs..."
                  className="flex-1 px-4 py-2 rounded-lg bg-background border border-border text-sm font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowToken(!showToken)}
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleTestConnection}
                disabled={testing || !formData.instance_id || !formData.instance_token}
                className="gap-2 bg-[#D97757] hover:bg-[#D97757]/90"
              >
                {testing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Testar Conexão
                  </>
                )}
              </Button>
              <Button
                onClick={handleSaveInstance}
                disabled={saving || !formData.instance_id || !formData.instance_token}
                variant="outline"
                className="gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default OmniFlowWhatsApp;
