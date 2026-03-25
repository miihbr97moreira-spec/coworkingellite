import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CTA {
  id: string;
  label: string;
  type: string;
  destination: string;
  color: string;
  active: boolean;
  position: number;
  whatsapp_message?: string | null;
  plan_specific?: boolean | null;
  plan_messages?: Record<string, string> | null;
}

export const useCTASync = () => {
  const qc = useQueryClient();

  const { data: ctas, isLoading } = useQuery({
    queryKey: ["cta-buttons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cta_buttons").select("*").order("position");
      if (error) throw error;
      return data as CTA[];
    },
  });

  const syncCTAClick = useCallback(
    async (ctaId: string, ctaLabel: string, _ctaType: string) => {
      try {
        const matchingCTA = ctas?.find((c) => c.id === ctaId || c.label === ctaLabel);
        if (matchingCTA) {
          if (matchingCTA.type === "whatsapp") {
            const message = matchingCTA.whatsapp_message || "Olá! Gostaria de saber mais sobre o Ellite Coworking.";
            window.open(`https://wa.me/${matchingCTA.destination}?text=${encodeURIComponent(message)}`, "_blank");
          } else if (matchingCTA.type === "url") {
            window.open(matchingCTA.destination, "_blank");
          } else if (matchingCTA.type === "email") {
            window.location.href = `mailto:${matchingCTA.destination}`;
          } else if (matchingCTA.type === "phone") {
            window.location.href = `tel:${matchingCTA.destination}`;
          } else if (matchingCTA.type === "anchor") {
            document.getElementById(matchingCTA.destination)?.scrollIntoView({ behavior: "smooth" });
          }
        }
      } catch (error) {
        console.error("Erro ao sincronizar CTA:", error);
      }
    },
    [ctas]
  );

  const invalidateCache = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["cta-buttons"] });
  }, [qc]);

  return { ctas, isLoading, syncCTAClick, invalidateCache };
};