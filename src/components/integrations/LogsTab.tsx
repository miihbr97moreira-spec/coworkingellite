import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Download, RefreshCw, ChevronDown, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LogsTab() {
  const { user } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch logs
  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['webhook_logs', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('webhook_logs' as any)
        .select('*')
        .eq('tenant_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-400 bg-green-900/20';
    if (status >= 400) return 'text-red-400 bg-red-900/20';
    return 'text-slate-400 bg-slate-900/20';
  };

  const filteredLogs = logs?.filter((log: any) =>
    log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    if (!logs) return;
    const csv = [
      ['Direção', 'Evento', 'URL', 'Status', 'Data'],
      ...logs.map((log: any) => [log.direction, log.event, log.url, log.status, log.created_at])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'logs.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Logs de Webhook</h2>
          <p className="text-slate-400">Histórico de eventos em tempo real</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetch()} variant="outline" className="border-slate-700 text-slate-400">
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
          </Button>
          <Button onClick={handleExport} className="bg-[#D97757] hover:bg-[#c86647]">
            <Download className="w-4 h-4 mr-2" /> Exportar
          </Button>
        </div>
      </div>

      <Input
        placeholder="Filtrar por evento ou URL..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="bg-slate-800 border-slate-700 text-white"
      />

      <Card className="border-slate-800 bg-slate-900/50 overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#D97757]" /></div>
          ) : filteredLogs?.length === 0 ? (
            <div className="p-6">
              <Alert className="border-slate-800 bg-slate-900/50">
                <AlertCircle className="h-4 w-4 text-[#D97757]" />
                <AlertDescription className="text-slate-400">Nenhum log registrado.</AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-950/50 border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="px-6 py-3">Direção</th>
                    <th className="px-6 py-3">Evento</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Data</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredLogs?.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-800/30">
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${log.direction === 'OUT' ? 'text-blue-400 bg-blue-900/20' : 'text-purple-400 bg-purple-900/20'}`}>
                          {log.direction}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white font-mono">{log.event}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}>
                          <ChevronDown className={`w-4 h-4 transition ${expandedId === log.id ? 'rotate-180' : ''}`} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
