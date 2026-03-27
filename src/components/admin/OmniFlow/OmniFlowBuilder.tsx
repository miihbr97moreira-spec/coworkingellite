import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Plus, Trash2, Save, RotateCcw, Loader2, AlertCircle,
  CheckCircle2, Play, Pause, Copy, Eye, Code, Info
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
  trigger_config: Record<string, any>;
  action_type: string;
  action_config: Record<string, any>;
  template_message: string;
  cadence_messages?: Array<{ delay_minutes: number; message_text: string }>;
  crm_action_type?: string;
  crm_stage_id?: string;
  is_active: boolean;
  execution_count?: number;
  flow_config?: Record<string, any>;
}

const TRIGGERS = [
  { id: "new_lead", name: "Novo Lead", description: "Quando um novo lead é capturado", category: "lead" },
  { id: "checkout_abandoned", name: "Checkout Abandonado", description: "Quando um cliente abandona o carrinho", category: "ecommerce" },
  { id: "form_submission", name: "Envio de Formulário", description: "Quando um formulário é preenchido", category: "form" },
  { id: "lead_moved_to_stage", name: "Lead Movido para Etapa", description: "Quando um lead muda de etapa no CRM", category: "crm" },
  { id: "lead_created_in_funnel", name: "Lead Criado no Funil", description: "Quando um lead é criado em um funil específico", category: "crm" },
  { id: "custom_webhook", name: "Webhook Customizado", description: "Acionado por um evento externo", category: "webhook" },
];

const ACTIONS = [
  { id: "send_whatsapp", name: "Enviar WhatsApp", description: "Enviar mensagem via Z-API", category: "messaging" },
  { id: "send_email", name: "Enviar Email", description: "Enviar email automático", category: "messaging" },
  { id: "send_cadence", name: "Enviar Cadência (Sequência)", description: "Enviar múltiplas mensagens programadas", category: "messaging" },
  { id: "move_to_stage", name: "Mover Lead para Etapa", description: "Mover lead no CRM para outra etapa", category: "crm" },
  { id: "mark_won", name: "Marcar como Ganho", description: "Marcar lead como oportunidade vencida", category: "crm" },
  { id: "mark_lost", name: "Marcar como Perdido", description: "Marcar lead como oportunidade perdida", category: "crm" },
  { id: "trigger_ai", name: "Disparar IA", description: "Usar Omni Agent para resposta inteligente", category: "ai" },
];

