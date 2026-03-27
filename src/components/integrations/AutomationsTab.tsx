import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Plus, Trash2, Edit2, Loader2 } from 'lucide-react';
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

export default function AutomationsTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    trigger_type: 'keyword',
    trigger_value: '',
    action_type: 'auto-reply',
    action_value: '',
  });

  // Fetch automations from Supabase
  const { data: automations, isLoading } = useQuery({
    queryKey: ['chat_automations', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chat_automations' as any)
        .select('*')
        .eq('tenant_id', user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (newData: any) => {
      const { error } = await supabase
        .from('chat_automations' as any)
        .insert({ ...newData, tenant_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat_automations'] });
      toast.success("Automação criada com sucesso!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao criar: " + error.message);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chat_automations' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat_automations'] });
      toast.success("Automação removida.");
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      trigger_type: 'keyword',
      trigger_value: '',
      action_type: 'auto-reply',
      action_value: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.name || (formData.trigger_type !== 'all' && !formData.trigger_value)) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Automações</h2>
          <p className="text-slate-400">Regras inteligentes para mensagens recebidas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#D97757] hover:bg-[#c86647] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nova Automação
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Configurar Automação</DialogTitle>
              <DialogDescription className="text-slate-400">Crie regras para disparar ações automaticamente.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Nome da Regra *</Label>
                <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Ex: Saudação Inicial" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Gatilho</Label>
                <Select value={formData.trigger_type} onValueChange={(v) => handleSelectChange('trigger_type', v)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="keyword">Palavra-chave</SelectItem>
                    <SelectItem value="regex">Expressão Regular (Regex)</SelectItem>
                    <SelectItem value="all">Qualquer mensagem</SelectItem>
                  </SelectContent>
                </Select>
                {formData.trigger_type !== 'all' && (
                  <Input name="trigger_value" value={formData.trigger_value} onChange={handleInputChange} placeholder="Ex: oi, olá, preço" className="bg-slate-700 border-slate-600 text-white" />
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Ação</Label>
                <Select value={formData.action_type} onValueChange={(v) => handleSelectChange('action_type', v)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto-reply">Resposta Automática</SelectItem>
                    <SelectItem value="ai-agent">Agente IA</SelectItem>
                    <SelectItem value="qualification">Qualificação Automática</SelectItem>
                  </SelectContent>
                </Select>
                <Input name="action_value" value={formData.action_value} onChange={handleInputChange} placeholder="Mensagem ou ID do Agente" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={createMutation.isPending} className="bg-[#D97757] hover:bg-[#c86647] flex-1">
                  {createMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Criar Automação"}
                </Button>
                <Button onClick={() => setIsDialogOpen(false)} variant="outline" className="border-slate-600 text-slate-300 flex-1">Cancelar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#D97757] w-8 h-8" /></div>
        ) : automations?.length === 0 ? (
          <Alert className="border-slate-700 bg-slate-800/50">
            <AlertCircle className="h-4 w-4 text-[#D97757]" />
            <AlertDescription className="text-slate-300">Nenhuma automação ativa.</AlertDescription>
          </Alert>
        ) : (
          automations?.map((auto: any) => (
            <Card key={auto.id} className="border-slate-700 bg-slate-800/50">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{auto.name}</h3>
                  <p className="text-sm text-slate-400">
                    Gatilho: {auto.trigger_type} ({auto.trigger_value || 'Qualquer'}) → {auto.action_type}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-slate-600 text-slate-300"><Edit2 className="w-4 h-4" /></Button>
                  <Button onClick={() => deleteMutation.mutate(auto.id)} variant="outline" className="border-red-600 text-red-400 hover:bg-red-950">
                    <Trash2 className="w-4 h-4" />
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
