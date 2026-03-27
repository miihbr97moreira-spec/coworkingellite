import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, Save, RotateCcw, Loader2, AlertCircle,
  CheckCircle2, Play, Pause, Copy, Eye, Code
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import TooltipHelp from "@/components/ui/tooltip-help";
import VariableSelector from "./VariableSelector";
import AutomationTester from "./AutomationTester";
import { useOmniFlowStore } from "@/stores/omniFlowStore";

interface OmniFlowBuilderProps {
  onBack: () => void;
}

interface AutomationFlow {
  id?: string;
  flow_name: string;
  flow_description: string;
  trigger_type: string;
  action_type: string;
  template_message: string;
  webhook_url?: string;
  is_active: boolean;
  execution_count?: number;
}

const TRIGGERS = [
  { id: "new_lead", name: "Novo Lead", description: "Quando um novo lead é capturado" },
  { id: "checkout_abandoned", name: "Checkout Abandonado", description: "Quando um cliente abandona o carrinho" },
  { id: "form_submission", name: "Envio de Formulário", description: "Quando um formulário é preenchido" },
  { id: "custom_webhook", name: "Webhook Customizado", description: "Acionado por um evento externo" },
];

const ACTIONS = [
  { id: "send_whatsapp", name: "Enviar WhatsApp", description: "Enviar mensagem via Z-API" },
  { id: "send_email", name: "Enviar Email", description: "Enviar email automático" },
  { id: "post_webhook", name: "Disparar Webhook (POST)", description: "Enviar dados para Zapier, Google Sheets, etc." },
  { id: "trigger_ai", name: "Disparar IA", description: "Usar Omni Agent para resposta inteligente" },
];

