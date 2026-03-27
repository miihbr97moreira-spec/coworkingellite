import { create } from "zustand";
import { CheckoutConfig } from "@/components/builder/OmniCheckout";

export interface CheckoutBlocksState {
  blocks: CheckoutConfig[];
  selectedBlockId: string | null;

  // Ações
  addBlock: (block: CheckoutConfig) => void;
  updateBlock: (id: string, config: Partial<CheckoutConfig>) => void;
  deleteBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  selectBlock: (id: string | null) => void;
  getBlock: (id: string) => CheckoutConfig | undefined;
  clearBlocks: () => void;
}

/**
 * Zustand Store para gerenciar blocos de Checkout no Builder
 */
export const useCheckoutBlocks = create<CheckoutBlocksState>((set, get) => ({
  blocks: [],
  selectedBlockId: null,

  addBlock: (block: CheckoutConfig) => {
    set(state => ({
      blocks: [...state.blocks, block],
      selectedBlockId: block.id,
    }));
  },

  updateBlock: (id: string, config: Partial<CheckoutConfig>) => {
    set(state => ({
      blocks: state.blocks.map(b =>
        b.id === id ? { ...b, ...config } : b
      ),
    }));
  },

  deleteBlock: (id: string) => {
    set(state => ({
      blocks: state.blocks.filter(b => b.id !== id),
      selectedBlockId: state.selectedBlockId === id ? null : state.selectedBlockId,
    }));
  },

  duplicateBlock: (id: string) => {
    const block = get().blocks.find(b => b.id === id);
    if (!block) return;

    const newBlock: CheckoutConfig = {
      ...block,
      id: `checkout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };

    set(state => ({
      blocks: [...state.blocks, newBlock],
      selectedBlockId: newBlock.id,
    }));
  },

  selectBlock: (id: string | null) => {
    set({ selectedBlockId: id });
  },

  getBlock: (id: string) => {
    return get().blocks.find(b => b.id === id);
  },

  clearBlocks: () => {
    set({
      blocks: [],
      selectedBlockId: null,
    });
  },
}));
