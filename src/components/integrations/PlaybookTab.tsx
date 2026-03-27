import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, BookOpen, Copy, Plus, Zap, Loader2, CheckCircle2, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from "sonner";

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
    id: 'tpl_1',
    name: 'Qualificação Automática de Leads',
    description: 'Qualifique leads automaticamente com base em critérios predefinidos',
    category: 'Vendas',
    steps: ['Receber mensagem no WhatsApp', 'Extrair informações com IA', 'Validar contra critérios', 'Criar lead qualificado', 'Notificar time de vendas'],
    difficulty: 'easy',
    icon: '🎯',
  },
  {
    id: 'tpl_2',
    name: 'Atendimento 24/7 com Fallback',
    description: 'Atenda clientes com IA e escale para humano quando necessário',
    category: 'Suporte',
    steps: ['Receber mensagem', 'Processar com IA', 'Validar confiança da resposta', 'Se confiança < 70%, escalar', 'Notificar agente humano'],
    difficulty: 'medium',
    icon: '🤖',
  },
  {
    id: 'tpl_3',
    name: 'Prospecção em Massa',
    description: 'Envie mensagens personalizadas para múltiplos contatos',
    category: 'Prospecção',
    steps: ['Segmentar lista de contatos', 'Gerar mensagens personalizadas', 'Agendar envios', 'Monitorar respostas', 'Atualizar status de leads'],
    difficulty: 'hard',
    icon: '📢',
  }
];

export default function PlaybookTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPlaybook, setSelectedPlaybook] = useState<Playbook | null>(null);

  // Fetch custom playbooks from conversation_flows (using it as storage for playbooks too)
  const { data: customPlaybooks, isLoading } = useQuery({
    queryKey: ['custom_playbooks', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('conversation_flows' as any)
        .select('*')
        .eq('tenant_id', user?.id)
        .ilike('name', '%(Playbook)%');
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const cloneMutation = useMutation({
    mutationFn: async (playbook: Playbook) => {
      const { error } = await supabase
        .from('conversation_flows' as any)
        .insert({
          name: `${playbook.name} (Playbook)`,
          tenant_id: user?.id,
          flow_data: { 
            steps: playbook.steps, 
            template_id: playbook.id,
            category: playbook.category,
            difficulty: playbook.difficulty
          }
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_playbooks'] });
      toast.success("Playbook clonado com sucesso!");
      setSelectedPlaybook(null);
    },
    onError: (error: any) => {
      toast.error("Erro ao clonar: " + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('conversation_flows' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom_playbooks'] });
      toast.success("Playbook removido.");
    }
  });

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'bg-green-500/20 text-green-400 border-green-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      hard: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[difficulty] || colors.easy;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Playbooks</h2>
          <p className="text-slate-400">Modelos de fluxos prontos para o seu negócio</p>
        </div>
      </div>

      <Alert className="border-blue-600/50 bg-blue-900/20">
        <BookOpen className="h-4 w-4 text-blue-400" />
        <AlertDescription className="text-blue-200">
          Escolha um template abaixo para clonar e começar a usar imediatamente no seu hub.
        </AlertDescription>
      </Alert>

      {selectedPlaybook && (
        <Card className="border-[#D97757] bg-[#D97757]/5 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <span className="text-4xl p-3 bg-slate-900 rounded-2xl">{selectedPlaybook.icon}</span>
                <div>
                  <CardTitle className="text-white text-xl">{selectedPlaybook.name}</CardTitle>
                  <CardDescription className="text-slate-400">{selectedPlaybook.description}</CardDescription>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setSelectedPlaybook(null)} className="text-slate-500">✕</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Passos do Processo</h4>
                <div className="space-y-3">
                  {selectedPlaybook.steps.map((step, i) => (
                    <div key={i} className="flex items-center gap-3 text-slate-300">
                      <div className="w-6 h-6 rounded-full bg-[#D97757] text-white flex items-center justify-center text-xs font-bold">{i+1}</div>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col justify-end gap-3">
                <div className="flex gap-2 mb-4">
                  <Badge className={getDifficultyColor(selectedPlaybook.difficulty)}>{selectedPlaybook.difficulty.toUpperCase()}</Badge>
                  <Badge className="bg-slate-800 text-slate-400 border-slate-700">{selectedPlaybook.category}</Badge>
                </div>
                <Button 
                  onClick={() => cloneMutation.mutate(selectedPlaybook)} 
                  disabled={cloneMutation.isPending}
                  className="w-full bg-[#D97757] hover:bg-[#c86647] py-6 text-lg font-bold"
                >
                  {cloneMutation.isPending ? <Loader2 className="animate-spin w-5 h-5" /> : <><Copy className="w-5 h-5 mr-2" /> Clonar este Playbook</>}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {playbookTemplates.map((tpl) => (
          <Card 
            key={tpl.id} 
            onClick={() => setSelectedPlaybook(tpl)}
            className={`border-slate-800 bg-slate-900/50 hover:border-[#D97757]/50 cursor-pointer transition-all ${selectedPlaybook?.id === tpl.id ? 'border-[#D97757]' : ''}`}
          >
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <span className="text-3xl">{tpl.icon}</span>
                <Badge className={getDifficultyColor(tpl.difficulty)}>{tpl.difficulty}</Badge>
              </div>
              <h3 className="text-white font-bold mb-2">{tpl.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2">{tpl.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {customPlaybooks && customPlaybooks.length > 0 && (
        <div className="pt-8 border-t border-slate-800">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <CheckCircle2 className="text-[#D97757] w-5 h-5" /> Meus Playbooks Clonados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customPlaybooks.map((cp: any) => (
              <Card key={cp.id} className="border-slate-800 bg-slate-900/80">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <h4 className="text-white font-medium">{cp.name}</h4>
                    <p className="text-xs text-slate-500">Clonado em: {new Date(cp.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-slate-700 text-slate-400"><Zap className="w-4 h-4 mr-2" /> Ativar</Button>
                    <Button onClick={() => deleteMutation.mutate(cp.id)} variant="ghost" size="sm" className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
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
