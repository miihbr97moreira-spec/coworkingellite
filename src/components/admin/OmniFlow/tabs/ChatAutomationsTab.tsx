import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface ChatAutomationsTabProps {
  organizationId: string;
}

interface ChatAutomation {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  priority: number;
  is_active: boolean;
  cooldown_seconds: number;
}

const TRIGGERS = [
  { value: "any_message", label: "Qualquer mensagem" },
  { value: "keyword", label: "Contém palavra-chave" },
  { value: "first_message", label: "Primeiro contato" },
  { value: "regex", label: "Expressão regular" },
  { value: "media_type", label: "Tipo de mídia" },
  { value: "no_active_lead", label: "Sem lead ativo" },
  { value: "greeting", label: "Saudação" },
];

const ACTIONS = [
  { value: "ai_agent", label: "Responder com IA" },
  { value: "auto_reply", label: "Resposta automática" },
  { value: "assign_to", label: "Atribuir a membro" },
  { value: "add_tag", label: "Adicionar tag" },
  { value: "add_to_pipeline", label: "Criar lead no funil" },
  { value: "move_stage", label: "Mover etapa" },
  { value: "start_flow", label: "Iniciar fluxo" },
];

const ChatAutomationsTab: React.FC<ChatAutomationsTabProps> = ({ organizationId }) => {
  const [automations, setAutomations] = useState<ChatAutomation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger_type: "any_message",
    priority: 0,
    cooldown_seconds: 5,
  });

  useEffect(() => {
    loadAutomations();
  }, [organizationId]);

  const loadAutomations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_automations")
        .select("*")
        .eq("organization_id", organizationId)
        .order("priority", { ascending: false });

      if (error) throw error;
      setAutomations(data || []);
    } catch (err) {
      console.error("Erro ao carregar automações:", err);
      toast.error("Erro ao carregar automações");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Informe o nome da automação");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("chat_automations").insert([
        {
          organization_id: organizationId,
          name: formData.name,
          description: formData.description,
          trigger_type: formData.trigger_type,
          priority: formData.priority,
          cooldown_seconds: formData.cooldown_seconds,
          actions: { steps: [] },
          is_active: true,
        },
      ]);

      if (error) throw error;

      toast.success("✓ Automação criada com sucesso!");
      setFormData({
        name: "",
        description: "",
        trigger_type: "any_message",
        priority: 0,
        cooldown_seconds: 5,
      });
      await loadAutomations();
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      toast.error(err.message || "Erro ao salvar automação");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta automação?")) return;

    try {
      const { error } = await supabase.from("chat_automations").delete().eq("id", id);

      if (error) throw error;

      toast.success("✓ Automação deletada");
      await loadAutomations();
    } catch (err: any) {
      console.error("Erro ao deletar:", err);
      toast.error(err.message || "Erro ao deletar");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("chat_automations")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;

      toast.success(isActive ? "✓ Desativada" : "✓ Ativada");
      await loadAutomations();
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
      {/* Formulário de Criação */}
      <Card className="border-[#D97757]/20 bg-gradient-to-br from-[#D97757]/5 to-transparent">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#D97757]" />
            Criar Nova Automação
          </CardTitle>
          <CardDescription>Configure regras de gatilho e ação</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome da Automação</Label>
              <Input
                placeholder="ex: Responder saudações"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Gatilho</Label>
              <Select value={formData.trigger_type} onValueChange={(v) => setFormData({ ...formData, trigger_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGERS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prioridade</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label>Cooldown (segundos)</Label>
              <Input
                type="number"
                placeholder="5"
                value={formData.cooldown_seconds}
                onChange={(e) => setFormData({ ...formData, cooldown_seconds: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              placeholder="Descreva o comportamento desta automação"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2 bg-[#D97757] hover:bg-[#D97757]/90">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Criar Automação
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Automações */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Automações Configuradas</h3>
        {automations.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma automação criada ainda
            </CardContent>
          </Card>
        ) : (
          automations.map((automation, idx) => (
            <motion.div
              key={automation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`border-l-4 ${automation.is_active ? "border-l-blue-500" : "border-l-muted"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 cursor-pointer" onClick={() => setExpandedId(expandedId === automation.id ? null : automation.id)}>
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{automation.name}</h4>
                        {automation.is_active ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {TRIGGERS.find((t) => t.value === automation.trigger_type)?.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{automation.description}</p>
                      {expandedId === automation.id && (
                        <div className="mt-3 pt-3 border-t space-y-2 text-xs">
                          <p><strong>Prioridade:</strong> {automation.priority}</p>
                          <p><strong>Cooldown:</strong> {automation.cooldown_seconds}s</p>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={automation.is_active ? "outline" : "default"}
                        onClick={() => handleToggleActive(automation.id, automation.is_active)}
                      >
                        {automation.is_active ? "Desativar" : "Ativar"}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Edit2 className="w-3 h-3" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(automation.id)}
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

export default ChatAutomationsTab;
