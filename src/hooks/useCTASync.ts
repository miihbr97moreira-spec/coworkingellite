import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CTA {
  id: string;
  label: string;
  type: "whatsapp" | "url" | "email" | "phone" | "anchor";
  destination: string;
  color: string;
  active: boolean;
  position: number;
  whatsapp_message?: string;
  plan_specific?: boolean;
  plan_messages?: Record<string, string>;
}

export const useCTASync = () => {
  const qc = useQueryClient();

  // Buscar todos os CTAs do banco
  const { data: ctas, isLoading } = useQuery({
    queryKey: ["cta-buttons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cta_buttons").select("*").order("position");
      if (error) throw error;
      return data as CTA[];
    },
  });

  // Sincronizar cliques de botões com os CTAs configurados
  const syncCTAClick = useCallback(
    async (ctaId: string, ctaLabel: string, ctaType: string, fallbackDestination?: string, fallbackMessage?: string) => {
      try {
        // Encontrar o CTA correspondente
        const matchingCTA = ctas?.find((c) => c.id === ctaId || c.label === ctaLabel);

        if (matchingCTA && matchingCTA.active) {
          // Se for WhatsApp, usar a mensagem configurada
          if (matchingCTA.type === "whatsapp") {
            let message = matchingCTA.whatsapp_message || fallbackMessage || "Olá! Gostaria de saber mais sobre o Ellite Coworking.";
            
            // Se for específico por plano e tiver metadados de plano
            if (matchingCTA.plan_specific && matchingCTA.plan_messages && ctaId.startsWith('plan-')) {
              const planId = ctaId.replace('plan-', '');
              const planNameMap: Record<string, string> = {
                'hora': 'Estação',
                'diaria': 'Sala Reunião',
                'mensal': 'Coworking Full'
              };
              const planName = planNameMap[planId] || planId;
              if (matchingCTA.plan_messages[planName]) {
                message = matchingCTA.plan_messages[planName];
              }
            }
            
            const whatsappNumber = matchingCTA.destination || fallbackDestination;
            if (whatsappNumber) {
              window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank");
            }
          }
          // Se for URL
          else if (matchingCTA.type === "url") {
            window.open(matchingCTA.destination || fallbackDestination || "#", "_blank");
          }
          // Se for Email
          else if (matchingCTA.type === "email") {
            window.location.href = `mailto:${matchingCTA.destination || fallbackDestination}`;
          }
          // Se for Telefone
          else if (matchingCTA.type === "phone") {
            window.location.href = `tel:${matchingCTA.destination || fallbackDestination}`;
          }
          // Se for Âncora
          else if (matchingCTA.type === "anchor") {
            const targetId = (matchingCTA.destination || fallbackDestination || "").replace('#', '');
            const element = document.getElementById(targetId);
            if (element) {
              element.scrollIntoView({ behavior: "smooth" });
            }
          }
        } else {
          // Fallback se não encontrar no banco ou estiver inativo
          if (ctaType === "whatsapp" && fallbackDestination) {
            window.open(`https://wa.me/${fallbackDestination}?text=${encodeURIComponent(fallbackMessage || "Olá!")}`, "_blank");
          } else if (ctaType === "anchor" && fallbackDestination) {
            const element = document.getElementById(fallbackDestination.replace('#', ''));
            if (element) element.scrollIntoView({ behavior: "smooth" });
          } else if (ctaType === "url" && fallbackDestination) {
            window.open(fallbackDestination, "_blank");
          }
        }
      } catch (error) {
        console.error("Erro ao sincronizar CTA:", error);
      }
    },
    [ctas]
  );

  // Invalidar cache quando houver mudanças
  const invalidateCache = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["cta-buttons"] });
  }, [qc]);

  return { ctas, isLoading, syncCTAClick, invalidateCache };
};
