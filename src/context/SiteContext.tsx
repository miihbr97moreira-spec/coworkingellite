import React, { createContext, useContext, useState, ReactNode } from "react";

// Legacy context kept for backward compatibility - data now comes from Supabase
export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  stars: number;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  priceNote?: string;
  features: string[];
  whatsappMessage: string;
  highlight?: boolean;
}

export interface SiteContent {
  heroHeadline: string;
  heroSubheadline: string;
  whatsappNumber: string;
  metaPixelId: string;
  googleAnalyticsId: string;
  testimonials: Testimonial[];
  plans: Plan[];
  galleryImages: string[];
}

const defaultContent: SiteContent = {
  heroHeadline: "",
  heroSubheadline: "",
  whatsappNumber: "5511976790653",
  metaPixelId: "",
  googleAnalyticsId: "",
  testimonials: [],
  plans: [],
  galleryImages: [],
};

interface SiteContextType {
  content: SiteContent;
  updateContent: (updates: Partial<SiteContent>) => void;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export const SiteProvider = ({ children }: { children: ReactNode }) => {
  const [content] = useState<SiteContent>(defaultContent);
  const [isAdmin, setIsAdmin] = useState(false);
  const updateContent = () => {};

  return (
    <SiteContext.Provider value={{ content, updateContent, isAdmin, setIsAdmin }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSiteContent = () => {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSiteContent must be inside SiteProvider");
  return ctx;
};
