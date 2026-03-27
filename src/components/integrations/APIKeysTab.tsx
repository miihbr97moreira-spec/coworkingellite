import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Plus, Trash2, Eye, EyeOff, Copy, Zap, Lock, Loader2 } from 'lucide-react';
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

export default function APIKeysTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    name: '',
    provider: 'groq' as const,
    api_key: '',
  });

  // Fetch API keys from Supabase
  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api_keys', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys' as any)
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
        .from('api_keys' as any)
        .insert({ ...newData, tenant_id: user?.id, is_default: apiKeys?.length === 0 });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_keys'] });
      toast.success("Chave de API adicionada com sucesso!");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao adicionar: " + error.message);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_keys' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api_keys'] });
      toast.success("Chave de API removida.");
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      provider: 'groq',
      api_key: '',
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData((prev) => ({ ...prev, provider: value as any }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.api_key) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createMutation.mutate(formData);
  };

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">API Keys</h2>
          <p className="text-slate-400">O cofre seguro para suas chaves de IA (BYOK)</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#D97757] hover:bg-[#c86647] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Chave
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Adicionar Chave de API</DialogTitle>
              <DialogDescription className="text-slate-400">Sua chave será armazenada com criptografia de ponta.</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Provedor</Label>
                <Select value={formData.provider} onValueChange={handleSelectChange}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="groq">Groq (Recomendado)</SelectItem>
                    <SelectItem value="openai">OpenAI (GPT-4/3.5)</SelectItem>
                    <SelectItem value="google-gemini">Google Gemini</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Nome da Chave *</Label>
                <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Ex: Produção Groq" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Chave de API *</Label>
                <Input name="api_key" type="password" value={formData.api_key} onChange={handleInputChange} placeholder="sk_..." className="bg-slate-700 border-slate-600 text-white font-mono" />
              </div>
              <Alert className="border-yellow-600/50 bg-yellow-900/20">
                <Lock className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-200 text-sm">Nunca compartilhamos suas chaves. Elas são usadas apenas para processar seus agentes.</AlertDescription>
              </Alert>
              <div className="flex gap-2 pt-4">
                <Button onClick={handleSave} disabled={createMutation.isPending} className="bg-[#D97757] hover:bg-[#c86647] flex-1">
                  {createMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Salvar Chave"}
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
        ) : apiKeys?.length === 0 ? (
          <Alert className="border-slate-700 bg-slate-800/50">
            <AlertCircle className="h-4 w-4 text-[#D97757]" />
            <AlertDescription className="text-slate-300">Nenhuma chave configurada.</AlertDescription>
          </Alert>
        ) : (
          apiKeys?.map((key: any) => (
            <Card key={key.id} className="border-slate-700 bg-slate-800/50">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-white">{key.name}</h3>
                    {key.is_default && <span className="px-2 py-0.5 bg-[#D97757] text-white rounded text-[10px] font-bold">PADRÃO</span>}
                  </div>
                  <p className="text-sm text-slate-400 uppercase">{key.provider}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs text-slate-300 bg-slate-900 px-2 py-1 rounded">
                      {showKeys[key.id] ? key.api_key : '••••••••••••••••••••'}
                    </code>
                    <Button onClick={() => toggleShowKey(key.id)} variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400">
                      {showKeys[key.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => deleteMutation.mutate(key.id)} variant="outline" className="border-red-600 text-red-400 hover:bg-red-950">
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
