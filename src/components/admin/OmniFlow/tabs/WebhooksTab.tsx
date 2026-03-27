import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Webhook,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface WebhooksTabProps {
  organizationId: string;
}

interface WebhookConfig {
  id: string;
  name: string;
  url: string;
  event_types: string[];
  is_active: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  key_preview: string;
  is_active: boolean;
  last_used_at: string;
}

const EVENT_TYPES = [
  "message_sent",
  "message_received",
  "lead_created",
  "lead_won",
  "lead_lost",
  "stage_change",
  "task_created",
  "task_completed",
  "contact_logged",
];

const WebhooksTab: React.FC<WebhooksTabProps> = ({ organizationId }) => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    event_types: [] as string[],
  });
  const [apiKeyForm, setApiKeyForm] = useState({
    name: "",
  });

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [webhooksRes, keysRes] = await Promise.all([
        supabase.from("webhook_configs").select("*").eq("organization_id", organizationId),
        supabase.from("api_keys").select("*").eq("organization_id", organizationId),
      ]);

      if (webhooksRes.error) throw webhooksRes.error;
      if (keysRes.error) throw keysRes.error;

      setWebhooks(webhooksRes.data || []);
      setApiKeys(keysRes.data || []);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWebhook = async () => {
    if (!formData.name || !formData.url) {
      toast.error("Informe nome e URL");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("webhook_configs").insert([
        {
          organization_id: organizationId,
          name: formData.name,
          url: formData.url,
          event_types: formData.event_types,
          is_active: true,
        },
      ]);

      if (error) throw error;

      toast.success("✓ Webhook criado com sucesso!");
      setFormData({ name: "", url: "", event_types: [] });
      await loadData();
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      toast.error(err.message || "Erro ao salvar webhook");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateApiKey = async () => {
    if (!apiKeyForm.name) {
      toast.error("Informe o nome da chave");
      return;
    }

    setSaving(true);
    try {
      const key = `sk_${Math.random().toString(36).substr(2, 32)}`;
      const keyHash = await hashKey(key);

      const { error } = await supabase.from("api_keys").insert([
        {
          organization_id: organizationId,
          name: apiKeyForm.name,
          key_hash: keyHash,
          key_preview: key.slice(-8),
          is_active: true,
        },
      ]);

      if (error) throw error;

      toast.success("✓ Chave gerada! Copie agora (não será exibida novamente)");
      // Mostrar chave completa em um modal ou toast
      await new Promise((resolve) => setTimeout(resolve, 1000));
      navigator.clipboard.writeText(key);

      setApiKeyForm({ name: "" });
      await loadData();
    } catch (err: any) {
      console.error("Erro ao gerar chave:", err);
      toast.error(err.message || "Erro ao gerar chave");
    } finally {
      setSaving(false);
    }
  };

  const hashKey = async (key: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm("Tem certeza?")) return;

    try {
      const { error } = await supabase.from("webhook_configs").delete().eq("id", id);

      if (error) throw error;

      toast.success("✓ Webhook deletado");
      await loadData();
    } catch (err: any) {
      console.error("Erro ao deletar:", err);
      toast.error(err.message || "Erro ao deletar");
    }
  };

  const handleDeleteApiKey = async (id: string) => {
    if (!confirm("Tem certeza?")) return;

    try {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);

      if (error) throw error;

      toast.success("✓ Chave deletada");
      await loadData();
    } catch (err: any) {
      console.error("Erro ao deletar:", err);
      toast.error(err.message || "Erro ao deletar");
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
      <Tabs defaultValue="outbound" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="outbound">Webhooks Saída</TabsTrigger>
          <TabsTrigger value="inbound">Webhooks Entrada</TabsTrigger>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
        </TabsList>

        {/* Webhooks de Saída */}
        <TabsContent value="outbound" className="space-y-4">
          <Card className="border-[#D97757]/20 bg-gradient-to-br from-[#D97757]/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="w-5 h-5 text-[#D97757]" />
                Adicionar Webhook de Saída
              </CardTitle>
              <CardDescription>Configure endpoints para receber eventos do CRM</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Nome</Label>
                  <Input
                    placeholder="ex: Webhook de Leads"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>URL</Label>
                  <Input
                    placeholder="https://seu-servidor.com/webhook"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Eventos</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {EVENT_TYPES.map((event) => (
                      <label key={event} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.event_types.includes(event)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                event_types: [...formData.event_types, event],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                event_types: formData.event_types.filter((t) => t !== event),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm">{event}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <Button onClick={handleSaveWebhook} disabled={saving} className="w-full gap-2 bg-[#D97757] hover:bg-[#D97757]/90">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Criar Webhook
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Webhooks */}
          <div className="space-y-3">
            {webhooks.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum webhook configurado
                </CardContent>
              </Card>
            ) : (
              webhooks.map((webhook, idx) => (
                <motion.div
                  key={webhook.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`border-l-4 ${webhook.is_active ? "border-l-green-500" : "border-l-muted"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{webhook.name}</h4>
                            {webhook.is_active ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{webhook.url}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Eventos: {webhook.event_types.join(", ")}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteWebhook(webhook.id)}
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
        </TabsContent>

        {/* Webhooks de Entrada */}
        <TabsContent value="inbound" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook de Entrada</CardTitle>
              <CardDescription>URL para receber mensagens de provedores WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-mono break-all">
                  https://seu-dominio.com/api/webhooks/receiver?api_key=YOUR_API_KEY
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Configure esta URL nos seus provedores WhatsApp (Z-API, Evolution, etc.)
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys */}
        <TabsContent value="api-keys" className="space-y-4">
          <Card className="border-[#D97757]/20 bg-gradient-to-br from-[#D97757]/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#D97757]" />
                Gerar Nova API Key
              </CardTitle>
              <CardDescription>Crie chaves para autenticar webhooks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome da Chave</Label>
                <Input
                  placeholder="ex: Z-API Webhook"
                  value={apiKeyForm.name}
                  onChange={(e) => setApiKeyForm({ name: e.target.value })}
                />
              </div>

              <Button onClick={handleGenerateApiKey} disabled={saving} className="w-full gap-2 bg-[#D97757] hover:bg-[#D97757]/90">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Gerar Chave
              </Button>
            </CardContent>
          </Card>

          {/* Lista de API Keys */}
          <div className="space-y-3">
            {apiKeys.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhuma chave gerada
                </CardContent>
              </Card>
            ) : (
              apiKeys.map((key, idx) => (
                <motion.div
                  key={key.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`border-l-4 ${key.is_active ? "border-l-blue-500" : "border-l-muted"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{key.name}</h4>
                            {key.is_active ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            ...{key.key_preview}
                          </p>
                          {key.last_used_at && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Último uso: {new Date(key.last_used_at).toLocaleDateString("pt-BR")}
                            </p>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteApiKey(key.id)}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebhooksTab;
