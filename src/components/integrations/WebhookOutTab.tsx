import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Plus, Trash2, Edit2, AlertTriangle, Loader2 } from 'lucide-react';
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

export default function WebhookOutTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    method: 'POST',
    is_active: true,
  });

  // Fetch webhooks
  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhook_configs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_configs' as any)
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
        .from('webhook_configs' as any)
        .insert({ ...newData, tenant_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook_configs'] });
      toast.success("Webhook configurado!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error("Erro ao salvar: " + error.message);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('webhook_configs' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook_configs'] });
      toast.success("Webhook removido.");
    }
  });

  const resetForm = () => {
    setFormData({ name: '', url: '', method: 'POST', is_active: true });
  };

  const handleSave = () => {
    if (!formData.name || !formData.url) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <Alert className="border-yellow-600/50 bg-yellow-900/20">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-yellow-200">
          <strong>Webhooks de Saída:</strong> Envie eventos do seu CRM para ferramentas externas em tempo real.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Webhooks de Saída</h2>
          <p className="text-slate-400">Notifique sistemas externos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#D97757] hover:bg-[#c86647]"><Plus className="w-4 h-4 mr-2" /> Novo Webhook</Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader><DialogTitle className="text-white">Configurar Webhook</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Nome do Destino *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Ex: Zapier Lead" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">URL de Destino *</Label>
                <Input value={formData.url} onChange={(e) => setFormData({...formData, url: e.target.value})} placeholder="https://..." className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <Button onClick={handleSave} disabled={createMutation.isPending} className="w-full bg-[#D97757]">
                {createMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Salvar Webhook"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#D97757]" /></div>
        ) : webhooks?.length === 0 ? (
          <Alert className="border-slate-800 bg-slate-900/50">
            <AlertCircle className="h-4 w-4 text-[#D97757]" />
            <AlertDescription className="text-slate-400">Nenhum webhook configurado.</AlertDescription>
          </Alert>
        ) : (
          webhooks?.map((webhook: any) => (
            <Card key={webhook.id} className="border-slate-800 bg-slate-900/50">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{webhook.name}</h3>
                  <p className="text-sm text-slate-400">{webhook.method} • {webhook.url}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-slate-700 text-slate-400"><Edit2 className="w-4 h-4" /></Button>
                  <Button onClick={() => deleteMutation.mutate(webhook.id)} variant="outline" className="border-red-600 text-red-400 hover:bg-red-950">
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
