import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Plus, Trash2, TestTube, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from "sonner";

export default function WhatsAppTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    api_type: 'z-api',
    base_url: '',
    token: '',
    instance_id: '',
    client_token: '',
    pipeline_id: '',
    initial_stage_id: '',
    auto_create_lead: false,
  });
  const [testingId, setTestingId] = useState<string | null>(null);

  // Fetch configs from Supabase
  const { data: configs, isLoading } = useQuery({
    queryKey: ['whatsapp_configs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_configs' as any)
        .select('*')
        .eq('tenant_id', user?.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (newData: any) => {
      const { error } = await supabase
        .from('whatsapp_configs' as any)
        .upsert({ ...newData, tenant_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_configs'] });
      toast.success("Configuração salva com sucesso!");
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('whatsapp_configs' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_configs'] });
      toast.success("Configuração removida.");
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      api_type: 'z-api',
      base_url: '',
      token: '',
      instance_id: '',
      client_token: '',
      pipeline_id: '',
      initial_stage_id: '',
      auto_create_lead: false,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleToggleChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, auto_create_lead: checked }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.base_url || !formData.token || !formData.instance_id) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    saveMutation.mutate(formData);
  };

  const handleTest = async (id: string, config: any) => {
    setTestingId(id);
    try {
      // Simulação de ping real para a API
      const response = await fetch(`${config.base_url}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'x-instance-id': config.instance_id
        }
      }).catch(() => ({ ok: false }));

      if (response.ok) {
        toast.success(`Conexão com ${config.name} ativa!`);
      } else {
        toast.error(`Falha na conexão com ${config.name}.`);
      }
    } catch (error) {
      toast.error("Erro no teste de conexão.");
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">WhatsApp</h2>
          <p className="text-slate-400">Configure suas instâncias de API</p>
        </div>
        <Button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-[#D97757] hover:bg-[#c86647] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Configuração
        </Button>
      </div>

      {isFormOpen && (
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">Conectar Instância</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Nome da Instância *</Label>
                <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="Ex: Vendas SP" className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Tipo de API *</Label>
                <Select value={formData.api_type} onValueChange={(v) => handleSelectChange('api_type', v)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="z-api">Z-API</SelectItem>
                    <SelectItem value="evolution">Evolution API</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">URL Base *</Label>
                <Input name="base_url" value={formData.base_url} onChange={handleInputChange} placeholder="https://..." className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Token *</Label>
                <Input name="token" type="password" value={formData.token} onChange={handleInputChange} className="bg-slate-700 border-slate-600 text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Instance ID *</Label>
                <Input name="instance_id" value={formData.instance_id} onChange={handleInputChange} className="bg-slate-700 border-slate-600 text-white" />
              </div>
            </div>
            <div className="flex items-center space-x-2 pt-4">
              <Switch checked={formData.auto_create_lead} onCheckedChange={handleToggleChange} />
              <Label className="text-slate-300">Criar lead automaticamente no CRM</Label>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-[#D97757] hover:bg-[#c86647] flex-1">
                {saveMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Salvar Configuração"}
              </Button>
              <Button onClick={() => setIsFormOpen(false)} variant="outline" className="border-slate-600 text-slate-300 flex-1">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#D97757] w-8 h-8" /></div>
        ) : configs?.length === 0 ? (
          <Alert className="border-slate-700 bg-slate-800/50">
            <AlertCircle className="h-4 w-4 text-[#D97757]" />
            <AlertDescription className="text-slate-300">Nenhuma instância configurada.</AlertDescription>
          </Alert>
        ) : (
          configs?.map((config: any) => (
            <Card key={config.id} className="border-slate-700 bg-slate-800/50">
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{config.name}</h3>
                  <p className="text-sm text-slate-400">{config.api_type.toUpperCase()} • {config.instance_id}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleTest(config.id, config)} disabled={testingId === config.id} variant="outline" className="border-slate-600 text-slate-300">
                    {testingId === config.id ? <Loader2 className="animate-spin w-4 h-4" /> : <TestTube className="w-4 h-4 mr-2" />}
                    Testar
                  </Button>
                  <Button onClick={() => deleteMutation.mutate(config.id)} variant="outline" className="border-red-600 text-red-400 hover:bg-red-950">
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
