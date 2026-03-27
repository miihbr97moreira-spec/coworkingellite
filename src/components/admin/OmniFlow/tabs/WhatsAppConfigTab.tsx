import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface WhatsAppConfigTabProps {
  organizationId: string;
}

interface WhatsAppConfig {
  id: string;
  api_type: string;
  base_url: string;
  api_token: string;
  instance_id?: string;
  is_active: boolean;
  auto_create_lead: boolean;
}

const PROVIDERS = [
  { value: "z-api", label: "Z-API" },
  { value: "evolution", label: "Evolution" },
  { value: "codechat", label: "CodeChat" },
  { value: "baileys", label: "Baileys" },
  { value: "botconversa", label: "BotConversa" },
  { value: "ultramsg", label: "UltraMsg" },
  { value: "chatpro", label: "ChatPro" },
  { value: "wassenger", label: "Wassenger" },
  { value: "custom", label: "Custom" },
];

const WhatsAppConfigTab: React.FC<WhatsAppConfigTabProps> = ({ organizationId }) => {
  const [configs, setConfigs] = useState<WhatsAppConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showToken, setShowToken] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    api_type: "z-api",
    base_url: "",
    api_token: "",
    instance_id: "",
    auto_create_lead: true,
  });

  useEffect(() => {
    loadConfigs();
  }, [organizationId]);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_configs")
        .select("*")
        .eq("organization_id", organizationId);

      if (error) throw error;
      setConfigs(data || []);
    } catch (err) {
      console.error("Erro ao carregar configs:", err);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const sanitizeUrl = (url: string) => {
    return url
      .replace(/\/$/, "")
      .replace(/\/send-text$/, "")
      .replace(/\/send-image$/, "")
      .replace(/\/send-document$/, "");
  };

  const handleSave = async () => {
    if (!formData.base_url || !formData.api_token) {
      toast.error("Preencha URL base e token");
      return;
    }

    setSaving(true);
    try {
      const sanitizedUrl = sanitizeUrl(formData.base_url);

      const { error } = await supabase.from("whatsapp_configs").insert([
        {
          organization_id: organizationId,
          api_type: formData.api_type,
          base_url: sanitizedUrl,
          api_token: formData.api_token,
          instance_id: formData.instance_id || null,
          auto_create_lead: formData.auto_create_lead,
          is_active: true,
        },
      ]);

      if (error) throw error;

      toast.success("✓ Configuração salva com sucesso!");
      setFormData({
        api_type: "z-api",
        base_url: "",
        api_token: "",
        instance_id: "",
        auto_create_lead: true,
      });
      await loadConfigs();
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      toast.error(err.message || "Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (config: WhatsAppConfig) => {
    setTesting(true);
    try {
      // Simular teste de conexão
      const response = await fetch(config.base_url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${config.api_token}`,
        },
      }).catch(() => null);

      if (response?.ok) {
        toast.success("✓ Conexão validada com sucesso!");
      } else {
        toast.error("❌ Falha na validação. Verifique credenciais.");
      }
    } catch (err) {
      console.error("Erro ao testar:", err);
      toast.error("Erro ao testar conexão");
    } finally {
      setTesting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta configuração?")) return;

    try {
      const { error } = await supabase.from("whatsapp_configs").delete().eq("id", id);

      if (error) throw error;

      toast.success("✓ Configuração deletada");
      await loadConfigs();
    } catch (err: any) {
      console.error("Erro ao deletar:", err);
      toast.error(err.message || "Erro ao deletar");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("whatsapp_configs")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;

      toast.success(isActive ? "✓ Desativado" : "✓ Ativado");
      await loadConfigs();
    } catch (err: any) {
      console.error("Erro ao atualizar:", err);
      toast.error(err.message || "Erro ao atualizar");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#D97757]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulário de Adição */}
      <Card className="border-[#D97757]/20 bg-gradient-to-br from-[#D97757]/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#D97757]" />
            Adicionar Configuração WhatsApp
          </CardTitle>
          <CardDescription>Configure um novo provedor de WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Provedor</Label>
              <Select value={formData.api_type} onValueChange={(v) => setFormData({ ...formData, api_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>URL Base</Label>
              <Input
                placeholder="https://api.z-api.io"
                value={formData.base_url}
                onChange={(e) => setFormData({ ...formData, base_url: e.target.value })}
              />
            </div>

            <div>
              <Label>API Token</Label>
              <div className="flex gap-2">
                <Input
                  type={showToken === "new" ? "text" : "password"}
                  placeholder="Seu token de API"
                  value={formData.api_token}
                  onChange={(e) => setFormData({ ...formData, api_token: e.target.value })}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowToken(showToken === "new" ? null : "new")}
                >
                  {showToken === "new" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div>
              <Label>Instance ID (opcional)</Label>
              <Input
                placeholder="ID da instância"
                value={formData.instance_id}
                onChange={(e) => setFormData({ ...formData, instance_id: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Switch
              checked={formData.auto_create_lead}
              onCheckedChange={(v) => setFormData({ ...formData, auto_create_lead: v })}
            />
            <Label className="cursor-pointer">Auto-criar leads de novas conversas</Label>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2 bg-[#D97757] hover:bg-[#D97757]/90">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Salvar Configuração
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Configurações */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Configurações Ativas</h3>
        {configs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma configuração WhatsApp criada ainda
            </CardContent>
          </Card>
        ) : (
          configs.map((config, idx) => (
            <motion.div
              key={config.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`border-l-4 ${config.is_active ? "border-l-green-500" : "border-l-muted"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">
                          {PROVIDERS.find((p) => p.value === config.api_type)?.label}
                        </h4>
                        {config.is_active ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{config.base_url}</p>
                      {config.instance_id && (
                        <p className="text-xs text-muted-foreground mt-1">Instance: {config.instance_id}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTest(config)}
                        disabled={testing}
                        className="gap-2"
                      >
                        {testing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        Testar
                      </Button>
                      <Button
                        size="sm"
                        variant={config.is_active ? "outline" : "default"}
                        onClick={() => handleToggleActive(config.id, config.is_active)}
                      >
                        {config.is_active ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(config.id)}
                        className="gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        Deletar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default WhatsAppConfigTab;
