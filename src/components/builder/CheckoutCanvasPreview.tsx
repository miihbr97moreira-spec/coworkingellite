import React from "react";
import { motion } from "framer-motion";
import { DollarSign } from "lucide-react";
import { useCheckoutBlocks } from "@/hooks/useCheckoutBlocks";

/**
 * Componente para visualizar blocos de checkout no canvas do Builder
 * Renderiza uma prévia dos checkouts criados
 */
export const CheckoutCanvasPreview: React.FC = () => {
  const { blocks } = useCheckoutBlocks();

  if (blocks.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-8 space-y-4"
    >
      <div className="flex items-center gap-2 px-4">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          <DollarSign className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-lg">Checkouts Configurados</h3>
        <span className="ml-auto text-xs font-bold px-2 py-1 rounded-full bg-primary/20 text-primary">
          {blocks.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4">
        {blocks.map((block, idx) => (
          <motion.div
            key={block.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="p-4 rounded-lg border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-semibold text-sm">{block.productName}</p>
                <p className="text-xs text-muted-foreground">
                  R$ {block.productValue.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="w-4 h-4 text-primary" />
              </div>
            </div>
            {block.description && (
              <p className="text-xs text-muted-foreground">{block.description}</p>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default CheckoutCanvasPreview;
