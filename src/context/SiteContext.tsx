import React, { createContext, useContext, useState, ReactNode } from "react";

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

const defaultTestimonials: Testimonial[] = [
  { id: "1", name: "Dr. Marcos Oliveira", role: "Advogado", text: "Trabalhar em casa tirava minha autoridade. No Ellite, fechei 3 clientes no primeiro mês só pela apresentação da sala de reunião.", stars: 5 },
  { id: "2", name: "Dra. Camila Santos", role: "Médica Dermatologista", text: "O ambiente premium passa credibilidade imediata. Meus pacientes me enxergam de forma diferente desde que migrei para cá.", stars: 5 },
  { id: "3", name: "Ricardo Mendes", role: "Corretor de Imóveis", text: "Fechei vendas de alto padrão porque o espaço transmite exatamente o que meu cliente espera: excelência.", stars: 5 },
  { id: "4", name: "Ana Beatriz Costa", role: "Consultora de Marketing", text: "Saí do home office e tripliquei meu faturamento em 4 meses. O networking aqui é incomparável.", stars: 5 },
  { id: "5", name: "Fernando Lima", role: "Arquiteto", text: "Receber clientes no Ellite é outra experiência. O design do espaço já vende por mim.", stars: 5 },
  { id: "6", name: "Patrícia Almeida", role: "Psicóloga", text: "Ambiente silencioso, privativo e elegante. Perfeito para minhas sessões e atendimentos.", stars: 5 },
  { id: "7", name: "Carlos Eduardo", role: "Advogado Tributarista", text: "A localização perto do metrô Moema é estratégica. Meus clientes agradecem a acessibilidade.", stars: 5 },
  { id: "8", name: "Juliana Rocha", role: "Designer de Interiores", text: "O café premium incluso e o ambiente inspirador fazem toda diferença na minha produtividade.", stars: 5 },
  { id: "9", name: "Dr. Henrique Bastos", role: "Consultor Financeiro", text: "Profissionalismo que gera confiança. Meus clientes percebem o valor desde o primeiro contato.", stars: 5 },
  { id: "10", name: "Mariana Fonseca", role: "Coach Executiva", text: "Cada detalhe do espaço comunica sofisticação. É exatamente o que minha marca precisa.", stars: 5 },
  { id: "11", name: "Thiago Amaral", role: "Corretor de Seguros", text: "Investir no Ellite foi o melhor custo-benefício para meu negócio. Retorno imediato em credibilidade.", stars: 5 },
  { id: "12", name: "Renata Duarte", role: "Nutricionista", text: "Ambiente perfeito para consultas. Meus pacientes se sentem acolhidos e valorizados.", stars: 5 },
];

const defaultPlans: Plan[] = [
  {
    id: "hora",
    name: "Hora",
    price: "R$ 40",
    priceNote: "/hora",
    features: ["1 estação de trabalho", "Internet rápida", "Café e água free"],
    whatsappMessage: "Olá, tenho interesse no plano por hora de R$ 40. Gostaria de mais informações!",
  },
  {
    id: "diaria",
    name: "Diária",
    price: "R$ 200",
    priceNote: "/dia",
    features: ["2 estações de trabalho", "Internet rápida", "Café e água free"],
    whatsappMessage: "Olá, tenho interesse no plano diário de R$ 200. Gostaria de mais informações!",
    highlight: true,
  },
  {
    id: "mensal",
    name: "Mensal",
    price: "R$ 130",
    priceNote: "/dia (mín. 10 diárias)",
    features: ["3 estações de trabalho", "2 diárias na sala de reunião (4 pessoas)", "Internet rápida", "Café e água free", "Frigobar exclusivo"],
    whatsappMessage: "Olá, tenho interesse no plano mensal a partir de R$ 130/dia. Gostaria de mais informações!",
  },
];

const defaultContent: SiteContent = {
  heroHeadline: "Saia do amadorismo do Home Office. Feche contratos de alto valor em um ambiente de elite.",
  heroSubheadline: "O coworking premium em Moema para profissionais que exigem excelência. Sua próxima conquista começa aqui.",
  whatsappNumber: "5511976790653",
  metaPixelId: "",
  googleAnalyticsId: "",
  testimonials: defaultTestimonials,
  plans: defaultPlans,
  galleryImages: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1604328698692-f76ea9498e76?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1572025442646-866d16c84a54?w=600&h=400&fit=crop",
  ],
};

interface SiteContextType {
  content: SiteContent;
  updateContent: (updates: Partial<SiteContent>) => void;
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export const SiteProvider = ({ children }: { children: ReactNode }) => {
  const [content, setContent] = useState<SiteContent>(() => {
    const saved = localStorage.getItem("ellite-content");
    return saved ? { ...defaultContent, ...JSON.parse(saved) } : defaultContent;
  });
  const [isAdmin, setIsAdmin] = useState(false);

  const updateContent = (updates: Partial<SiteContent>) => {
    setContent(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem("ellite-content", JSON.stringify(next));
      return next;
    });
  };

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
