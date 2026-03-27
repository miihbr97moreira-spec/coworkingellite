import React from "react";
import { Copy, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl: string;
}

interface DNSValidationGuideProps {
  domain: string;
  isConfigured: boolean;
  records: any[];
  onRetry: () => void;
  isLoading: boolean;
}

const DNSValidationGuide: React.FC<DNSValidationGuideProps> = ({
  domain,
  isConfigured,
  records,
  onRetry,
  isLoading,
}) => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  // Instruções de configuração DNS - Mantendo apenas Registro A
  const dnsInstructions: DNSRecord[] = [
    {
      type: "A",
      name: "@",
      value: "76.76.21.21",
      ttl: "3600",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Status da Verificação */}
      <div
        className={`p-4 rounded-lg border ${
          isConfigured
            ? "bg-green-500/5 border-green-500/20"
            : "bg-amber-500/5 border-amber-500/20"
        }`}
      >
        <div className="flex items-start gap-3">
          {isConfigured ? (
            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <p className="font-semibold text-sm mb-1">
              {isConfigured ? "✓ Domínio Configurado Corretamente" : "⚠ Domínio Não Configurado"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isConfigured
                ? `O domínio ${domain} está apontando corretamente para nossos servidores.`
                : `O domínio ${domain} ainda não está configurado. Siga as instruções abaixo.`}
            </p>
            {records.length > 0 && (
              <div className="mt-2 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">Registros detectados:</p>
                {records.map((record, idx) => (
                  <div key={idx} className="text-[11px] text-muted-foreground font-mono">
                    {record.type}: {record.value}
                  </div>
                ))}
              </div>
            )}
          </div>
          {!isConfigured && (
            <Button
              size="sm"
              variant="outline"
              onClick={onRetry}
              disabled={isLoading}
              className="flex-shrink-0"
            >
              {isLoading ? "Verificando..." : "Verificar Novamente"}
            </Button>
          )}
        </div>
      </div>

      {/* Instruções de Configuração */}
      {!isConfigured && (
        <div className="p-4 rounded-lg bg-secondary/30 border border-border/40 space-y-4">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Acesse o painel de controle do seu provedor de domínio (Cloudflare, Hostinger, GoDaddy, Namecheap, etc.) e adicione o registro DNS abaixo:
            </p>
          </div>

          <div className="space-y-3">
            {dnsInstructions.map((instruction, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-background border border-border/40">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-bold text-primary uppercase">
                    Registro {instruction.type} (Recomendado)
                  </p>
                  <span className="text-[10px] font-semibold text-green-600 bg-green-500/10 px-2 py-1 rounded">
                    Obrigatório
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-secondary/50 rounded text-xs">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-mono font-bold">{instruction.type}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-secondary/50 rounded text-xs">
                    <span className="text-muted-foreground">Nome:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold">{instruction.name}</span>
                      <button
                        onClick={() => copyToClipboard(instruction.name)}
                        className="p-1 hover:bg-secondary rounded transition-colors"
                      >
                        <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-secondary/50 rounded text-xs">
                    <span className="text-muted-foreground">Valor:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">{instruction.value}</span>
                      <button
                        onClick={() => copyToClipboard(instruction.value)}
                        className="p-1 hover:bg-secondary rounded transition-colors"
                      >
                        <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-secondary/50 rounded text-xs">
                    <span className="text-muted-foreground">TTL:</span>
                    <span className="font-mono font-bold">{instruction.ttl}</span>
                  </div>
                </div>

                <p className="text-[10px] text-muted-foreground mt-2 italic">
                  ⏱️ Propagação: 5-30 minutos (às vezes até 48 horas)
                </p>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="text-[10px] text-amber-700 font-semibold">
              <strong>⚠️ Importante:</strong> Após adicionar o registro DNS, aguarde 5-30 minutos para a propagação. Clique em "Verificar Novamente" para confirmar que o domínio foi configurado corretamente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default DNSValidationGuide;
