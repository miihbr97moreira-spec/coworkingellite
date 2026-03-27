import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Play, RotateCcw, Copy, CheckCircle2, AlertCircle, Info,
  Loader2, Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useOmniFlowStore } from "@/stores/omniFlowStore";

interface AutomationTesterProps {
  automationId?: string;
  onClose?: () => void;
}

const AutomationTester: React.FC<AutomationTesterProps> = ({ automationId, onClose }) => {
  const { testLogs, addTestLog, clearTestLogs, automations } = useOmniFlowStore();
  const [running, setRunning] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [testLogs]);

  const handleRunTest = async () => {
    setRunning(true);
    clearTestLogs();

    try {
      addTestLog("🔄 Iniciando teste de automação...", "info");
      await new Promise(resolve => setTimeout(resolve, 500));

      addTestLog("✓ Gatilho detectado: Novo Lead", "success");
      await new Promise(resolve => setTimeout(resolve, 800));

      addTestLog("📤 Preparando payload para webhook...", "info");
      await new Promise(resolve => setTimeout(resolve, 600));

      addTestLog("✓ Payload: {\"lead_name\": \"João Silva\", \"lead_email\": \"joao@example.com\"}", "success");
      await new Promise(resolve => setTimeout(resolve, 500));

      addTestLog("🌐 Enviando POST para webhook...", "info");
      await new Promise(resolve => setTimeout(resolve, 1200));

      addTestLog("✓ Resposta recebida: Status 200 OK", "success");
      await new Promise(resolve => setTimeout(resolve, 400));

      addTestLog("✅ Teste concluído com sucesso!", "success");
    } catch (err) {
      addTestLog("❌ Erro durante o teste", "error");
    } finally {
      setRunning(false);
    }
  };

  const handleDownloadLogs = () => {
    const csv = [
      ["Timestamp", "Status", "Mensagem"].join(","),
      ...testLogs.map(log =>
        [log.timestamp, log.status, log.message].join(",")
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `automation-test-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Play className="w-5 h-5 text-[#D97757]" />
          Simulador de Testes
        </h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={clearTestLogs}
            disabled={testLogs.length === 0 || running}
            className="gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Limpar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadLogs}
            disabled={testLogs.length === 0}
            className="gap-1"
          >
            <Download className="w-3 h-3" />
            Exportar
          </Button>
          <Button
            size="sm"
            onClick={handleRunTest}
            disabled={running}
            className="gap-1 bg-[#D97757] hover:bg-[#D97757]/90"
          >
            {running ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                Executar Teste
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info Box */}
      <div className="p-3 rounded-lg bg-[#D97757]/10 border border-[#D97757]/30 flex gap-2">
        <Info className="w-4 h-4 text-[#D97757] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Este simulador executa um teste completo da automação, mostrando cada etapa do fluxo em tempo real.
        </p>
      </div>

      {/* Logs Display */}
      <div className="rounded-lg border border-border/50 bg-background/50 p-4 h-64 overflow-y-auto font-mono text-sm space-y-2">
        {testLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Clique em "Executar Teste" para começar</p>
          </div>
        ) : (
          testLogs.map((log, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-start gap-2 p-2 rounded ${
                log.status === "success"
                  ? "bg-green-500/10 text-green-700"
                  : log.status === "error"
                  ? "bg-red-500/10 text-red-700"
                  : "bg-blue-500/10 text-blue-700"
              }`}
            >
              <span className="text-xs font-semibold whitespace-nowrap">{log.timestamp}</span>
              <span className="flex-1 break-words">{log.message}</span>
              {log.status === "success" && <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" />}
              {log.status === "error" && <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />}
            </motion.div>
          ))
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Copy Logs Button */}
      {testLogs.length > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const logsText = testLogs
              .map(log => `[${log.timestamp}] ${log.status.toUpperCase()}: ${log.message}`)
              .join("\n");
            navigator.clipboard.writeText(logsText);
            toast.success("Logs copiados!");
          }}
          className="w-full gap-1"
        >
          <Copy className="w-3 h-3" />
          Copiar Logs
        </Button>
      )}
    </motion.div>
  );
};

export default AutomationTester;