const OmniFlowBuilder: React.FC<OmniFlowBuilderProps> = ({ onBack }) => {
  const [flows, setFlows] = useState<AutomationFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [editingFlow, setEditingFlow] = useState<AutomationFlow | null>(null);
  const [showTester, setShowTester] = useState(false);
  const { selectedVariables, toggleVariable } = useOmniFlowStore();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [formData, setFormData] = useState<AutomationFlow>({
    flow_name: "",
    flow_description: "",
    trigger_type: "new_lead",
    action_type: "send_whatsapp",
    template_message: "",
    webhook_url: "",
    is_active: true,
  });

  useEffect(() => {
    loadFlows();
  }, []);

  const loadFlows = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("automation_flows")
        .select("*")
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false });

      setFlows(data || []);
    } catch (err) {
      console.error("Erro ao carregar flows:", err);
      toast.error("Erro ao carregar automações");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFlow = async () => {
    if (!formData.flow_name.trim()) {
      toast.error("Informe o nome da automação");
      return;
    }

    if (!formData.template_message.trim()) {
      toast.error("Informe o template/mensagem");
      return;
    }

    if (formData.action_type === "post_webhook" && !formData.webhook_url?.trim()) {
      toast.error("Informe a URL do webhook para a ação POST");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const flowData = {
        tenant_id: user.id,
        flow_name: formData.flow_name,
        flow_description: formData.flow_description,
        trigger_type: formData.trigger_type,
        action_type: formData.action_type,
        template_message: formData.template_message,
        webhook_url: formData.action_type === "post_webhook" ? formData.webhook_url : null,
        is_active: formData.is_active,
      };

      if (editingFlow?.id) {
        await supabase
          .from("automation_flows")
          .update(flowData)
          .eq("id", editingFlow.id);
        toast.success("Automação atualizada!");
      } else {
        await supabase
          .from("automation_flows")
          .insert(flowData);
        toast.success("Automação criada!");
      }

      setOpenModal(false);
      setEditingFlow(null);
      resetForm();
      await loadFlows();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar automação");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    if (!confirm("Tem certeza que deseja remover esta automação?")) return;

    try {
      await supabase
        .from("automation_flows")
        .delete()
        .eq("id", flowId);

      toast.success("Automação removida");
      await loadFlows();
    } catch (err) {
      toast.error("Erro ao remover automação");
    }
  };

  const handleToggleActive = async (flow: AutomationFlow) => {
    try {
      await supabase
        .from("automation_flows")
        .update({ is_active: !flow.is_active })
        .eq("id", flow.id);

      await loadFlows();
      toast.success(flow.is_active ? "Automação desativada" : "Automação ativada");
    } catch (err) {
      toast.error("Erro ao atualizar automação");
    }
  };

  const resetForm = () => {
    setFormData({
      flow_name: "",
      flow_description: "",
      trigger_type: "new_lead",
      action_type: "send_whatsapp",
      template_message: "",
      webhook_url: "",
      is_active: true,
    });
  };

  const openEditModal = (flow: AutomationFlow) => {
    setEditingFlow(flow);
    setFormData(flow);
    setOpenModal(true);
  };

  const getJsonPreview = () => {
    return {
      trigger: formData.trigger_type,
      action: formData.action_type,
      payload: {
        message: formData.template_message,
        webhook_url: formData.action_type === "post_webhook" ? formData.webhook_url : undefined,
        variables: ["{lead_name}", "{lead_email}", "{lead_phone}", "{event_timestamp}"],
      },
    };
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#D97757]/20 border border-[#D97757]/30">
                <Code className="w-6 h-6 text-[#D97757]" />
              </div>
              Flow Builder
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Crie automações poderosas conectando Gatilhos e Ações
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingFlow(null);
            resetForm();
            setOpenModal(true);
          }}
          className="gap-2 bg-[#D97757] hover:bg-[#D97757]/90"
        >
          <Plus className="w-4 h-4" />
          Nova Automação
        </Button>
      </div>

      {/* Automações Ativas */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold">Automações Ativas ({flows.filter(f => f.is_active).length})</h2>

        {flows.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-8 text-center"
          >
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma automação criada</h3>
            <p className="text-muted-foreground mb-4">Comece criando sua primeira automação clicando no botão acima</p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {flows.map((flow) => (
              <motion.div
                key={flow.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-border/50 bg-secondary/20 p-4 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{flow.flow_name}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        flow.is_active
                          ? "bg-[#D97757]/20 text-[#D97757]"
                          : "bg-red-500/20 text-red-700"
                      }`}>
                        {flow.is_active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{flow.flow_description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleToggleActive(flow)}
                      className="gap-1"
                    >
                      {flow.is_active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(flow)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteFlow(flow.id!)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Flow Details */}
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="p-2 rounded bg-background/50">
                    <span className="text-muted-foreground">Gatilho:</span>
                    <p className="font-mono font-semibold">{TRIGGERS.find(t => t.id === flow.trigger_type)?.name}</p>
                  </div>
                  <div className="p-2 rounded bg-background/50">
                    <span className="text-muted-foreground">Ação:</span>
                    <p className="font-mono font-semibold">{ACTIONS.find(a => a.id === flow.action_type)?.name}</p>
                  </div>
                  <div className="p-2 rounded bg-background/50">
                    <span className="text-muted-foreground">Execuções:</span>
                    <p className="font-mono font-semibold">{flow.execution_count || 0}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingFlow ? "Editar Automação" : "Nova Automação"}
            </DialogTitle>
            <DialogDescription>
              Configure os gatilhos, ações e templates para sua automação
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Nome e Descrição */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold block mb-2">Nome da Automação</label>
                <input
                  type="text"
                  value={formData.flow_name}
                  onChange={(e) => setFormData({ ...formData, flow_name: e.target.value })}
                  placeholder="Ex: Recuperar Checkout Abandonado"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-semibold block mb-2">Descrição</label>
                <input
                  type="text"
                  value={formData.flow_description}
                  onChange={(e) => setFormData({ ...formData, flow_description: e.target.value })}
                  placeholder="Descreva o que esta automação faz"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
                />
              </div>
            </div>

            {/* Gatilho */}
            <div>
              <label className="text-sm font-semibold block mb-2 flex items-center gap-2">
                Gatilho (Trigger)
                <TooltipHelp content="Escolha o evento que vai disparar esta automação" />
              </label>
              <select
                value={formData.trigger_type}
                onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
              >
                {TRIGGERS.map((trigger) => (
                  <option key={trigger.id} value={trigger.id}>
                    {trigger.name} - {trigger.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Ação */}
            <div>
              <label className="text-sm font-semibold block mb-2 flex items-center gap-2">
                Ação
                <TooltipHelp content="Escolha o que deve acontecer quando o gatilho for acionado" />
              </label>
              <select
                value={formData.action_type}
                onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
              >
                {ACTIONS.map((action) => (
                  <option key={action.id} value={action.id}>
                    {action.name} - {action.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Template/Mensagem */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold block mb-2 flex items-center gap-2">
                  Template/Mensagem
                  <TooltipHelp content="Use variáveis dinâmicas como {lead_name}, {lead_email}, {lead_phone} para personalizar" />
                </label>
                <textarea
                  ref={textareaRef}
                  value={formData.template_message}
                  onChange={(e) => setFormData({ ...formData, template_message: e.target.value })}
                  placeholder="Olá {lead_name}, vimos que você abandonou o carrinho com {checkout_items}. Quer retomar a compra?"
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm font-mono resize-none h-24"
                />
              </div>
              <VariableSelector
                selectedVariables={selectedVariables}
                onToggle={toggleVariable}
                onInsertIntoTextarea={(variable) => {
                  if (textareaRef.current) {
                    const start = textareaRef.current.selectionStart;
                    const end = textareaRef.current.selectionEnd;
                    const text = formData.template_message;
                    const newText = text.substring(0, start) + variable + text.substring(end);
                    setFormData({ ...formData, template_message: newText });
                    setTimeout(() => {
                      textareaRef.current?.setSelectionRange(start + variable.length, start + variable.length);
                      textareaRef.current?.focus();
                    }, 0);
                  }
                }}
              />
            </div>

            {/* URL Webhook (se POST) */}
            {formData.action_type === "post_webhook" && (
              <div>
                <label className="text-sm font-semibold block mb-2 flex items-center gap-2">
                  URL de Destino
                  <TooltipHelp content="Use esta ação para enviar os dados deste lead para o Google Sheets, Zapier ou RD Station" />
                </label>
                <input
                  type="url"
                  value={formData.webhook_url || ""}
                  onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                  placeholder="https://hooks.zapier.com/hooks/catch/..."
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm font-mono"
                />
              </div>
            )}

            {/* Tabs: JSON Preview e Tester */}
            <div className="space-y-3">
              <div className="flex gap-2 border-b border-border/50">
                <button
                  onClick={() => setShowJsonPreview(true)}
                  className={`px-3 py-2 text-sm font-semibold border-b-2 transition-colors ${
                    showJsonPreview
                      ? "border-[#D97757] text-[#D97757]"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Eye className="w-3 h-3 inline mr-1" />
                  JSON Preview
                </button>
                <button
                  onClick={() => setShowTester(true)}
                  className={`px-3 py-2 text-sm font-semibold border-b-2 transition-colors ${
                    showTester
                      ? "border-[#D97757] text-[#D97757]"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Play className="w-3 h-3 inline mr-1" />
                  Simulador
                </button>
              </div>

              {showJsonPreview && (
                <pre className="p-3 rounded-lg bg-background border border-border text-xs font-mono overflow-x-auto">
                  {JSON.stringify(getJsonPreview(), null, 2)}
                </pre>
              )}

              {showTester && <AutomationTester />}
            </div>

            {/* Ações */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setOpenModal(false);
                  setEditingFlow(null);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSaveFlow}
                disabled={saving}
                className="gap-2 bg-[#D97757] hover:bg-[#D97757]/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar Automação
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OmniFlowBuilder;
