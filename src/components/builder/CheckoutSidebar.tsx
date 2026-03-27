import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckoutBlock } from "./CheckoutBlock";
import { useCheckoutBlocks } from "@/hooks/useCheckoutBlocks";
import { CheckoutConfig } from "./OmniCheckout";

interface CheckoutSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Sidebar para gerenciar blocos de Checkout no Builder
 * Permite criar, editar, duplicar e deletar blocos
 */
export const CheckoutSidebar: React.FC<CheckoutSidebarProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    blocks,
    selectedBlockId,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    selectBlock,
  } = useCheckoutBlocks();

  const handleAddBlock = () => {
    const newBlock: CheckoutConfig = {
      id: `checkout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "checkout",
      productName: "Novo Produto",
      productValue: 99.9,
      currency: "BRL",
      description: "Descrição do produto",
    };

    addBlock(newBlock);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-screen w-96 bg-background border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-lg">Checkouts</h2>
                  <p className="text-xs text-muted-foreground">
                    {blocks.length} bloco{blocks.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {blocks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-3 bg-primary/10 rounded-lg text-primary mb-3">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium mb-1">Nenhum checkout criado</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Clique no botão abaixo para adicionar seu primeiro bloco de checkout
                  </p>
                </div>
              ) : (
                blocks.map(block => (
                  <CheckoutBlock
                    key={block.id}
                    block={block}
                    isSelected={selectedBlockId === block.id}
                    onSelect={() => selectBlock(block.id)}
                    onUpdate={config => updateBlock(block.id, config)}
                    onDelete={() => deleteBlock(block.id)}
                    onDuplicate={() => duplicateBlock(block.id)}
                    isEditing={true}
                  />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border/20 p-4">
              <Button
                onClick={handleAddBlock}
                className="w-full gap-2"
                size="lg"
              >
                <Plus className="w-4 h-4" /> Adicionar Checkout
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CheckoutSidebar;
