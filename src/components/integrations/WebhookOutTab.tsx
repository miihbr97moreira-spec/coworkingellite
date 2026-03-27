import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Plus, Trash2, Edit2, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface WebhookConfig {
  id?: string;
  name: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  is_active: boolean;
}

export default function WebhookOutTab() {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<WebhookConfig>({
    name: '',
    url: '',
    method: 'POST',
    headers: {},
    is_active: true,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.url) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const newWebhook = {
      ...formData,
      id: Date.now().toString(),
    };

    setWebhooks((prev) => [...prev, newWebhook]);
    setFormData({
      name: '',
      url: '',
      method: 'POST',
      headers: {},
      is_active: true,
    });
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setWebhooks((prev) => prev.filter((w) => w.id !== id));
  };

  const toggleActive = (id: string) => {
    setWebhooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, is_active: !w.is_active } : w))
    );
  };

  return (
    <div className="space-y-6">
      {/* Alert */}
      <Alert className="border-yellow-600/50 bg-yellow-900/20">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <AlertDescription className="text-yellow-200">
          <strong>Webhooks de Saída:</strong> Envie eventos do seu CRM para ferramentas externas em tempo real.
          Configure URLs de destino para receber notificações de atividades.
        </AlertDescription>
      </Alert>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Webhooks de Saída</h2>
          <p className="text-slate-400">Envie eventos para URLs externas</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#D97757] hover:bg-[#c86647] text-white">
              <Plus className="w-4 h-4 mr-2" />
              Novo Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Novo Webhook de Saída</DialogTitle>
              <DialogDescription className="text-slate-400">
                Configure uma URL para receber eventos em tempo real
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">
                  Nome do Webhook *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Notificação de Lead"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="url" className="text-slate-300">
                  URL de Destino *
                </Label>
                <Input
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="https://seu-servidor.com/webhook"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="method" className="text-slate-300">
                  Método HTTP
                </Label>
                <Input
                  id="method"
                  name="method"
                  value={formData.method}
                  onChange={handleInputChange}
                  placeholder="POST"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSave}
                  className="bg-[#D97757] hover:bg-[#c86647] text-white flex-1"
                >
                  Salvar
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

      {/* Webhooks List */}
      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <Alert className="border-slate-700 bg-slate-800/50">
            <AlertCircle className="h-4 w-4 text-[#D97757]" />
            <AlertDescription className="text-slate-300">
              Nenhum webhook de saída configurado. Clique em "Novo Webhook" para começar.
            </AlertDescription>
          </Alert>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id} className="border-slate-700 bg-slate-800/50">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white">{webhook.name}</h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          webhook.is_active
                            ? 'bg-green-900/30 text-green-300'
                            : 'bg-red-900/30 text-red-300'
                        }`}
                      >
                        {webhook.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-2">
                      <span className="font-mono text-slate-300">{webhook.method}</span>
                      {' • '}
                      <span className="text-slate-300 truncate">{webhook.url}</span>
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => toggleActive(webhook.id!)}
                      variant="outline"
                      className={`border-slate-600 ${
                        webhook.is_active
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}
                    >
                      {webhook.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="outline"
                      className="border-slate-600 text-slate-300"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(webhook.id!)}
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
