import React, { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, Settings, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OmniCheckout, CheckoutConfig } from "./OmniCheckout";

interface CheckoutBlockProps {
  block: CheckoutConfig;
  isSelected?: boolean;
  onSelect?: () => void;
  onUpdate?: (config: CheckoutConfig) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  isEditing?: boolean;
}

/**
 * Componente de Bloco de Checkout para o Builder
 * Renderiza um bloco draggable com preview e painel de configuração
 */
export const CheckoutBlock: React.FC<CheckoutBlockProps> = ({
  block,
  isSelected = false,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  isEditing = false,
}) => {
  const [showConfig, setShowConfig] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border-2 transition-all ${
        isSelected
          ? "border-primary bg-primary/5 shadow-lg"
          : "border-border/30 bg-background hover:border-border/50"
      }`}
    >
      {/* Header com ações */}
      <div className="flex items-center justify-between p-4 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm">{block.productName}</h4>
            <p className="text-xs text-muted-foreground">
              R$ {block.productValue.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowConfig(!showConfig)}
            title="Configurar"
          >
            <Settings className="w-4 h-4" />
          </Button>
          {onDuplicate && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onDuplicate}
              title="Duplicar"
            >
              <Copy className="w-4 h-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Preview ou Configuração */}
      <div className="p-6">
        {showConfig ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase">Nome do Produto</label>
              <input
                type="text"
                value={block.productName}
                onChange={e =>
                  onUpdate?.({
                    ...block,
                    productName: e.target.value,
                  })
                }
                className="w-full mt-2 p-2 rounded-lg bg-secondary/50 border border-border/30 outline-none focus:border-primary text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase">Valor (R$)</label>
              <input
                type="number"
                value={block.productValue}
                onChange={e =>
                  onUpdate?.({
                    ...block,
                    productValue: Number(e.target.value),
                  })
                }
                className="w-full mt-2 p-2 rounded-lg bg-secondary/50 border border-border/30 outline-none focus:border-primary text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase">Descrição (Opcional)</label>
              <input
                type="text"
                value={block.description || ""}
                onChange={e =>
                  onUpdate?.({
                    ...block,
                    description: e.target.value,
                  })
                }
                placeholder="Ex: Acesso ao curso premium"
                className="w-full mt-2 p-2 rounded-lg bg-secondary/50 border border-border/30 outline-none focus:border-primary text-sm"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(false)}
              className="w-full"
            >
              Fechar Configuração
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
              {block.description || "Nenhuma descrição adicionada"}
            </p>

            {/* Mini Preview do Checkout */}
            <div className="p-4 rounded-lg bg-secondary/20 border border-border/20 space-y-2">
              <p className="text-[11px] font-bold uppercase text-muted-foreground">Preview</p>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Produto:</span>
                  <span className="font-medium">{block.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor:</span>
                  <span className="font-bold text-primary">
                    R$ {block.productValue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfig(true)}
              className="w-full"
            >
              Editar Configuração
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default CheckoutBlock;
