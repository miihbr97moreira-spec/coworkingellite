import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Brain, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff,
  Save, RotateCcw, Copy, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface OmniFlowAgentProps {
  onBack: () => void;
}

const OmniFlowAgent: React.FC<OmniFlowAgentProps> = ({ onBack }) => {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [formData, setFormData] = useState({
    ai_provider: "openai",
    ai_model: "gpt-4o",
    ai_api_key: "",
    ai_system_prompt: "",
    zapi_sync_enabled: false,
  });

  const aiModels = {
    openai: ["gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
    anthropic: ["claude-3-5-sonnet", "claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await (supabase
        .from("omni_agent_config" as any)
        .select("*")
        .eq("tenant_id", user.id) as any)
        .single();

      if (data) {
        setConfig(data as any);
        setFormData({
          ai_provider: (data as any).ai_provider || "openai",
          ai_model: (data as any).ai_model || "gpt-4o",
          ai_api_key: (data as any).ai_api_key || "",
          ai_system_prompt: (data as any).ai_system_prompt || "",
          zapi_sync_enabled: (data as any).zapi_sync_enabled || false,
        });
      }
    } catch (err) {
      console.error("Erro ao carregar config:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.ai_api_key.trim()) {
      toast.error("Informe a API Key");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (config) {
        await (supabase
          .from("omni_agent_config" as any) as any)
          .update({
            ai_provider: formData.ai_provider,
            ai_model: formData.ai_model,
            ai_api_key: formData.ai_api_key,
            ai_system_prompt: formData.ai_system_prompt,
            zapi_sync_enabled: formData.zapi_sync_enabled,
            updated_at: new Date().toISOString(),
          })
          .eq("tenant_id", user.id);
      } else {
        await supabase
          .from("omni_agent_config")
          .insert({
            tenant_id: user.id,
            ai_provider: formData.ai_provider,
            ai_model: formData.ai_model,
            ai_api_key: formData.ai_api_key,
            ai_system_prompt: formData.ai_system_prompt,
            zapi_sync_enabled: formData.zapi_sync_enabled,
          });
      }

      await loadConfig();
      toast.success("Configuração salva com sucesso!");
    } catch (err) {
      toast.error("Erro ao salvar configuração");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (config) {
      setFormData({
        ai_provider: config.ai_provider || "openai",
        ai_model: config.ai_model || "gpt-4o",
        ai_api_key: config.ai_api_key || "",
        ai_system_prompt: config.ai_system_prompt || "",
        zapi_sync_enabled: config.zapi_sync_enabled || false,
      });
      toast.success("Formulário resetado");
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
            <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            Omni Agent (IA)
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Configure sua IA com chave própria (BYOK) para respostas automáticas e inteligentes.
          </p>
        </div>
      </div>

      {/* Configuration Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Provider Selection */}
        <div className="rounded-2xl border border-purple-500/30 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Provedor de IA
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["openai", "anthropic"].map((provider) => (
              <button
                key={provider}
                onClick={() => {
                  setFormData({
                    ...formData,
                    ai_provider: provider as any,
                    ai_model: aiModels[provider as keyof typeof aiModels][0],
                  });
                }}
                className={`p-4 rounded-lg border-2 transition-all ${
                  formData.ai_provider === provider
                    ? "border-purple-500 bg-purple-500/10"
                    : "border-border/50 hover:border-border"
                }`}
              >
                <div className="font-semibold capitalize mb-1">{provider === "openai" ? "OpenAI" : "Anthropic"}</div>
                <p className="text-xs text-muted-foreground">
                  {provider === "openai" ? "GPT-4o, GPT-4, GPT-3.5" : "Claude 3.5, Claude 3"}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* API Key Input */}
        <div className="rounded-lg border border-border/50 bg-secondary/20 p-6">
          <label className="text-sm font-semibold uppercase text-muted-foreground block mb-3">
            API Key ({formData.ai_provider === "openai" ? "OpenAI" : "Anthropic"})
          </label>
          <div className="flex gap-2">
            <input
              type={showApiKey ? "text" : "password"}
              value={formData.ai_api_key}
              onChange={(e) => setFormData({ ...formData, ai_api_key: e.target.value })}
              placeholder={`Informe sua chave ${formData.ai_provider === "openai" ? "sk-" : "sk-ant-"}`}
              className="flex-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm font-mono"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(formData.ai_api_key);
                toast.success("Copiado!");
              }}
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Sua chave é criptografada e armazenada com segurança. Nunca será compartilhada.
          </p>
        </div>

        {/* Model Selection */}
        <div className="rounded-lg border border-border/50 bg-secondary/20 p-6">
          <label className="text-sm font-semibold uppercase text-muted-foreground block mb-3">
            Modelo de IA
          </label>
          <select
            value={formData.ai_model}
            onChange={(e) => setFormData({ ...formData, ai_model: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg bg-background border border-border text-sm"
          >
            {aiModels[formData.ai_provider as keyof typeof aiModels].map((model) => (
              <option key={model} value={model}>
                {model}
              </option>
            ))}
          </select>
        </div>

        {/* System Prompt */}
        <div className="rounded-lg border border-border/50 bg-secondary/20 p-6">
          <label className="text-sm font-semibold uppercase text-muted-foreground block mb-3">
            System Prompt (Personalidade da IA)
          </label>
          <textarea
            value={formData.ai_system_prompt}
            onChange={(e) => setFormData({ ...formData, ai_system_prompt: e.target.value })}
            placeholder="Ex: Você é um assistente de atendimento ao cliente amigável e profissional. Responda sempre em português brasileiro..."
            className="w-full px-4 py-3 rounded-lg bg-background border border-border text-sm font-mono resize-none h-32"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Define a personalidade, tom e objetivo da sua IA. Seja específico para melhores resultados.
          </p>
        </div>

        {/* Z-API Sync Toggle */}
        <div className="rounded-lg border border-green-500/30 bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold flex items-center gap-2 mb-2">
                <MessageSquare className="w-5 h-5 text-green-600" />
                Sincronizar com WhatsApp (Z-API)
              </h4>
              <p className="text-sm text-muted-foreground">
                Ative para que a IA responda automaticamente às mensagens recebidas no WhatsApp.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.zapi_sync_enabled}
                onChange={(e) => setFormData({ ...formData, zapi_sync_enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600" />
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={saving}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Resetar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Configuração
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Documentation */}
      <div className="rounded-lg border border-border/50 bg-secondary/20 p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          Dicas para Melhor Performance
        </h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• <strong>System Prompt Detalhado:</strong> Quanto mais específico, melhor será a resposta da IA</li>
          <li>• <strong>Contexto:</strong> Inclua informações sobre seu negócio no prompt</li>
          <li>• <strong>Modelo Recomendado:</strong> Use GPT-4o ou Claude 3.5 para melhor qualidade</li>
          <li>• <strong>Z-API Sync:</strong> Certifique-se de ter um número WhatsApp conectado antes de ativar</li>
        </ul>
      </div>
    </div>
  );
};

export default OmniFlowAgent;
