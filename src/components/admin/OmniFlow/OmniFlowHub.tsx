/**
 * Omni Flow Hub - Hub central de automações visuais
 * Implementa React Flow com gatilhos e ações customizadas
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
  Edge,
  Node,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import {
  Save,
  Play,
  Loader2,
  ArrowLeft,
  Trash2,
  Copy,
  MoreVertical,
  Eye,
  EyeOff,
  Settings,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  const { getNodes, getEdges } = useReactFlow();
  const queryClient = useQueryClient();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedFlow, setSelectedFlow] = useState<AutomationFlow | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Carregar fluxo se flowId for fornecido
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
          {
            ...params,
            animated: true,
            style: { stroke: '#D97757', strokeWidth: 2 },
          },
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
        position: {
          x: Math.random() * 400,
          y: Math.random() * 400,
        },
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const handleSaveFlow = async () => {
    if (!selectedFlow) {
      toast.error('Nenhum fluxo selecionado');
      return;
    }

    try {
      const currentNodes = getNodes();
      const currentEdges = getEdges();

      await FlowService.updateFlow(selectedFlow.id, {
        nodes: currentNodes,
        edges: currentEdges,
      });

      toast.success('Fluxo salvo com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['automation_flows'] });
    } catch (error) {
      toast.error('Erro ao salvar fluxo');
      console.error(error);
    }
  };

  const handleRunFlow = async () => {
    if (!selectedFlow) {
      toast.error('Nenhum fluxo selecionado');
      return;
    }

    setIsRunning(true);
    try {
      // Executar fluxo com dados de teste
      const testData = {
        leadId: 'test_lead_001',
        name: 'Lead Teste',
        email: 'teste@example.com',
        phone: '11999999999',
      };

      const execution = await FlowService.executeFlow(selectedFlow.id, testData);
      toast.success(`Fluxo executado! Status: ${execution.status}`);
    } catch (error) {
      toast.error('Erro ao executar fluxo');
      console.error(error);
    } finally {
      setIsRunning(false);
    }
  };

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) =>
        eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
      );
    },
    [setNodes, setEdges]
  );

  if (!selectedFlow) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Omni Flow Hub</h2>
            <p className="text-slate-400">
              Crie automações visuais com gatilhos e ações
            </p>
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
              <CardDescription>
                Comece criando um novo fluxo de automação
              </CardDescription>
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between bg-slate-900 p-4 rounded-lg border border-slate-800"
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => setSelectedFlow(null)}
            className="text-slate-400"
          >\n            <ArrowLeft className="w-4 h-4 mr-2" /> Voltar\n          </Button>\n          <div>\n            <h3 className=\"text-xl font-bold text-white\">{selectedFlow.name}</h3>\n            <p className=\"text-xs text-slate-500\">\n              {nodes.length} nós • {edges.length} conexões\n            </p>\n          </div>\n        </div>\n\n        <div className=\"flex gap-2\">\n          <Button\n            variant=\"outline\"\n            size=\"sm\"\n            onClick={() => setShowStats(!showStats)}\n            className=\"border-slate-700\"\n          >\n            <BarChart3 className=\"w-4 h-4 mr-2\" />\n            Estatísticas\n          </Button>\n          <Button\n            onClick={handleSaveFlow}\n            className=\"bg-[#D97757] hover:bg-[#c86647]\"\n            size=\"sm\"\n          >\n            <Save className=\"w-4 h-4 mr-2\" />\n            Salvar\n          </Button>\n          <Button\n            onClick={handleRunFlow}\n            disabled={isRunning}\n            className=\"bg-green-600 hover:bg-green-700\"\n            size=\"sm\"\n          >\n            {isRunning ? (\n              <Loader2 className=\"w-4 h-4 mr-2 animate-spin\" />\n            ) : (\n              <Play className=\"w-4 h-4 mr-2\" />\n            )}\n            Executar\n          </Button>\n        </div>\n      </motion.div>\n\n      {/* Canvas */}\n      <motion.div\n        initial={{ opacity: 0 }}\n        animate={{ opacity: 1 }}\n        className=\"flex-1 border border-slate-800 rounded-xl overflow-hidden bg-slate-950 relative\"\n        style={{ height: 'calc(100vh - 200px)' }}\n      >\n        <ReactFlow\n          nodes={nodes}\n          edges={edges}\n          onNodesChange={onNodesChange}\n          onEdgesChange={onEdgesChange}\n          onConnect={onConnect}\n          nodeTypes={nodeTypes}\n          fitView\n          colorMode=\"dark\"\n        >\n          <Background color=\"#334155\" gap={20} />\n          <Controls />\n          <MiniMap nodeColor=\"#D97757\" maskColor=\"rgba(0,0,0,0.5)\" />\n          <FlowPanel onAddNode={addNode} />\n        </ReactFlow>\n      </motion.div>\n\n      {/* Stats Panel */}\n      {showStats && (\n        <motion.div\n          initial={{ opacity: 0, y: 20 }}\n          animate={{ opacity: 1, y: 0 }}\n          className=\"grid grid-cols-4 gap-4 p-4 bg-slate-900 rounded-lg border border-slate-800\"\n        >\n          <Card className=\"border-slate-800 bg-slate-950\">\n            <CardHeader className=\"pb-2\">\n              <CardTitle className=\"text-sm text-slate-400\">Total de Nós</CardTitle>\n            </CardHeader>\n            <CardContent>\n              <div className=\"text-2xl font-bold text-white\">{nodes.length}</div>\n            </CardContent>\n          </Card>\n          <Card className=\"border-slate-800 bg-slate-950\">\n            <CardHeader className=\"pb-2\">\n              <CardTitle className=\"text-sm text-slate-400\">Conexões</CardTitle>\n            </CardHeader>\n            <CardContent>\n              <div className=\"text-2xl font-bold text-white\">{edges.length}</div>\n            </CardContent>\n          </Card>\n          <Card className=\"border-slate-800 bg-slate-950\">\n            <CardHeader className=\"pb-2\">\n              <CardTitle className=\"text-sm text-slate-400\">Gatilhos</CardTitle>\n            </CardHeader>\n            <CardContent>\n              <div className=\"text-2xl font-bold text-blue-400\">\n                {nodes.filter((n) => n.type === 'trigger').length}\n              </div>\n            </CardContent>\n          </Card>\n          <Card className=\"border-slate-800 bg-slate-950\">\n            <CardHeader className=\"pb-2\">\n              <CardTitle className=\"text-sm text-slate-400\">Ações</CardTitle>\n            </CardHeader>\n            <CardContent>\n              <div className=\"text-2xl font-bold text-green-400\">\n                {nodes.filter((n) => n.type === 'action').length}\n              </div>\n            </CardContent>\n          </Card>\n        </motion.div>\n      )}\n    </div>\n  );\n};\n