const OmniFlowBuilder: React.FC<OmniFlowBuilderProps> = ({ onBack }) => {
  const [flows, setFlows] = useState<AutomationFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [showJsonPreview, setShowJsonPreview] = useState(false);
  const [showTester, setShowTester] = useState(false);
  const [editingFlow, setEditingFlow] = useState<AutomationFlow | null>(null);
  const { selectedVariables, toggleVariable } = useOmniFlowStore();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState<AutomationFlow>({
    flow_name: "",
    flow_description: "",
    trigger_type: "new_lead",
    trigger_config: {},
    action_type: "send_whatsapp",
    action_config: {},
    template_message: "",
    cadence_messages: [],
    crm_action_type: "none",
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

      const { data, error } = await supabase
        .from("automation_flows")
        .select("*")
        .eq("tenant_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlows(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar flows:", err);
      toast.error(`Erro ao carregar automações: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFlow = async () => {
    if (!formData.flow_name.trim()) {
      toast.error("Informe o nome da automação");
      return;
    }

    if (!formData.template_message.trim() && formData.action_type !== "move_to_stage" && formData.action_type !== "mark_won" && formData.action_type !== "mark_lost") {
      toast.error("Informe o template/mensagem");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Construir o JSON completo da automação
      const flowPayload = {
        tenant_id: user.id,
        flow_name: formData.flow_name,
        flow_description: formData.flow_description,
        trigger_type: formData.trigger_type,
        trigger_config: formData.trigger_config,
        action_type: formData.action_type,
        action_config: formData.action_config,
        template_message: formData.template_message,
        cadence_messages: formData.cadence_messages || [],
        crm_action_type: formData.crm_action_type || "none",
        crm_stage_id: formData.crm_stage_id || null,
        is_active: formData.is_active,
        flow_config: {
          variables_used: selectedVariables,
          created_at: new Date().toISOString(),
        },
      };

      if (editingFlow?.id) {
        const { error } = await supabase
          .from("automation_flows")
          .update(flowPayload)
          .eq("id", editingFlow.id);

        if (error) throw error;
        toast.success("Automação atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("automation_flows")
          .insert([flowPayload]);

        if (error) throw error;
        toast.success("Automação criada com sucesso!");
      }

      setOpenModal(false);
      setEditingFlow(null);
      resetForm();
      await loadFlows();
    } catch (err: any) {
      console.error("Erro ao salvar automação:", err);
      toast.error(`Erro ao salvar: ${err.message || "Tente novamente"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFlow = async (flowId: string) => {
    if (!confirm("Tem certeza que deseja remover esta automação?")) return;

    try {
      const { error } = await supabase
        .from("automation_flows")
        .delete()
        .eq("id", flowId);

      if (error) throw error;
      toast.success("Automação removida");
      await loadFlows();
    } catch (err: any) {
      toast.error(`Erro ao remover: ${err.message}`);
    }
  };

  const handleToggleActive = async (flow: AutomationFlow) => {
    try {
      const { error } = await supabase
        .from("automation_flows")
        .update({ is_active: !flow.is_active })
        .eq("id", flow.id);

      if (error) throw error;
      await loadFlows();
      toast.success(flow.is_active ? "Automação desativada" : "Automação ativada");
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      flow_name: "",
      flow_description: "",
      trigger_type: "new_lead",
      trigger_config: {},
      action_type: "send_whatsapp",
      action_config: {},
      template_message: "",
      cadence_messages: [],
      crm_action_type: "none",
      is_active: true,
    });
    toggleVariable(""); // Limpar variáveis selecionadas
  };

  const openEditModal = (flow: AutomationFlow) => {
    setEditingFlow(flow);
    setFormData(flow);
    setOpenModal(true);
  };

  const getJsonPreview = () => ({
    automation: {
      name: formData.flow_name,
      trigger: {
        type: formData.trigger_type,
        config: formData.trigger_config,
      },
      actions: [
        {
          type: formData.action_type,
          config: formData.action_config,
          message: formData.template_message,
          cadence: formData.cadence_messages,
        },
      ],
      variables: selectedVariables,
      crm_action: formData.crm_action_type !== "none" ? {
        type: formData.crm_action_type,
        stage_id: formData.crm_stage_id,
      } : null,
    },
  });

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
              <TooltipHelp content="Defina um Gatilho (O que inicia a automação) e conecte com Ações (O que o sistema faz: mandar WhatsApp, mudar etapa no CRM, etc)." />
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Crie automações poderosas conectando Gatilhos e Ações. Todas as automações são salvas em tempo real no banco de dados.
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
        <h2 className="text-xl font-bold flex items-center gap-2">
          Automações Ativas ({flows.filter(f => f.is_active).length})
          <TooltipHelp content="Aqui aparecem todas as automações que você criou. Clique em Editar para modificar ou use o botão de play/pause para ativar/desativar." />
        </h2>

        {flows.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-[#D97757]/30 bg-gradient-to-br from-[#D97757]/10 to-orange-500/10 p-8 text-center"
          >
            <AlertCircle className="w-8 h-8 text-[#D97757] mx-auto mb-3" />
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
                className="rounded-lg border border-border/50 bg-secondary/20 p-4 hover:border-[#D97757]/30 transition-all"
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
                <div className="grid grid-cols-4 gap-3 text-xs">
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
                  <div className="p-2 rounded bg-background/50">
                    <span className="text-muted-foreground">Status BD:</span>
                    <p className="font-mono font-semibold text-green-600">✓ Salvo</p>
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
              Configure os gatilhos, ações e templates para sua automação. Tudo será salvo no banco de dados.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Nome e Descrição */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold block mb-2 flex items-center gap-2">
                  Nome da Automação
                  <TooltipHelp content="Dê um nome descritivo para identificar facilmente esta automação" />
                </label>
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
                <TooltipHelp content="Escolha o evento que vai disparar esta automação. Por exemplo: quando um novo lead chega, quando um checkout é abandonado, etc." />
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
                <TooltipHelp content="Escolha o que deve acontecer quando o gatilho for acionado. Pode ser enviar mensagem, mover lead no CRM, disparar IA, etc." />
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

            {/* Template/Mensagem (se aplicável) */}
            {(formData.action_type === "send_whatsapp" || formData.action_type === "send_email" || formData.action_type === "send_cadence") && (
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-semibold block mb-2 flex items-center gap-2">
                    Template/Mensagem
                    <TooltipHelp content="Use variáveis dinâmicas como {lead_name}, {lead_email}, {lead_phone} para personalizar. Clique nas tags abaixo para inserir." />
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
            )}

            {/* JSON Preview */}
            <div className="space-y-3">
              <button
                onClick={() => setShowJsonPreview(!showJsonPreview)}
                className="text-sm font-semibold text-[#D97757] hover:underline flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                {showJsonPreview ? "Ocultar" : "Ver"} JSON da Automação
              </button>
              {showJsonPreview && (
                <pre className="p-3 rounded-lg bg-background border border-border text-xs font-mono overflow-x-auto max-h-48 overflow-y-auto">
                  {JSON.stringify(getJsonPreview(), null, 2)}
                </pre>
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-3 justify-end pt-4 border-t border-border/50">
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
                onClick={handleSaveFlow}
                disabled={saving}
                className="gap-2 bg-[#D97757] hover:bg-[#D97757]/90"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando no Banco...
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
