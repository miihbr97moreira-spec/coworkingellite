import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft, Webhook, Loader2, AlertCircle, CheckCircle2,
  Copy, RefreshCw, Eye, EyeOff, MoreVertical, Trash2, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import TooltipHelp from "@/components/ui/tooltip-help";

interface OmniFlowWebhooksProps {
  onBack: () => void;
}

interface WebhookLog {
  id: string;
  payload: any;
  status_code: number;
  received_at: string;
  error_message?: string;
}

const OmniFlowWebhooks: React.FC<OmniFlowWebhooksProps> = ({ onBack }) => {
  const [endpoint, setEndpoint] = useState<any>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadWebhookData();
  }, []);

  const loadWebhookData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Carregar endpoint
      const { data: endpointData } = await supabase
        .from("webhook_endpoints")
        .select("*")
        .eq("tenant_id", user.id)
        .single();

      setEndpoint(endpointData);

      // Carregar logs
      const { data: logsData } = await supabase
        .from("webhook_logs")
        .select("*")
        .eq("tenant_id", user.id)
        .order("received_at", { ascending: false })
        .limit(50);

      setLogs(logsData || []);
    } catch (err) {
      console.error("Erro ao carregar webhooks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshLogs = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    await loadWebhookData();
    setRefreshing(false);
    toast.success("Logs atualizados");
  };

  const handleCopyUrl = () => {
    if (endpoint?.webhook_url) {
      navigator.clipboard.writeText(endpoint.webhook_url);
      toast.success("URL copiada!");
    }
  };

  const handleCopySecret = () => {
    if (endpoint?.webhook_secret) {
      navigator.clipboard.writeText(endpoint.webhook_secret);
      toast.success("Secret copiado!");
    }
  };

  const handleDeleteLog = async (logId: string) => {
    try {
      await supabase
        .from("webhook_logs")
        .delete()
        .eq("id", logId);

      setLogs(logs.filter(l => l.id !== logId));
      toast.success("Log removido");
    } catch (err) {
      toast.error("Erro ao remover log");
    }
  };

  const handleDownloadLogs = () => {
    const csv = [
      ["Data", "Status", "Payload", "Erro"].join(","),
      ...logs.map(log =>
        [
          log.received_at,
          log.status_code || "N/A",
          JSON.stringify(log.payload).replace(/"/g, '""'),
          log.error_message || ""
        ].join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `webhook-logs-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
              <Webhook className="w-6 h-6 text-blue-600" />
            </div>
            Webhooks
            <TooltipHelp content="Webhooks permitem que sistemas externos enviem dados para você (Inbound) ou que você envie dados para sistemas externos (Outbound). Use para integrar Hotmart, Shopify, Make, Zapier e muito mais." />
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Receba eventos em tempo real e monitore as requisições do seu webhook.
          </p>
        </div>
      </div>

      {/* Endpoint Configuration */}
      {endpoint && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 p-6"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Endpoint Ativo</h3>
                <p className="text-sm text-muted-foreground">Seu webhook está pronto para receber eventos</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
              endpoint.is_active
                ? "bg-green-500/20 text-green-700 border border-green-500/30"
                : "bg-red-500/20 text-red-700 border border-red-500/30"
            }`}>
              {endpoint.is_active ? "Ativo" : "Inativo"}
            </div>
          </div>

          {/* URL Configuration */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground block mb-2">
                URL do Webhook
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={endpoint.webhook_url}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyUrl}
                  className="gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copiar
                </Button>
              </div>
            </div>

            {/* Secret Key */}
            <div>
              <label className="text-xs font-semibold uppercase text-muted-foreground block mb-2">
                Secret (para validação de assinatura)
              </label>
              <div className="flex gap-2">
                <input
                  type={showSecret ? "text" : "password"}
                  readOnly
                  value={endpoint.webhook_secret}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-background border border-border text-sm font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSecret(!showSecret)}
                  className="gap-1"
                >
                  {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopySecret}
                  className="gap-1"
                >
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Logs Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Histórico de Requisições</h2>
            <p className="text-sm text-muted-foreground">Últimas 50 requisições recebidas</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefreshLogs}
              disabled={refreshing}
              className="gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadLogs}
              className="gap-1"
            >
              <Download className="w-3 h-3" />
              Exportar CSV
            </Button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/30 border-b border-border/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Data/Hora</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Payload</th>
                  <th className="px-4 py-3 text-left font-semibold">Erro</th>
                  <th className="px-4 py-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      <AlertCircle className="w-5 h-5 mx-auto mb-2 opacity-50" />
                      Nenhuma requisição recebida ainda
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-border/30 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono">
                        {new Date(log.received_at).toLocaleString("pt-BR")}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                          log.status_code === 200
                            ? "bg-green-500/20 text-green-700"
                            : "bg-red-500/20 text-red-700"
                        }`}>
                          {log.status_code || "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-secondary/50 px-2 py-1 rounded truncate block max-w-xs">
                          {JSON.stringify(log.payload).substring(0, 50)}...
                        </code>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {log.error_message ? (
                          <span className="text-red-500">{log.error_message.substring(0, 30)}...</span>
                        ) : (
                          <span className="text-green-500">✓ Sucesso</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                navigator.clipboard.writeText(JSON.stringify(log.payload, null, 2));
                                toast.success("Payload copiado!");
                              }}
                            >
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar Payload
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteLog(log.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Documentation */}
      <div className="rounded-lg border border-border/50 bg-secondary/20 p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          Documentação de Webhooks
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Envie requisições POST para o endpoint acima com o payload JSON. Cada requisição será registrada e você poderá monitorar o histórico aqui.
        </p>
        <Button variant="outline" size="sm">
          Ver Documentação Completa
        </Button>
      </div>
    </div>
  );
};

export default OmniFlowWebhooks;
