import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Copy, Plus, Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
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

export default function WebhookInTab() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [authType, setAuthType] = useState<'header' | 'query'>('header');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Dinamicamente obter a URL base (Supabase Project URL)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sua-url.supabase.co';
  const webhookEndpoint = `${supabaseUrl}/functions/v1/webhook-receiver`;

  // Fetch API keys from the api_keys table (filtered by purpose if needed, or using a dedicated table)
  // For simplicity and following the schema, we use the api_keys table
  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['webhook_in_keys', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_keys' as any)
        .select('*')
        .eq('tenant_id', user?.id)
        .eq('provider', 'webhook_in'); // Filter for webhook specific keys
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const newKey = `sk_${Math.random().toString(36).substr(2, 32)}`;
      const { error } = await supabase
        .from('api_keys' as any)
        .insert({
          name,
          provider: 'webhook_in',
          api_key: newKey,
          tenant_id: user?.id,
          is_default: false
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook_in_keys'] });
      toast.success("Chave de API gerada com sucesso!");
      setIsDialogOpen(false);
      setKeyName('');
    },
    onError: (error: any) => {
      toast.error("Erro ao gerar chave: " + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('api_keys' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['webhook_in_keys'] });
      toast.success("Chave removida.");
    }
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const toggleShowKey = (id: string) => {
    setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="text-white">Endpoint POST Padrão</CardTitle>
          <CardDescription className="text-slate-400">
            Envie eventos externos para este endereço para processamento automático.
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
                onClick={() => handleCopy(webhookEndpoint, 'Endpoint')}
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-slate-300">Tipo de Autenticação Suportada</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={authType === 'header'}
                  onChange={() => setAuthType('header')}
                  className="w-4 h-4 accent-[#D97757]"
                />
                <span className="text-slate-300">Header (x-api-key)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={authType === 'query'}
                  onChange={() => setAuthType('query')}
                  className="w-4 h-4 accent-[#D97757]"
                />
                <span className="text-slate-300">Query (?api_key=)</span>
              </label>
            </div>
          </div>

          <Alert className="border-blue-600/50 bg-blue-900/20">
            <AlertCircle className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200">
              <strong>Exemplo de implementação:</strong>
              <pre className="mt-2 p-2 bg-slate-900 rounded text-xs overflow-auto font-mono">
{authType === 'header' 
  ? `curl -X POST ${webhookEndpoint} \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: SUA_CHAVE_AQUI" \\
  -d '{"event": "lead_created", "data": {"name": "João"}}'`
  : `curl -X POST "${webhookEndpoint}?api_key=SUA_CHAVE_AQUI" \\
  -H "Content-Type: application/json" \\
  -d '{"event": "lead_created", "data": {"name": "João"}}'`
}
              </pre>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card className="border-slate-700 bg-slate-800/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Chaves de API (Webhook In)</CardTitle>
              <CardDescription className="text-slate-400">Chaves exclusivas para autenticar a entrada de dados.</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-[#D97757] hover:bg-[#c86647] text-white">
                  <Plus className="w-4 h-4 mr-2" /> Gerar Chave
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-800 border-slate-700">
                <DialogHeader><DialogTitle className="text-white">Nova Chave de API</DialogTitle></DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder="Ex: Integração RD Station"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <Button 
                    onClick={() => createMutation.mutate(keyName)} 
                    disabled={createMutation.isPending || !keyName} 
                    className="w-full bg-[#D97757]"
                  >
                    {createMutation.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : "Gerar"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center p-6"><Loader2 className="animate-spin text-[#D97757]" /></div>
            ) : apiKeys?.length === 0 ? (
              <p className="text-center text-slate-500 py-4">Nenhuma chave gerada para entrada.</p>
            ) : (
              apiKeys?.map((apiKey: any) => (
                <div key={apiKey.id} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700">
                  <div className="flex-1">
                    <p className="text-white font-medium">{apiKey.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        {showKeys[apiKey.id] ? apiKey.api_key : '••••••••••••••••••••'}
                      </code>
                      <Button onClick={() => toggleShowKey(apiKey.id)} variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500">
                        {showKeys[apiKey.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      </Button>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleCopy(apiKey.api_key, 'Chave')} variant="ghost" size="sm" className="text-slate-400"><Copy className="w-4 h-4" /></Button>
                    <Button onClick={() => deleteMutation.mutate(apiKey.id)} variant="ghost" size="sm" className="text-red-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
