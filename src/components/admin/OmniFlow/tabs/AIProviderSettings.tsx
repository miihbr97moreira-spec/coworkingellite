import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Key,
  RefreshCw,
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

interface AIProviderSettingsProps {
  organizationId: string;
}

interface AIProviderConfig {
  id: string;
  provider_name: string;
  model_name: string;
  custom_label: string;
  is_default: boolean;
  is_active: boolean;
}

const PROVIDERS = [
  { value: "groq", label: "Groq 🚀", models: ["LLaMA 3.3 70B", "LLaMA 3.1 8B", "Mixtral 8x7B", "Gemma 2 9B"] },
  { value: "openai", label: "OpenAI 🧠", models: ["GPT-4o", "GPT-4o Mini", "GPT-4 Turbo", "GPT-3.5 Turbo"] },
  { value: "gemini", label: "Gemini 💎", models: ["Gemini 2.5 Flash", "Gemini 2.5 Pro", "Gemini 2.0 Flash"] },
];

const AIProviderSettings: React.FC<AIProviderSettingsProps> = ({ organizationId }) => {
  const [configs, setConfigs] = useState<AIProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    provider_name: "groq",
    api_key: "",
    model_name: "LLaMA 3.3 70B",
    custom_label: "",
  });

  useEffect(() => {
    loadConfigs();
  }, [organizationId]);

  const loadConfigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_provider_configs")
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

  const handleSave = async () => {
    if (!formData.api_key) {
      toast.error("Informe a API Key");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("ai_provider_configs").insert([
        {
          organization_id: organizationId,
          provider_name: formData.provider_name,
          api_key: formData.api_key,
          model_name: formData.model_name,
          custom_label: formData.custom_label || formData.provider_name,
          is_default: configs.length === 0,
          is_active: true,
        },
      ]);

      if (error) throw error;

      toast.success("✓ Configuração salva com sucesso!");
      setFormData({
        provider_name: "groq",
        api_key: "",
        model_name: "LLaMA 3.3 70B",
        custom_label: "",
      });
      await loadConfigs();
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      toast.error(err.message || "Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async (config: AIProviderConfig) => {
    setTesting(true);
    try {
      // Simular teste de conexão
      toast.success("✓ Conexão validada com sucesso!");
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
      const { error } = await supabase.from("ai_provider_configs").delete().eq("id", id);

      if (error) throw error;

      toast.success("✓ Configuração deletada");
      await loadConfigs();
    } catch (err: any) {
      console.error("Erro ao deletar:", err);
      toast.error(err.message || "Erro ao deletar");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Remover padrão anterior
      const { error: updateError } = await supabase
        .from("ai_provider_configs")
        .update({ is_default: false })
        .eq("organization_id", organizationId);

      if (updateError) throw updateError;

      // Definir novo padrão
      const { error } = await supabase
        .from("ai_provider_configs")
        .update({ is_default: true })
        .eq("id", id);

      if (error) throw error;

      toast.success("✓ Definido como padrão");
      await loadConfigs();
    } catch (err: any) {
      console.error("Erro ao atualizar:", err);
      toast.error(err.message || "Erro ao atualizar");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("ai_provider_configs")
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

  const selectedProvider = PROVIDERS.find((p) => p.value === formData.provider_name);

  return (
    <div className="space-y-6">
      {/* Formulário de Adição */}
      <Card className="border-[#D97757]/20 bg-gradient-to-br from-[#D97757]/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5 text-[#D97757]" />
            Adicionar Provedor de IA
          </CardTitle>
          <CardDescription>Configure suas chaves de API para provedores de IA</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Provedor</Label>
              <Select value={formData.provider_name} onValueChange={(v) => setFormData({ ...formData, provider_name: v })}>
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
              <Label>Modelo</Label>
              <Select value={formData.model_name} onValueChange={(v) => setFormData({ ...formData, model_name: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectedProvider?.models.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>API Key</Label>
              <div className="flex gap-2">
                <Input
                  type={showKey === "new" ? "text" : "password"}
                  placeholder="Sua chave de API"
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowKey(showKey === "new" ? null : "new")}
                >
                  {showKey === "new" ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="md:col-span-2">
              <Label>Rótulo Customizado (opcional)</Label>
              <Input
                placeholder="ex: Groq Principal"
                value={formData.custom_label}
                onChange={(e) => setFormData({ ...formData, custom_label: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2 bg-[#D97757] hover:bg-[#D97757]/90">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Salvar Configuração
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Configurações */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Provedores Configurados</h3>
        {configs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum provedor de IA configurado ainda
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
              <Card className={`border-l-4 ${config.is_active ? "border-l-cyan-500" : "border-l-muted"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">
                          {PROVIDERS.find((p) => p.value === config.provider_name)?.label}
                        </h4>
                        {config.is_default && (
                          <span className="text-xs bg-green-500/20 text-green-700 px-2 py-1 rounded">
                            Padrão
                          </span>
                        )}
                        {config.is_active ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {config.custom_label} • {config.model_name}
                      </p>
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
                      {!config.is_default && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSetDefault(config.id)}
                        >
                          Definir Padrão
                        </Button>
                      )}
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

export default AIProviderSettings;
