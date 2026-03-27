import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Zap,
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ConversationFlowsTabProps {
  organizationId: string;
}

interface ConversationFlow {
  id: string;
  name: string;
  description: string;
  template_type: string;
  is_active: boolean;
}

const TEMPLATES = [
  { value: "welcome", label: "Boas-vindas + Qualificação" },
  { value: "prospecting", label: "Disparo de Prospecção" },
  { value: "satisfaction", label: "Pesquisa de Satisfação" },
  { value: "reengagement", label: "Re-engajamento" },
  { value: "blank", label: "Em Branco" },
];

const ConversationFlowsTab: React.FC<ConversationFlowsTabProps> = ({ organizationId }) => {
  const [flows, setFlows] = useState<ConversationFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    template_type: "blank",
  });

  useEffect(() => {
    loadFlows();
  }, [organizationId]);

  const loadFlows = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("conversation_flows")
        .select("*")
        .eq("organization_id", organizationId);

      if (error) throw error;
      setFlows(data || []);
    } catch (err) {
      console.error("Erro ao carregar fluxos:", err);
      toast.error("Erro ao carregar fluxos");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Informe o nome do fluxo");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("conversation_flows").insert([
        {
          organization_id: organizationId,
          name: formData.name,
          description: formData.description,
          template_type: formData.template_type,
          is_active: true,
        },
      ]);

      if (error) throw error;

      toast.success("✓ Fluxo criado com sucesso!");
      setFormData({
        name: "",
        description: "",
        template_type: "blank",
      });
      await loadFlows();
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      toast.error(err.message || "Erro ao salvar fluxo");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este fluxo?")) return;

    try {
      const { error } = await supabase.from("conversation_flows").delete().eq("id", id);

      if (error) throw error;

      toast.success("✓ Fluxo deletado");
      await loadFlows();
    } catch (err: any) {
      console.error("Erro ao deletar:", err);
      toast.error(err.message || "Erro ao deletar");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("conversation_flows")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;

      toast.success(isActive ? "✓ Desativado" : "✓ Ativado");
      await loadFlows();
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
            <Zap className="w-5 h-5 text-[#D97757]" />
            Criar Novo Fluxo de Conversa
          </CardTitle>
          <CardDescription>Configure um fluxo visual para guiar conversas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Nome do Fluxo</Label>
              <Input
                placeholder="ex: Fluxo de Boas-vindas"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Template</Label>
              <Select value={formData.template_type} onValueChange={(v) => setFormData({ ...formData, template_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              placeholder="Descreva o propósito deste fluxo"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2 bg-[#D97757] hover:bg-[#D97757]/90">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Criar Fluxo
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Fluxos */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Fluxos Configurados</h3>
        {flows.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum fluxo criado ainda
            </CardContent>
          </Card>
        ) : (
          flows.map((flow, idx) => (
            <motion.div
              key={flow.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`border-l-4 ${flow.is_active ? "border-l-amber-500" : "border-l-muted"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{flow.name}</h4>
                        {flow.is_active ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="text-xs bg-muted px-2 py-1 rounded">
                          {TEMPLATES.find((t) => t.value === flow.template_type)?.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{flow.description}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <Edit2 className="w-3 h-3" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant={flow.is_active ? "outline" : "default"}
                        onClick={() => handleToggleActive(flow.id, flow.is_active)}
                      >
                        {flow.is_active ? "Desativar" : "Ativar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(flow.id)}
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

export default ConversationFlowsTab;
