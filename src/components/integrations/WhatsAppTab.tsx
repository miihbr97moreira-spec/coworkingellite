import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, Plus, Trash2, TestTube } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WhatsAppConfig {
  id?: string;
  name: string;
  api_type: 'z-api' | 'evolution';
  base_url: string;
  token: string;
  instance_id: string;
  client_token?: string;
  pipeline_id?: string;
  initial_stage_id?: string;
  auto_create_lead: boolean;
}

export default function WhatsAppTab() {
  const [configs, setConfigs] = useState<WhatsAppConfig[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState<WhatsAppConfig>({
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
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const newConfig = {
      ...formData,
      id: Date.now().toString(),
    };

    setConfigs((prev) => [...prev, newConfig]);
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
    setIsFormOpen(false);
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const config = configs.find((c) => c.id === id);
      if (!config) return;

      // Simular teste de conexão
      const response = await fetch(`${config.base_url}/ping`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.token}`,
        },
      }).catch(() => ({ ok: false }));

      if (response.ok) {
        alert(`✅ Conexão com ${config.name} estabelecida com sucesso!`);
      } else {
        alert(`❌ Falha ao conectar com ${config.name}. Verifique as credenciais.`);
      }
    } catch (error) {
      alert(`❌ Erro ao testar conexão: ${error}`);
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = (id: string) => {
    setConfigs((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">WhatsApp</h2>
          <p className="text-slate-400">Configure suas integrações de WhatsApp</p>
        </div>
        <Button
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="bg-[#D97757] hover:bg-[#c86647] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Configuração
        </Button>
      </div>

      {/* Form */}
      {isFormOpen && (
        <Card className="border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-white">Nova Configuração WhatsApp</CardTitle>
            <CardDescription>Conecte sua API de WhatsApp</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">
                  Nome da Configuração *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: WhatsApp Vendas"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="api_type" className="text-slate-300">
                  Tipo de API *
                </Label>
                <Select value={formData.api_type} onValueChange={(value) => handleSelectChange('api_type', value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="z-api">Z-API</SelectItem>
                    <SelectItem value="evolution">Evolution</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="base_url" className="text-slate-300">
                  URL Base *
                </Label>
                <Input
                  id="base_url"
                  name="base_url"
                  value={formData.base_url}
                  onChange={handleInputChange}
                  placeholder="https://api.z-api.io"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="token" className="text-slate-300">
                  Token *
                </Label>
                <Input
                  id="token"
                  name="token"
                  type="password"
                  value={formData.token}
                  onChange={handleInputChange}
                  placeholder="Seu token de API"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instance_id" className="text-slate-300">
                  Instance ID *
                </Label>
                <Input
                  id="instance_id"
                  name="instance_id"
                  value={formData.instance_id}
                  onChange={handleInputChange}
                  placeholder="ID da instância"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="client_token" className="text-slate-300">
                  Client Token
                </Label>
                <Input
                  id="client_token"
                  name="client_token"
                  type="password"
                  value={formData.client_token}
                  onChange={handleInputChange}
                  placeholder="Token do cliente (opcional)"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="pipeline_id" className="text-slate-300">
                  Pipeline
                </Label>
                <Select value={formData.pipeline_id || ''} onValueChange={(value) => handleSelectChange('pipeline_id', value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione um pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pipeline-1">Pipeline Vendas</SelectItem>
                    <SelectItem value="pipeline-2">Pipeline Suporte</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initial_stage_id" className="text-slate-300">
                  Etapa Inicial
                </Label>
                <Select value={formData.initial_stage_id || ''} onValueChange={(value) => handleSelectChange('initial_stage_id', value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione uma etapa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stage-1">Novo Lead</SelectItem>
                    <SelectItem value="stage-2">Qualificado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-4">
              <Switch
                id="auto_create_lead"
                checked={formData.auto_create_lead}
                onCheckedChange={handleToggleChange}
              />
              <Label htmlFor="auto_create_lead" className="text-slate-300 cursor-pointer">
                Criar lead automaticamente
              </Label>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleSave}
                className="bg-[#D97757] hover:bg-[#c86647] text-white flex-1"
              >
                Salvar
              </Button>
              <Button
                onClick={() => setIsFormOpen(false)}
                variant="outline"
                className="border-slate-600 text-slate-300 flex-1"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Configs List */}
      <div className="space-y-4">
        {configs.length === 0 ? (
          <Alert className="border-slate-700 bg-slate-800/50">
            <AlertCircle className="h-4 w-4 text-[#D97757]" />
            <AlertDescription className="text-slate-300">
              Nenhuma configuração de WhatsApp ainda. Clique em "Nova Configuração" para começar.
            </AlertDescription>
          </Alert>
        ) : (
          configs.map((config) => (
            <Card key={config.id} className="border-slate-700 bg-slate-800/50">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{config.name}</h3>
                    <p className="text-sm text-slate-400">
                      {config.api_type.toUpperCase()} • {config.base_url}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-slate-400">Instance ID:</span>
                        <p className="text-white font-mono">{config.instance_id}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Auto-criar lead:</span>
                        <p className="text-white">{config.auto_create_lead ? '✅ Sim' : '❌ Não'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleTest(config.id!)}
                      disabled={testingId === config.id}
                      variant="outline"
                      className="border-slate-600 text-slate-300"
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      Testar
                    </Button>
                    <Button
                      onClick={() => handleDelete(config.id!)}
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-950"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
