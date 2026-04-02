import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Plus, Trash2, Edit2, Play, Pause, Loader2, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { FlowService } from '@/services/flowService';
import { AutomationFlow } from '@/types/omniflow';

export default function AutomationFlows() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [flowName, setFlowName] = useState('');
  const [flowDescription, setFlowDescription] = useState('');
  const [selectedFlow, setSelectedFlow] = useState<AutomationFlow | null>(null);

  const { data: flows, isLoading } = useQuery({
    queryKey: ['automation_flows', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      return await FlowService.listFlows(user.id);
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      return await FlowService.createFlow(user.id, name, flowDescription);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation_flows'] });
      setFlowName('');
      setFlowDescription('');
      setIsDialogOpen(false);
      toast.success('Fluxo criado com sucesso!');
    },
    onError: () => toast.error('Erro ao criar fluxo'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (flowId: string) => { await FlowService.deleteFlow(flowId); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation_flows'] });
      toast.success('Fluxo deletado!');
    },
    onError: () => toast.error('Erro ao deletar fluxo'),
  });

  const toggleMutation = useMutation({
    mutationFn: async (flow: AutomationFlow) => {
      await FlowService.updateFlow(flow.id, { enabled: !flow.enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation_flows'] });
      toast.success('Fluxo atualizado!');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-orange-500/20 border border-primary/30">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            Fluxos de Automação
          </h1>
          <p className="text-sm text-muted-foreground mt-2">Crie e gerencie fluxos automáticos</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/80">
              <Plus className="w-4 h-4 mr-2" /> Novo Fluxo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Criar Novo Fluxo</DialogTitle>
              <DialogDescription>Configure um novo fluxo de automação</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium text-white">Nome do Fluxo</label>
                <Input value={flowName} onChange={(e) => setFlowName(e.target.value)}
                  placeholder="Ex: Onboarding de Clientes" className="mt-2 bg-slate-800 border-slate-700 text-white" />
              </div>
              <div>
                <label className="text-sm font-medium text-white">Descrição (Opcional)</label>
                <Input value={flowDescription} onChange={(e) => setFlowDescription(e.target.value)}
                  placeholder="Descreva o propósito deste fluxo" className="mt-2 bg-slate-800 border-slate-700 text-white" />
              </div>
              <Button onClick={() => createMutation.mutate(flowName)} disabled={!flowName || createMutation.isPending}
                className="w-full bg-primary hover:bg-primary/80">
                {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Criar Fluxo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {flows && flows.length === 0 ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl">
          <Zap className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">Nenhum fluxo criado</h3>
          <p className="text-sm text-slate-500 mb-6">Comece criando seu primeiro fluxo de automação</p>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-primary hover:bg-primary/80">
            <Plus className="w-4 h-4 mr-2" /> Criar Primeiro Fluxo
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flows?.map((flow) => (
            <motion.div key={flow.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -4 }}>
              <Card className="border-slate-800 bg-slate-900/50 hover:border-primary/50 transition-all h-full flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg">{flow.name}</CardTitle>
                      {flow.description && <CardDescription className="mt-1">{flow.description}</CardDescription>}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-bold ${flow.enabled ? 'bg-green-500/20 text-green-400' : 'bg-slate-600/20 text-slate-400'}`}>
                      {flow.enabled ? 'Ativo' : 'Inativo'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <div className="text-slate-500">Nós</div>
                      <div className="text-lg font-bold text-white">{flow.nodes?.length || 0}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                      <div className="text-slate-500">Conexões</div>
                      <div className="text-lg font-bold text-white">{flow.edges?.length || 0}</div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Atualizado em {new Date(flow.updatedAt).toLocaleDateString('pt-BR')}
                  </div>
                </CardContent>
                <div className="border-t border-slate-800 p-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1 border-slate-700" onClick={() => setSelectedFlow(flow)}>
                    <Edit2 className="w-3 h-3 mr-1" /> Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => toggleMutation.mutate(flow)}>
                    {flow.enabled ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-500" onClick={() => deleteMutation.mutate(flow.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
