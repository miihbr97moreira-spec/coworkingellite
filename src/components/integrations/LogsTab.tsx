import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, Download, RefreshCw, ChevronDown } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface WebhookLog {
  id: string;
  direction: 'IN' | 'OUT';
  event: string;
  url: string;
  status: number;
  created_at: string;
  response_body?: string;
}

export default function LogsTab() {
  const [logs, setLogs] = useState<WebhookLog[]>([
    {
      id: '1',
      direction: 'OUT',
      event: 'lead_created',
      url: 'https://webhook.site/xxxxx',
      status: 200,
      created_at: new Date(Date.now() - 3600000).toLocaleString('pt-BR'),
    },
    {
      id: '2',
      direction: 'IN',
      event: 'message_received',
      url: '/functions/v1/webhook-receiver',
      status: 200,
      created_at: new Date(Date.now() - 1800000).toLocaleString('pt-BR'),
    },
    {
      id: '3',
      direction: 'OUT',
      event: 'contact_updated',
      url: 'https://webhook.site/yyyyy',
      status: 500,
      created_at: new Date(Date.now() - 900000).toLocaleString('pt-BR'),
    },
  ]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-400 bg-green-900/20';
    if (status >= 400 && status < 500) return 'text-yellow-400 bg-yellow-900/20';
    if (status >= 500) return 'text-red-400 bg-red-900/20';
    return 'text-slate-400 bg-slate-900/20';
  };

  const getDirectionLabel = (direction: string) => {
    return direction === 'OUT' ? '→ Saída' : '← Entrada';
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'OUT'
      ? 'text-blue-400 bg-blue-900/20'
      : 'text-purple-400 bg-purple-900/20';
  };

  const filteredLogs = logs.filter((log) =>
    log.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.url.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = () => {
    // Simular refresh
    alert('Logs atualizados!');
  };

  const handleExport = () => {
    const csv = [
      ['Direção', 'Evento', 'URL', 'Status', 'Data'],
      ...logs.map((log) => [
        log.direction,
        log.event,
        log.url,
        log.status,
        log.created_at,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'webhook-logs.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Logs de Webhook</h2>
          <p className="text-slate-400">Histórico de eventos enviados e recebidos</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-slate-600 text-slate-300"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={handleExport}
            className="bg-[#D97757] hover:bg-[#c86647] text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Input
          placeholder="Buscar por evento ou URL..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      {/* Logs Table */}
      <Card className="border-slate-700 bg-slate-800/50 overflow-hidden">
        <CardContent className="p-0">
          {filteredLogs.length === 0 ? (
            <div className="p-6">
              <Alert className="border-slate-700 bg-slate-800/50">
                <AlertCircle className="h-4 w-4 text-[#D97757]" />
                <AlertDescription className="text-slate-300">
                  Nenhum log encontrado.
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Direção
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Evento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      URL
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-300">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${getDirectionColor(
                            log.direction
                          )}`}
                        >
                          {getDirectionLabel(log.direction)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-mono text-sm">{log.event}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-300 text-sm truncate max-w-xs">
                          {log.url}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(
                            log.status
                          )}`}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-400 text-sm">{log.created_at}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Button
                          onClick={() =>
                            setExpandedId(expandedId === log.id ? null : log.id)
                          }
                          size="sm"
                          variant="ghost"
                          className="text-slate-300"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition ${
                              expandedId === log.id ? 'rotate-180' : ''
                            }`}
                          />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Expanded Details */}
              {expandedId && (
                <div className="border-t border-slate-700 bg-slate-900/30 p-6">
                  {(() => {
                    const log = filteredLogs.find((l) => l.id === expandedId);
                    return (
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-slate-400 uppercase tracking-wider">
                            Response Body
                          </p>
                          <pre className="mt-2 p-3 bg-slate-900 rounded text-xs text-slate-300 overflow-auto max-h-40">
                            {log?.response_body || 'N/A'}
                          </pre>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-sm">Total de Eventos</p>
            <p className="text-3xl font-bold text-white mt-2">{logs.length}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-sm">Sucesso (2xx)</p>
            <p className="text-3xl font-bold text-green-400 mt-2">
              {logs.filter((l) => l.status >= 200 && l.status < 300).length}
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-700 bg-slate-800/50">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-sm">Erros (4xx, 5xx)</p>
            <p className="text-3xl font-bold text-red-400 mt-2">
              {logs.filter((l) => l.status >= 400).length}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
