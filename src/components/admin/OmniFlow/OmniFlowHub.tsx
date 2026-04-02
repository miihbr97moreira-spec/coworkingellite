/**
 * Omni Flow Hub - Hub central de automações visuais
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import {
  Save,
  Play,
  Loader2,
  ArrowLeft,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { FlowPanel } from './FlowPanel';
import { nodeTypes } from './FlowNodeTypes';
import { FlowService } from '@/services/flowService';
import { AutomationFlow } from '@/types/omniflow';

interface OmniFlowHubProps {
  flowId?: string;
  onBack?: () => void;
}

export const OmniFlowHub: React.FC<OmniFlowHubProps> = ({ flowId, onBack }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedFlow, setSelectedFlow] = useState<AutomationFlow | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (flowId && user?.id) {
      loadFlow(flowId);
    }
  }, [flowId, user?.id]);

  const loadFlow = async (id: string) => {
    try {
      const flow = await FlowService.getFlow(id);
      setSelectedFlow(flow);
      setNodes(flow.nodes);
      setEdges(flow.edges);
    } catch (error) {
      toast.error('Erro ao carregar fluxo');
      console.error(error);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          { ...params, animated: true, style: { stroke: '#D97757', strokeWidth: 2 } },
          eds
        )
      );
    },
    [setEdges]
  );

  const addNode = useCallback(
    (nodeType: string, dataType: string, label: string) => {
      const newNode: Node = {
        id: `node_${Date.now()}`,
        type: nodeType,
        data: {
          label,
          triggerType: nodeType === 'trigger' ? dataType : undefined,
          actionType: nodeType === 'action' ? dataType : undefined,
        },
        position: { x: Math.random() * 400, y: Math.random() * 400 },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const handleSaveFlow = async () => {
    if (!selectedFlow) { toast.error('Nenhum fluxo selecionado'); return; }
    try {
      await FlowService.updateFlow(selectedFlow.id, { nodes, edges });
      toast.success('Fluxo salvo com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['automation_flows'] });
    } catch (error) {
      toast.error('Erro ao salvar fluxo');
      console.error(error);
    }
  };

  const handleRunFlow = async () => {
    if (!selectedFlow) { toast.error('Nenhum fluxo selecionado'); return; }
    setIsRunning(true);
    try {
      const testData = { leadId: 'test_lead_001', name: 'Lead Teste', email: 'teste@example.com', phone: '11999999999' };
      const execution = await FlowService.executeFlow(selectedFlow.id, testData);
      toast.success(`Fluxo executado! Status: ${execution.status}`);
    } catch (error) {
      toast.error('Erro ao executar fluxo');
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  if (!selectedFlow) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Omni Flow Hub</h2>
            <p className="text-slate-400">Crie automações visuais com gatilhos e ações</p>
          </div>
          {onBack && (
            <Button variant="ghost" onClick={onBack} className="text-slate-400">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          )}
        </div>

        <div className="grid gap-4">
          <Card className="border-slate-800 bg-slate-900/50">
            <CardHeader>
              <CardTitle className="text-white">Novo Fluxo</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => {
                  const newFlow: AutomationFlow = {
                    id: `flow_${Date.now()}`,
                    name: 'Novo Fluxo',
                    tenantId: user?.id || '',
                    nodes: [],
                    edges: [],
                    enabled: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  };
                  setSelectedFlow(newFlow);
                }}
                className="bg-[#D97757] hover:bg-[#c86647]"
              >
                Criar Novo Fluxo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-slate-900 p-4 rounded-lg border border-slate-800"
      >
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => setSelectedFlow(null)} className="text-slate-400">
            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
          </Button>
          <div>
            <h3 className="text-xl font-bold text-white">{selectedFlow.name}</h3>
            <p className="text-xs text-slate-500">{nodes.length} nós • {edges.length} conexões</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)} className="border-slate-700">
            <BarChart3 className="w-4 h-4 mr-2" /> Estatísticas
          </Button>
          <Button onClick={handleSaveFlow} className="bg-[#D97757] hover:bg-[#c86647]" size="sm">
            <Save className="w-4 h-4 mr-2" /> Salvar
          </Button>
          <Button onClick={handleRunFlow} disabled={isRunning} className="bg-green-600 hover:bg-green-700" size="sm">
            {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Executar
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 border border-slate-800 rounded-xl overflow-hidden bg-slate-950 relative"
        style={{ height: 'calc(100vh - 200px)' }}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          colorMode="dark"
        >
          <Background color="#334155" gap={20} />
          <Controls />
          <MiniMap nodeColor="#D97757" maskColor="rgba(0,0,0,0.5)" />
          <FlowPanel onAddNode={addNode} />
        </ReactFlow>
      </motion.div>

      {showStats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-4 p-4 bg-slate-900 rounded-lg border border-slate-800"
        >
          <Card className="border-slate-800 bg-slate-950">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">Total de Nós</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-white">{nodes.length}</div></CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-950">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">Conexões</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-white">{edges.length}</div></CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-950">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">Gatilhos</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-blue-400">{nodes.filter((n) => n.type === 'trigger').length}</div></CardContent>
          </Card>
          <Card className="border-slate-800 bg-slate-950">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-400">Ações</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-400">{nodes.filter((n) => n.type === 'action').length}</div></CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};
