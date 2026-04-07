import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const getSessionId = () => {
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
};

export const useAnalyticsTracking = () => {
  const trackEvent = useCallback(async (event: {
    event_type: string;
    path?: string;
    cta_type?: string;
    cta_label?: string;
    cta_id?: string;
    metadata?: Record<string, any>;
  }) => {
    try {
      const { error } = await supabase.from("lp_events").insert([{
        event_type: event.event_type,
        metadata: {
          session_id: getSessionId(),
          user_agent: navigator.userAgent,
          referrer: document.referrer || "direct",
          path: event.path || window.location.pathname,
          cta_type: event.cta_type,
          cta_label: event.cta_label,
          cta_id: event.cta_id,
          ...event.metadata,
        },
      }]);
      if (error) console.error("Erro ao rastrear evento:", error);
    } catch (err) {
      console.error("Erro ao rastrear evento:", err);
    }
  }, []);

  // Track button clicks
  useEffect(() => {
    const handleButtonClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest("[data-cta-id]");
      if (button) {
        trackEvent({
          event_type: "cta_click",
          cta_id: button.getAttribute("data-cta-id") || undefined,
          cta_label: button.getAttribute("data-cta-label") || undefined,
          cta_type: button.getAttribute("data-cta-type") || undefined,
          path: window.location.pathname,
        });
      }
    };
    document.addEventListener("click", handleButtonClick);
    return () => document.removeEventListener("click", handleButtonClick);
  }, [trackEvent]);

  // Track scroll depth
  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout>;
    const tracked = new Set<number>();
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const pct = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        const milestone = [25, 50, 75, 100].find(m => pct >= m && !tracked.has(m));
        if (milestone) {
          tracked.add(milestone);
          trackEvent({
            event_type: "scroll_depth",
            path: window.location.pathname,
            metadata: { scrollPercentage: milestone },
          });
        }
      }, 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [trackEvent]);

  return { trackEvent };
};
