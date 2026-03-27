import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Plus, Trash2, Edit2, Brain, Zap, Loader2, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from "sonner";

const agentTemplates = {
  'customer-service': [
    { id: 'sac', name: 'Atendente SAC', description: 'Responde dúvidas sobre produtos e serviços', icon: '🎧' },
    { id: 'reception', name: 'Recepcionista', description: 'Recebe clientes e agenda atendimentos', icon: '📞' },
    { id: 'support', name: 'Técnico de Suporte', description: 'Resolve problemas técnicos e erros', icon: '🔧' },
  ],
  'prospecting': [
    { id: 'qualifier', name: 'Qualificador de Leads', description: 'Qualifica e segmenta leads automaticamente', icon: '🎯' },
    { id: 'prospector', name: 'Prospector', description: 'Envia mensagens personalizadas e acompanha', icon: '📢' },
  ],
};

export default function AIAgentsTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentType, setAgentType] = useState<'customer-service' | 'prospecting'>('customer-service');

  // Fetch agents from Supabase (using prospecting_campaigns as a proxy or a dedicated table if exists)
  // For this implementation, we'll use a generic approach based on the schema
  const { data: agents, isLoading } = useQuery({
    queryKey: ['ai_agents', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prospecting_campaigns' as any)
        .select('*')
        .eq('tenant_id', user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      const { error } = await supabase
        .from('prospecting_campaigns' as any)
        .insert({
          ...newData,
          tenant_id: user?.id,
          status: 'draft'
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_agents'] });
      toast.success("Agente IA criado com sucesso!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Erro ao criar agente: " + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('prospecting_campaigns' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai_agents'] });
      toast.success("Agente removido.");
    }
  });

  const resetForm = () => {
    setAgentName('');
    setSelectedTemplate(null);
  };

  const handleCreate = () => {
    if (!agentName || !selectedTemplate) {
      toast.error("Preencha o nome e selecione um template");
      return;
    }
    createMutation.mutate({
      name: agentName,
      description: `Template: ${selectedTemplate}`,
      type: agentType
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Agentes IA</h2>
          <p className="text-slate-400">Automatize o atendimento e prospecção com inteligência</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#D97757] hover:bg-[#c86647] text-white">
              <Plus className="w-4 h-4 mr-2" /> Novo Agente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white text-xl">Configurar Agente IA</DialogTitle>
              <DialogDescription className="text-slate-400">Escolha um modelo base para seu novo agente.</DialogDescription>
            </DialogHeader>

            <Tabs value={agentType} onValueChange={(v: any) => setAgentType(v)} className="mt-4">
              <TabsList className="grid w-full grid-cols-2 bg-slate-900">
                <TabsTrigger value="customer-service">Atendimento</TabsTrigger>
                <TabsTrigger value="prospecting">Prospecção</TabsTrigger>
              </TabsList>

              {Object.entries(agentTemplates).map(([key, templates]) => (
                <TabsContent key={key} value={key} className="space-y-3 mt-4">
                  {templates.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTemplate(t.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 ${
                        selectedTemplate === t.id 
                          ? 'border-[#D97757] bg-[#D97757]/10' 
                          : 'border-slate-700 bg-slate-900/50 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-3xl p-3 bg-slate-800 rounded-lg">{t.icon}</span>
                      <div className="flex-1">
                        <h4 className="text-white font-bold">{t.name}</h4>
                        <p className="text-slate-400 text-sm">{t.description}</p>
                      </div>
                      {selectedTemplate === t.id && <CheckCircle2 className="text-[#D97757] w-6 h-6" />}
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>

            <div className="space-y-4 mt-6 border-t border-slate-700 pt-6">
              <div className="space-y-2">
                <Label className="text-slate-300">Nome do Agente *</Label>
                <Input 
                  value={agentName} 
                  onChange={(e) => setAgentName(e.target.value)} 
                  placeholder="Ex: Consultor Imobiliário" 
                  className="bg-slate-900 border-slate-700 text-white" 
                />
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleCreate} 
                  disabled={createMutation.isPending || !agentName || !selectedTemplate} 
                  className="flex-1 bg-[#D97757] hover:bg-[#c86647]"
                >
                  {createMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Criar Agente"}
                </Button>
                <Button onClick={() => setIsDialogOpen(false)} variant="outline" className="flex-1 border-slate-700 text-slate-300">Cancelar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 flex justify-center py-12"><Loader2 className="animate-spin text-[#D97757] w-10 h-10" /></div>
        ) : agents?.length === 0 ? (
          <Alert className="col-span-2 border-slate-800 bg-slate-900/50">
            <Brain className="w-5 h-5 text-[#D97757]" />
            <AlertDescription className="text-slate-400">Nenhum agente configurado. Comece criando um novo agente.</AlertDescription>
          </Alert>
        ) : (
          agents?.map((agent: any) => (
            <Card key={agent.id} className="border-slate-800 bg-slate-900/50 hover:border-[#D97757]/50 transition-all">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#D97757]/20 rounded-lg"><Brain className="w-5 h-5 text-[#D97757]" /></div>
                    <CardTitle className="text-white text-lg">{agent.name}</CardTitle>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${agent.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-slate-700 text-slate-400'}`}>
                    {agent.status.toUpperCase()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{agent.description || 'Sem descrição definida.'}</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 border-slate-700 text-slate-300"><Edit2 className="w-3 h-3 mr-2" /> Configurar</Button>
                  <Button onClick={() => deleteMutation.mutate(agent.id)} variant="outline" size="sm" className="border-red-900/50 text-red-500 hover:bg-red-900/20">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
