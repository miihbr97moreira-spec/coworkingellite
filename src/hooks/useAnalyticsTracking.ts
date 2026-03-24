import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface TrackingEvent {
  event_type: "page_view" | "button_click" | "form_submit" | "scroll" | "video_play";
  cta_type?: "whatsapp" | "url" | "email" | "phone" | "anchor";
  cta_label?: string;
  cta_id?: string;
  session_id: string;
  user_agent: string;
  referrer: string;
  path: string;
  metadata?: Record<string, any>;
}

const getSessionId = () => {
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
};

export const useAnalyticsTracking = () => {
  const trackEvent = useCallback(async (event: Omit<TrackingEvent, "session_id" | "user_agent" | "referrer">) => {
    try {
      const trackingData: TrackingEvent = {
        ...event,
        session_id: getSessionId(),
        user_agent: navigator.userAgent,
        referrer: document.referrer || "direct",
      };

      const { error } = await supabase.from("lp_events").insert([trackingData]);
      if (error) console.error("Erro ao rastrear evento:", error);
    } catch (err) {
      console.error("Erro ao rastrear evento:", err);
    }
  }, []);

  // Rastrear cliques em botões
  useEffect(() => {
    const handleButtonClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest("[data-cta-id]");
      
      if (button) {
        const ctaId = button.getAttribute("data-cta-id");
        const ctaLabel = button.getAttribute("data-cta-label");
        const ctaType = button.getAttribute("data-cta-type") as any;

        trackEvent({
          event_type: "button_click",
          cta_id: ctaId || undefined,
          cta_label: ctaLabel || undefined,
          cta_type: ctaType || undefined,
          path: window.location.pathname,
        });
      }
    };

    document.addEventListener("click", handleButtonClick);
    return () => document.removeEventListener("click", handleButtonClick);
  }, [trackEvent]);

  // Rastrear scroll
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercentage > 25 && scrollPercentage < 30) {
          trackEvent({
            event_type: "scroll",
            path: window.location.pathname,
            metadata: { scrollPercentage: Math.round(scrollPercentage) },
          });
        }
      }, 1000);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [trackEvent]);

  return { trackEvent };
};
