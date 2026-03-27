import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, BookOpen, Copy, Plus, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Playbook {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  icon: string;
}

const playbookTemplates: Playbook[] = [
  {
    id: '1',
    name: 'Qualificação Automática de Leads',
    description: 'Qualifique leads automaticamente com base em critérios predefinidos',
    category: 'Vendas',
    steps: [
      'Receber mensagem no WhatsApp',
      'Extrair informações com IA',
      'Validar contra critérios',
      'Criar lead qualificado',
      'Notificar time de vendas',
    ],
    difficulty: 'easy',
    icon: '🎯',
  },
  {
    id: '2',
    name: 'Atendimento 24/7 com Fallback',
    description: 'Atenda clientes com IA e escale para humano quando necessário',
    category: 'Suporte',
    steps: [
      'Receber mensagem',
      'Processar com IA',
      'Validar confiança da resposta',
      'Se confiança < 70%, escalar',
      'Notificar agente humano',
    ],
    difficulty: 'medium',
    icon: '🤖',
  },
  {
    id: '3',
    name: 'Prospecção em Massa',
    description: 'Envie mensagens personalizadas para múltiplos contatos',
    category: 'Prospecção',
    steps: [
      'Segmentar lista de contatos',
      'Gerar mensagens personalizadas',
      'Agendar envios',
      'Monitorar respostas',
      'Atualizar status de leads',
    ],
    difficulty: 'hard',
    icon: '📢',
  },
  {
    id: '4',
    name: 'Sincronização com CRM',
    description: 'Sincronize dados em tempo real entre WhatsApp e seu CRM',
    category: 'Integrações',
    steps: [
      'Capturar evento de contato',
      'Enriquecer dados',
      'Validar no CRM',
      'Criar ou atualizar registro',
      'Registrar em log',
    ],
    difficulty: 'medium',
    icon: '🔄',
  },
  {
    id: '5',
    name: 'Feedback e Pesquisa',
    description: 'Colete feedback de clientes automaticamente',
    category: 'Experiência',
    steps: [
      'Após conclusão de atendimento',
      'Enviar pesquisa de satisfação',
      'Processar respostas',
      'Armazenar em banco de dados',
      'Gerar relatório',
    ],
    difficulty: 'easy',
    icon: '⭐',
  },
  {
    id: '6',
    name: 'Agendamento de Reuniões',
    description: 'Agende reuniões automaticamente via WhatsApp',
    category: 'Produtividade',
    steps: [
      'Cliente solicita agendamento',
      'Verificar disponibilidade',
      'Confirmar horário',
      'Criar evento no calendário',
      'Enviar confirmação',
    ],
    difficulty: 'hard',
    icon: '📅',
  },
];

