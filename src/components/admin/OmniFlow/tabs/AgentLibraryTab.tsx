import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Brain,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AgentLibraryTabProps {
  organizationId: string;
}

interface ProspectingCampaign {
  id: string;
  agent_name: string;
  agent_type: string;
  agent_personality: string;
  agent_style: string;
  agent_tone: string;
  is_active: boolean;
}

const AgentLibraryTab: React.FC<AgentLibraryTabProps> = ({ organizationId }) => {
  const [campaigns, setCampaigns] = useState<ProspectingCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("identity");
  const [formData, setFormData] = useState({
    agent_name: "",
    agent_type: "atendimento",
    agent_personality: "",
    agent_style: "profissional",
    agent_tone: "amigável",
    prompt: "",
  });

  useEffect(() => {
    loadCampaigns();
  }, [organizationId]);

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("prospecting_campaigns")
        .select("*")
        .eq("organization_id", organizationId);

      if (error) throw error;
      setCampaigns(data || []);
    } catch (err) {
      console.error("Erro ao carregar agentes:", err);
      toast.error("Erro ao carregar agentes");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.agent_name) {
      toast.error("Informe o nome do agente");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("prospecting_campaigns").insert([
        {
          organization_id: organizationId,
          agent_name: formData.agent_name,
          agent_type: formData.agent_type,
          agent_personality: formData.agent_personality,
          agent_style: formData.agent_style,
          agent_tone: formData.agent_tone,
          prompt: formData.prompt,
          is_active: true,
        },
      ]);

      if (error) throw error;

      toast.success("✓ Agente criado com sucesso!");
      resetForm();
      await loadCampaigns();
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      toast.error(err.message || "Erro ao salvar agente");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este agente?")) return;

    try {
      const { error } = await supabase.from("prospecting_campaigns").delete().eq("id", id);

      if (error) throw error;

      toast.success("✓ Agente deletado");
      await loadCampaigns();
    } catch (err: any) {
      console.error("Erro ao deletar:", err);
      toast.error(err.message || "Erro ao deletar");
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("prospecting_campaigns")
        .update({ is_active: !isActive })
        .eq("id", id);

      if (error) throw error;

      toast.success(isActive ? "✓ Desativado" : "✓ Ativado");
      await loadCampaigns();
    } catch (err: any) {
      console.error("Erro ao atualizar:", err);
      toast.error(err.message || "Erro ao atualizar");
    }
  };

  const resetForm = () => {
    setFormData({
      agent_name: "",
      agent_type: "atendimento",
      agent_personality: "",
      agent_style: "profissional",
      agent_tone: "amigável",
      prompt: "",
    });
    setEditingId(null);
    setActiveTab("identity");
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
            <Brain className="w-5 h-5 text-[#D97757]" />
            Criar Novo Agente IA
          </CardTitle>
          <CardDescription>Configure um agente de atendimento ou prospecção</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="identity">Identidade</TabsTrigger>
              <TabsTrigger value="instructions">Instruções</TabsTrigger>
              <TabsTrigger value="knowledge">Conhecimento</TabsTrigger>
              <TabsTrigger value="config">Config</TabsTrigger>
            </TabsList>

            {/* Aba 1: Identidade */}
            <TabsContent value="identity" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome do Agente</Label>
                  <Input
                    placeholder="ex: Atendente SAC"
                    value={formData.agent_name}
                    onChange={(e) => setFormData({ ...formData, agent_name: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Tipo</Label>
                  <Select value={formData.agent_type} onValueChange={(v) => setFormData({ ...formData, agent_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="atendimento">Atendimento</SelectItem>
                      <SelectItem value="prospeccao">Prospecção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Personalidade</Label>
                  <Input
                    placeholder="ex: Empático, paciente, prestativo"
                    value={formData.agent_personality}
                    onChange={(e) => setFormData({ ...formData, agent_personality: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Estilo</Label>
                  <Select value={formData.agent_style} onValueChange={(v) => setFormData({ ...formData, agent_style: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="amigavel">Amigável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="md:col-span-2">
                  <Label>Tom de Voz</Label>
                  <Select value={formData.agent_tone} onValueChange={(v) => setFormData({ ...formData, agent_tone: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amigável">Amigável</SelectItem>
                      <SelectItem value="profissional">Profissional</SelectItem>
                      <SelectItem value="entusiasmado">Entusiasmado</SelectItem>
                      <SelectItem value="neutro">Neutro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Aba 2: Instruções */}
            <TabsContent value="instructions" className="space-y-4 mt-4">
              <div>
                <Label>Prompt do Sistema</Label>
                <Textarea
                  placeholder="Instruções principais para o agente..."
                  value={formData.prompt}
                  onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                  rows={6}
                />
              </div>
            </TabsContent>

            {/* Aba 3: Conhecimento */}
            <TabsContent value="knowledge" className="space-y-4 mt-4">
              <div className="text-center py-8 text-muted-foreground">
                Base de conhecimento será gerenciada após criar o agente
              </div>
            </TabsContent>

            {/* Aba 4: Configuração */}
            <TabsContent value="config" className="space-y-4 mt-4">
              <div className="text-center py-8 text-muted-foreground">
                Configurações avançadas serão disponibilizadas após criar o agente
              </div>
            </TabsContent>
          </Tabs>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2 mt-4 bg-[#D97757] hover:bg-[#D97757]/90">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Criar Agente
          </Button>
        </CardContent>
      </Card>

      {/* Lista de Agentes */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Agentes Configurados</h3>
        {campaigns.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhum agente criado ainda
            </CardContent>
          </Card>
        ) : (
          campaigns.map((campaign, idx) => (
            <motion.div
              key={campaign.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className={`border-l-4 ${campaign.is_active ? "border-l-purple-500" : "border-l-muted"}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">{campaign.agent_name}</h4>
                        {campaign.is_active ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="text-xs bg-muted px-2 py-1 rounded capitalize">
                          {campaign.agent_type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {campaign.agent_personality} • {campaign.agent_style} • {campaign.agent_tone}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={campaign.is_active ? "outline" : "default"}
                        onClick={() => handleToggleActive(campaign.id, campaign.is_active)}
                      >
                        {campaign.is_active ? "Desativar" : "Ativar"}
                      </Button>
                      <Button size="sm" variant="outline" className="gap-2">
                        <Edit2 className="w-3 h-3" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(campaign.id)}
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

export default AgentLibraryTab;
