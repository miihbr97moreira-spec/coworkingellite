import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { calculateLeadScore } from "@/utils/leadScoring";

export interface CheckoutState {
  isProcessing: boolean;
  lastCheckoutData: any | null;
  error: string | null;
  
  // Ações
  processCheckout: (data: any, funnelId: string, stageIdWon: string) => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

/**
 * Zustand Store para gerenciar estado de Checkout
 * Integra com CRM para criar/atualizar leads e mover para "Ganho"
 */
export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  isProcessing: false,
  lastCheckoutData: null,
  error: null,

  processCheckout: async (data: any, funnelId: string, stageIdWon: string) => {
    set({ isProcessing: true, error: null });

    try {
      // 1. Calcular Lead Score
      const leadScore = calculateLeadScore({
        name: data.name,
        email: data.email,
        phone: data.phone,
        deal_value: data.productValue,
        source: "checkout",
      }).score;

      // 2. Criar ou atualizar Lead no banco
      const { data: existingLead } = await supabase
        .from("leads")
        .select("id")
        .eq("email", data.email)
        .single();

      let leadId: string;

      if (existingLead) {
        // Atualizar lead existente
        const { data: updatedLead, error: updateError } = await supabase
          .from("leads")
          .update({
            name: data.name,
            email: data.email,
            phone: data.phone,
            deal_value: data.productValue,
            lead_score: leadScore,
            stage_id: stageIdWon, // Mover para "Ganho"
            updated_at: new Date().toISOString(),
            tags: ["checkout", "pagamento_realizado"],
          })
          .eq("id", existingLead.id)
          .select()
          .single();

        if (updateError) throw updateError;
        leadId = updatedLead.id;
      } else {
        // Criar novo lead
        const { data: newLead, error: createError } = await supabase
          .from("leads")
          .insert({
            name: data.name,
            email: data.email,
            phone: data.phone,
            deal_value: data.productValue,
            lead_score: leadScore,
            funnel_id: funnelId,
            stage_id: stageIdWon, // Já criar na coluna "Ganho"
            source: "checkout",
            tags: ["checkout", "pagamento_realizado"],
          })
          .select()
          .single();

        if (createError) throw createError;
        leadId = newLead.id;
      }

      // 3. Registrar evento de checkout no analytics
      await supabase.from("lp_events").insert({
        event_type: "checkout_success",
        metadata: {
          lead_id: leadId,
          product_name: data.productName,
          product_value: data.productValue,
          customer_email: data.email,
          timestamp: data.timestamp,
        },
      });

      // 4. Atualizar estado
      set({
        isProcessing: false,
        lastCheckoutData: {
          ...data,
          leadId,
          leadScore,
        },
      });

      return;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar checkout";
      set({
        isProcessing: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  reset: () =>
    set({
      isProcessing: false,
      lastCheckoutData: null,
      error: null,
    }),
}));
