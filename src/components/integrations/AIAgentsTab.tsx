import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, Plus, Trash2, Edit2, Brain, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface AIAgent {
  id: string;
  name: string;
  type: 'customer-service' | 'prospecting';
  template: string;
  status: 'draft' | 'active';
  created_at: string;
}

const agentTemplates = {
  'customer-service': [
    {
      id: 'template-1',
      name: 'Atendente SAC',
      description: 'Responde dúvidas sobre produtos e serviços',
      icon: '🎧',
    },
    {
      id: 'template-2',
      name: 'Recepcionista',
      description: 'Recebe clientes e agenda atendimentos',
      icon: '📞',
    },
    {
      id: 'template-3',
      name: 'Técnico de Suporte',
      description: 'Resolve problemas técnicos e erros',
      icon: '🔧',
    },
  ],
  prospecting: [
    {
      id: 'template-4',
      name: 'Qualificador de Leads',
      description: 'Qualifica e segmenta leads automaticamente',
      icon: '🎯',
    },
    {
      id: 'template-5',
      name: 'Prospector',
      description: 'Envia mensagens personalizadas e acompanha',
      icon: '📢',
    },
    {
      id: 'template-6',
      name: 'Pesquisador de Mercado',
      description: 'Coleta informações sobre prospects',
      icon: '📊',
    },
  ],
};

export default function AIAgentsTab() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [agentName, setAgentName] = useState('');
  const [agentType, setAgentType] = useState<'customer-service' | 'prospecting'>('customer-service');

  const handleCreateAgent = () => {
    if (!agentName.trim() || !selectedTemplate) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    const newAgent: AIAgent = {
      id: Date.now().toString(),
      name: agentName,
      type: agentType,
      template: selectedTemplate,
      status: 'draft',
      created_at: new Date().toLocaleDateString('pt-BR'),
    };

    setAgents((prev) => [...prev, newAgent]);
    setAgentName('');
    setSelectedTemplate(null);
    setIsDialogOpen(false);
  };

  const handleDeleteAgent = (id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  const handleToggleStatus = (id: string) => {
    setAgents((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, status: a.status === 'draft' ? 'active' : 'draft' }
          : a
      )
    );
  };

  const getTemplateInfo = (templateId: string) => {
    for (const category in agentTemplates) {
      const template = agentTemplates[category as keyof typeof agentTemplates].find(
        (t) => t.id === templateId
      );
      if (template) return template;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Agentes IA</h2>
          <p className="text-slate-400">Configure agentes inteligentes para automatizar tarefas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#D97757] hover:bg-[#c86647] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Novo Agente
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Criar Novo Agente IA</DialogTitle>
              <DialogDescription className="text-slate-400">
                Selecione um template e personalize seu agente
              </DialogDescription>
            </DialogHeader>

            <Tabs value={agentType} onValueChange={(value) => setAgentType(value as any)}>
              <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                <TabsTrigger value="customer-service">Atendimento</TabsTrigger>
                <TabsTrigger value="prospecting">Prospecção</TabsTrigger>
              </TabsList>

              <TabsContent value="customer-service" className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {agentTemplates['customer-service'].map((template) => (
                    <Card
                      key={template.id}
                      className={`border-slate-700 bg-slate-800/50 cursor-pointer transition ${
                        selectedTemplate === template.id
                          ? 'border-[#D97757] bg-slate-800'
                          : 'hover:border-slate-600'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{template.icon}</span>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold">{template.name}</h4>
                            <p className="text-slate-400 text-sm">{template.description}</p>
                          </div>
                          {selectedTemplate === template.id && (
                            <span className="text-[#D97757] text-lg">✓</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="prospecting" className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {agentTemplates['prospecting'].map((template) => (
                    <Card
                      key={template.id}
                      className={`border-slate-700 bg-slate-800/50 cursor-pointer transition ${
                        selectedTemplate === template.id
                          ? 'border-[#D97757] bg-slate-800'
                          : 'hover:border-slate-600'
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{template.icon}</span>
                          <div className="flex-1">
                            <h4 className="text-white font-semibold">{template.name}</h4>
                            <p className="text-slate-400 text-sm">{template.description}</p>
                          </div>
                          {selectedTemplate === template.id && (
                            <span className="text-[#D97757] text-lg">✓</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="agent_name" className="text-slate-300">
                  Nome do Agente *
                </Label>
                <Input
                  id="agent_name"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="Ex: Agente de Vendas Principal"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateAgent}
                  className="bg-[#D97757] hover:bg-[#c86647] text-white flex-1"
                >
                  Criar Agente
                </Button>
                <Button
                  onClick={() => setIsDialogOpen(false)}
                  variant="outline"
                  className="border-slate-600 text-slate-300 flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Agents List */}
      <div className="space-y-4">
        {agents.length === 0 ? (
          <Alert className="border-slate-700 bg-slate-800/50">
            <AlertCircle className="h-4 w-4 text-[#D97757]" />
            <AlertDescription className="text-slate-300">
              Nenhum agente criado. Clique em "Novo Agente" para começar.
            </AlertDescription>
          </Alert>
        ) : (
          agents.map((agent) => {
            const template = getTemplateInfo(agent.template);
            return (
              <Card key={agent.id} className="border-slate-700 bg-slate-800/50">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-white">{agent.name}</h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            agent.status === 'active'
                              ? 'bg-green-900/30 text-green-300'
                              : 'bg-yellow-900/30 text-yellow-300'
                          }`}
                        >
                          {agent.status === 'active' ? 'Ativo' : 'Rascunho'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mt-1">
                        {template?.icon} {template?.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        Criado em: {agent.created_at}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleToggleStatus(agent.id)}
                        variant="outline"
                        className={`border-slate-600 ${
                          agent.status === 'active'
                            ? 'text-green-400'
                            : 'text-yellow-400'
                        }`}
                      >
                        {agent.status === 'active' ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-slate-600 text-slate-300"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteAgent(agent.id)}
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-950"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Info Section */}
      <Alert className="border-blue-600/50 bg-blue-900/20">
        <Brain className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200">
          <strong>Agentes IA:</strong> Use templates pré-treinados ou crie agentes personalizados.
          Configure identidade, comportamento, roteamento e conhecimento para cada agente.
        </AlertDescription>
      </Alert>
    </div>
  );
}
