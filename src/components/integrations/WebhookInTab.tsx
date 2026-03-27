import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Copy, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface APIKey {
  id?: string;
  name: string;
  key: string;
  created_at?: string;
}

export default function WebhookInTab() {
  const [authType, setAuthType] = useState<'header' | 'query'>('header');
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  const webhookEndpoint = 'https://seu-dominio.com/functions/v1/webhook-receiver';

  const handleGenerateKey = () => {
    if (!keyName.trim()) {
      alert('Por favor, insira um nome para a chave');
      return;
    }

    const newKey = {
      id: Date.now().toString(),
      name: keyName,
      key: `sk_${Math.random().toString(36).substr(2, 32)}`,
      created_at: new Date().toLocaleDateString('pt-BR'),
    };

    setApiKeys((prev) => [...prev, newKey]);
    setKeyName('');
    setIsDialogOpen(false);
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    alert('Chave copiada para a área de transferência!');
  };

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(webhookEndpoint);
    alert('Endpoint copiado para a área de transferência!');
  };

  const handleDeleteKey = (id: string) => {
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Endpoint Section */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white">Endpoint POST</CardTitle>
          <CardDescription className="text-slate-400">
            Configure sua aplicação para enviar eventos para este endpoint
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-slate-300">URL do Webhook</Label>
            <div className="flex gap-2">
              <Input
                value={webhookEndpoint}
                readOnly
                className="bg-slate-700 border-slate-600 text-slate-300 font-mono"
              />
              <Button
                onClick={handleCopyEndpoint}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Tipo de Autenticação</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="auth_type"
                  value="header"
                  checked={authType === 'header'}
                  onChange={(e) => setAuthType(e.target.value as 'header' | 'query')}
                  className="w-4 h-4"
                />
                <span className="text-slate-300">Header (x-api-key)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="auth_type"
                  value="query"
                  checked={authType === 'query'}
                  onChange={(e) => setAuthType(e.target.value as 'header' | 'query')}
                  className="w-4 h-4"
                />
                <span className="text-slate-300">Query (?api_key=)</span>
              </label>
            </div>
          </div>

          <Alert className="border-blue-600/50 bg-blue-900/20">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200">
              <strong>Exemplo de requisição:</strong>
              <pre className="mt-2 p-2 bg-slate-900 rounded text-xs overflow-auto">
{authType === 'header' 
  ? `curl -X POST ${webhookEndpoint} \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: sk_xxxxx" \\
  -d '{"event": "lead_created", "data": {...}}'`
  : `curl -X POST "${webhookEndpoint}?api_key=sk_xxxxx" \\
  -H "Content-Type: application/json" \\
  -d '{"event": "lead_created", "data": {...}}'`
}
              </pre>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* API Keys Section */}
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white">Chaves de API</CardTitle>
          <CardDescription className="text-slate-400">
            Gerencie as chaves para autenticar suas requisições
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#D97757] hover:bg-[#c86647] text-white">
                <Plus className="w-4 h-4 mr-2" />
                Gerar Nova Chave
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Gerar Nova Chave de API</DialogTitle>
                <DialogDescription className="text-slate-400">
                  Insira um nome para identificar esta chave
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="key_name" className="text-slate-300">
                    Nome da Chave *
                  </Label>
                  <Input
                    id="key_name"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="Ex: Integração Zapier"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleGenerateKey}
                    className="bg-[#D97757] hover:bg-[#c86647] text-white flex-1"
                  >
                    Gerar
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

          {/* Keys List */}
          <div className="space-y-3 mt-6">
            {apiKeys.length === 0 ? (
              <Alert className="border-slate-700 bg-slate-800/50">
                <AlertCircle className="h-4 w-4 text-[#D97757]" />
                <AlertDescription className="text-slate-300">
                  Nenhuma chave gerada. Clique em "Gerar Nova Chave" para começar.
                </AlertDescription>
              </Alert>
            ) : (
              apiKeys.map((apiKey) => (
                <Card key={apiKey.id} className="border-slate-700 bg-slate-900/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-slate-400">Nome</p>
                        <p className="text-white font-semibold">{apiKey.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Criada em: {apiKey.created_at}
                        </p>
                      </div>
                      <div className="flex-1 ml-4">
                        <p className="text-sm text-slate-400">Chave</p>
                        <div className="flex items-center gap-2">
                          <code className="text-white font-mono text-sm bg-slate-800 px-2 py-1 rounded">
                            {showKeys[apiKey.id!]
                              ? apiKey.key
                              : apiKey.key.slice(0, 8) + '••••••••••••••••••••••••'}
                          </code>
                          <Button
                            onClick={() => toggleShowKey(apiKey.id!)}
                            size="sm"
                            variant="ghost"
                            className="text-slate-400"
                          >
                            {showKeys[apiKey.id!] ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleCopyKey(apiKey.key)}
                          size="sm"
                          variant="outline"
                          className="border-slate-600 text-slate-300"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteKey(apiKey.id!)}
                          size="sm"
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
        </CardContent>
      </Card>
    </div>
  );
}
