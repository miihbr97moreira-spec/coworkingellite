import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Plus, Trash2, Edit2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ChatAutomation {
  id?: string;
  name: string;
  trigger_type: 'regex' | 'keyword' | 'all';
  trigger_value?: string;
  action_type: 'auto-reply' | 'ai-agent' | 'qualification';
  action_value?: string;
}

export default function AutomationsTab() {
  const [automations, setAutomations] = useState<ChatAutomation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ChatAutomation>({
    name: '',
    trigger_type: 'keyword',
    trigger_value: '',
    action_type: 'auto-reply',
    action_value: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.trigger_value) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    const newAutomation = {
      ...formData,
      id: Date.now().toString(),
    };

    setAutomations((prev) => [...prev, newAutomation]);
    setFormData({
      name: '',
      trigger_type: 'keyword',
      trigger_value: '',
      action_type: 'auto-reply',
      action_value: '',
    });
    setIsDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setAutomations((prev) => prev.filter((a) => a.id !== id));
  };

  const getTriggerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      regex: 'Expressão Regular',
      keyword: 'Palavra-chave',
      all: 'Qualquer mensagem',
    };
    return labels[type] || type;
  };

  const getActionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'auto-reply': 'Resposta Automática',
      'ai-agent': 'Agente IA',
      qualification: 'Qualificação',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Automações</h2>
          <p className="text-slate-400">Configure regras de automação para suas mensagens</p>
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
              <DialogTitle className="text-white">Nova Automação</DialogTitle>
              <DialogDescription className="text-slate-400">
                Configure um gatilho e uma ação para automatizar respostas
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">
                  Nome da Automação *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Saudação automática"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Gatilho</Label>
                <div className="space-y-2">
                  <Select value={formData.trigger_type} onValueChange={(value) => handleSelectChange('trigger_type', value)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="keyword">Palavra-chave</SelectItem>
                      <SelectItem value="regex">Expressão Regular</SelectItem>
                      <SelectItem value="all">Qualquer mensagem</SelectItem>
                    </SelectContent>
                  </Select>

                  {formData.trigger_type !== 'all' && (
                    <Input
                      name="trigger_value"
                      value={formData.trigger_value}
                      onChange={handleInputChange}
                      placeholder={
                        formData.trigger_type === 'keyword'
                          ? 'Ex: olá, oi, opa'
                          : 'Ex: ^(oi|olá|opa)$'
                      }
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Ação</Label>
                <Select value={formData.action_type} onValueChange={(value) => handleSelectChange('action_type', value)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto-reply">Resposta Automática</SelectItem>
                    <SelectItem value="ai-agent">Agente IA</SelectItem>
                    <SelectItem value="qualification">Qualificação</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  name="action_value"
                  value={formData.action_value}
                  onChange={handleInputChange}
                  placeholder={
                    formData.action_type === 'auto-reply'
                      ? 'Ex: Olá! Como posso ajudar?'
                      : 'ID do agente ou qualificador'
                  }
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

      {/* Automations List */}
      <div className="space-y-4">
        {automations.length === 0 ? (
          <Alert className="border-slate-700 bg-slate-800/50">
            <AlertCircle className="h-4 w-4 text-[#D97757]" />
            <AlertDescription className="text-slate-300">
              Nenhuma automação configurada. Clique em "Nova Automação" para começar.
            </AlertDescription>
          </Alert>
        ) : (
          automations.map((automation) => (
            <Card key={automation.id} className="border-slate-700 bg-slate-800/50">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white">{automation.name}</h3>
                    <div className="mt-3 grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-slate-400">Gatilho</p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-sm">
                            {getTriggerTypeLabel(automation.trigger_type)}
                          </span>
                          {automation.trigger_value && (
                            <span className="text-slate-300 font-mono text-sm">
                              "{automation.trigger_value}"
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-slate-400">Ação</p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-green-900/30 text-green-300 rounded text-sm">
                            {getActionTypeLabel(automation.action_type)}
                          </span>
                          {automation.action_value && (
                            <span className="text-slate-300 text-sm truncate">
                              {automation.action_value}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="border-slate-600 text-slate-300"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(automation.id!)}
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