export default function PlaybookTab() {
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);
  const [customPlaybooks, setCustomPlaybooks] = useState<Playbook[]>([]);

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-green-900/30 text-green-300',
      medium: 'bg-yellow-900/30 text-yellow-300',
      hard: 'bg-red-900/30 text-red-300',
    };
    return colors[difficulty] || colors.easy;
  };

  const getDifficultyLabel = (difficulty: string) => {
    const labels: Record<string, string> = {
      easy: 'Fácil',
      medium: 'Médio',
      hard: 'Difícil',
    };
    return labels[difficulty] || difficulty;
  };

  const handleUsePlaybook = (playbook: Playbook) => {
    setSelectedPlaybook(playbook);
  };

  const handleClonePlaybook = (playbook: Playbook) => {
    const cloned = {
      ...playbook,
      id: Date.now().toString(),
      name: `${playbook.name} (Cópia)`,
    };
    setCustomPlaybooks((prev) => [...prev, cloned]);
    alert(`Playbook "${cloned.name}" criado com sucesso!`);
  };

  const allPlaybooks = [...playbookTemplates, ...customPlaybooks];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">Playbooks</h2>
        <p className="text-slate-400">Modelos prontos para acelerar sua implementação</p>
      </div>

      {/* Alert */}
      <Alert className="border-blue-600/50 bg-blue-900/20">
        <BookOpen className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200">
          <strong>Playbooks</strong> são fluxos de trabalho pré-configurados que combinam
          integrações, automações e ações de CRM. Clone um template e customize conforme necessário.
        </AlertDescription>
      </Alert>

      {/* Selected Playbook Detail */}
      {selectedPlaybook && (
        <Card className="border-[#D97757] bg-slate-800/50">
          <CardHeader className="border-b border-slate-700">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{selectedPlaybook.icon}</span>
                <div>
                  <CardTitle className="text-white">{selectedPlaybook.name}</CardTitle>
                  <CardDescription className="text-slate-400">
                    {selectedPlaybook.description}
                  </CardDescription>
                </div>
              </div>
              <Button
                onClick={() => setSelectedPlaybook(null)}
                variant="ghost"
                className="text-slate-400"
              >
                ✕
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-2">
              <Badge className={getDifficultyColor(selectedPlaybook.difficulty)}>
                {getDifficultyLabel(selectedPlaybook.difficulty)}
              </Badge>
              <Badge className="bg-slate-700 text-slate-300">
                {selectedPlaybook.category}
              </Badge>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3">Etapas do Fluxo</h4>
              <ol className="space-y-2">
                {selectedPlaybook.steps.map((step, index) => (
                  <li key={index} className="flex gap-3 text-slate-300">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#D97757] text-white flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => handleClonePlaybook(selectedPlaybook)}
                className="bg-[#D97757] hover:bg-[#c86647] text-white flex-1"
              >
                <Copy className="w-4 h-4 mr-2" />
                Clonar Playbook
              </Button>
              <Button
                variant="outline"
                className="border-slate-600 text-slate-300 flex-1"
              >
                <Zap className="w-4 h-4 mr-2" />
                Executar Agora
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Playbooks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allPlaybooks.map((playbook) => (
          <Card
            key={playbook.id}
            className="border-slate-700 bg-slate-800/50 hover:border-[#D97757] transition cursor-pointer"
            onClick={() => handleUsePlaybook(playbook)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <span className="text-3xl">{playbook.icon}</span>
                <Badge className={getDifficultyColor(playbook.difficulty)}>
                  {getDifficultyLabel(playbook.difficulty)}
                </Badge>
              </div>

              <h3 className="text-white font-semibold mb-1">{playbook.name}</h3>
              <p className="text-slate-400 text-sm mb-3">{playbook.description}</p>

              <div className="flex items-center justify-between">
                <Badge className="bg-slate-700 text-slate-300">
                  {playbook.category}
                </Badge>
                <span className="text-slate-400 text-xs">
                  {playbook.steps.length} etapas
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Create Custom Playbook */}
        <Card className="border-dashed border-slate-600 bg-slate-800/30 hover:border-[#D97757] transition cursor-pointer flex items-center justify-center min-h-64">
          <CardContent className="text-center">
            <Plus className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-slate-300 font-semibold">Criar Playbook</p>
            <p className="text-slate-500 text-sm">Personalizado</p>
          </CardContent>
        </Card>
      </div>

      {/* Custom Playbooks Section */}
      {customPlaybooks.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-white mb-4">Meus Playbooks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {customPlaybooks.map((playbook) => (
              <Card
                key={playbook.id}
                className="border-slate-700 bg-slate-800/50 hover:border-[#D97757] transition"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-3xl">{playbook.icon}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-slate-400"
                      onClick={() =>
                        setCustomPlaybooks((prev) =>
                          prev.filter((p) => p.id !== playbook.id)
                        )
                      }
                    >
                      ✕
                    </Button>
                  </div>

                  <h3 className="text-white font-semibold mb-1">{playbook.name}</h3>
                  <p className="text-slate-400 text-sm mb-3">{playbook.description}</p>

                  <div className="flex items-center justify-between">
                    <Badge className="bg-slate-700 text-slate-300">
                      {playbook.category}
                    </Badge>
                    <span className="text-slate-400 text-xs">
                      {playbook.steps.length} etapas
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
