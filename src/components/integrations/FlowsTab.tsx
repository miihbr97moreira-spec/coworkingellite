import { useState, useCallback, useEffect } from 'react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Connection,
  Edge,
  Node,
  Panel
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Plus, Trash2, Play, Save, Loader2, ArrowLeft } from 'lucide-react';
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

const initialNodes: Node[] = [];
const initialEdges: Edge[] = [];

export default function FlowsTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedFlow, setSelectedFlow] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [flowName, setFlowName] = useState('');
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#D97757' } }, eds)),
    [setEdges]
  );

  // Fetch flows
  const { data: flows, isLoading } = useQuery({
    queryKey: ['conversation_flows', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_flows' as any)
        .select('*')
        .eq('tenant_id', user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Save flow mutation
  const saveMutation = useMutation({
    mutationFn: async (flowData: any) => {
      const { error } = await supabase
        .from('conversation_flows' as any)
        .upsert({
          id: selectedFlow?.id,
          name: selectedFlow?.name,
          tenant_id: user?.id,
          flow_data: flowData,
          updated_at: new Date().toISOString()
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation_flows'] });
      toast.success("Fluxo salvo com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar fluxo: " + error.message);
    }
  });

  // Create flow mutation
  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('conversation_flows' as any)
        .insert({
          name,
          tenant_id: user?.id,
          flow_data: { nodes: [], edges: [] }
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversation_flows'] });
      setSelectedFlow(data);
      setNodes([]);
      setEdges([]);
      setIsDialogOpen(false);
      setFlowName('');
      toast.success("Fluxo criado!");
    }
  });

  const handleSave = () => {
    if (!selectedFlow) return;
    saveMutation.mutate({ nodes, edges });
  };

  const handleEdit = (flow: any) => {
    setSelectedFlow(flow);
    const flowData = flow.flow_data || { nodes: [], edges: [] };
    setNodes(flowData.nodes || []);
    setEdges(flowData.edges || []);
  };

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `node_${Date.now()}`,
      type: 'default',
      data: { label: `${type.toUpperCase()} - Nova Etapa` },
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      style: { background: '#1e293b', color: '#fff', border: '1px solid #D97757', borderRadius: '8px' }
    };
    setNodes((nds) => nds.concat(newNode));
  };

  if (selectedFlow) {
    return (
      <div className="h-[700px] w-full flex flex-col space-y-4">
        <div className="flex items-center justify-between bg-slate-900 p-4 rounded-lg border border-slate-800">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => setSelectedFlow(null)} className="text-slate-400">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <h3 className="text-xl font-bold text-white">{selectedFlow.name}</h3>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-[#D97757] hover:bg-[#c86647]">
              {saveMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Fluxo
            </Button>
          </div>
        </div>

        <div className="flex-1 border border-slate-800 rounded-xl overflow-hidden bg-slate-950 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            colorMode="dark"
          >
            <Background color="#334155" gap={20} />
            <Controls />
            <MiniMap nodeColor="#D97757" maskColor="rgba(0,0,0,0.5)" />
            <Panel position="top-right" className="flex flex-col gap-2">
              <Button size="sm" onClick={() => addNode('mensagem')} className="bg-slate-800 hover:bg-slate-700 text-xs">💬 + Mensagem</Button>
              <Button size="sm" onClick={() => addNode('ação')} className="bg-slate-800 hover:bg-slate-700 text-xs">⚙️ + Ação CRM</Button>
              <Button size="sm" onClick={() => addNode('ia')} className="bg-slate-800 hover:bg-slate-700 text-xs">🤖 + Agente IA</Button>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Fluxos de Conversa</h2>
          <p className="text-slate-400">Crie árvores de decisão e automações visuais</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#D97757] hover:bg-[#c86647]">
              <Plus className="w-4 h-4 mr-2" /> Novo Fluxo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader><DialogTitle className="text-white">Nome do Fluxo</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <Input value={flowName} onChange={(e) => setFlowName(e.target.value)} placeholder="Ex: Onboarding Cliente" className="bg-slate-700 border-slate-600 text-white" />
              <Button onClick={() => createMutation.mutate(flowName)} disabled={createMutation.isPending} className="w-full bg-[#D97757]">Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-3 flex justify-center py-12"><Loader2 className="animate-spin text-[#D97757]" /></div>
        ) : flows?.length === 0 ? (
          <Alert className="col-span-3 border-slate-800 bg-slate-900/50">
            <AlertCircle className="w-4 h-4 text-[#D97757]" />
            <AlertDescription className="text-slate-400">Nenhum fluxo visual criado ainda.</AlertDescription>
          </Alert>
        ) : (
          flows?.map((flow: any) => (
            <Card key={flow.id} className="border-slate-800 bg-slate-900/50 hover:border-[#D97757] transition-all cursor-pointer" onClick={() => handleEdit(flow)}>
              <CardHeader>
                <CardTitle className="text-white text-lg">{flow.name}</CardTitle>
                <CardDescription className="text-slate-500">Última alteração: {new Date(flow.updated_at).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400">{(flow.flow_data?.nodes?.length || 0)} nós no canvas</span>
                  <Button variant="ghost" size="sm" className="text-[#D97757]"><Play className="w-3 h-3 mr-1" /> Editar</Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
