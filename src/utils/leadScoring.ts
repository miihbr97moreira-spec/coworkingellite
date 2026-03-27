/**
 * AI Lead Scoring Engine
 * Calcula automaticamente a pontuação de um lead (0-100) baseado em:
 * - Dados demográficos
 * - Respostas do quiz
 * - Valor do deal
 * - Engajamento
 */

export interface LeadScoringInput {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  deal_value?: number | null;
  source?: string;
  quiz_answers?: Record<string, any>;
  tags?: string[];
  engagement_level?: "high" | "medium" | "low";
}

export interface LeadScoreResult {
  score: number;
  category: "hot" | "warm" | "cold";
  breakdown: {
    demographic: number;
    engagement: number;
    financial: number;
    behavioral: number;
  };
  recommendation: string;
}

/**
 * Calcula score demográfico baseado em dados do lead
 */
function calculateDemographicScore(input: LeadScoringInput): number {
  let score = 0;

  // Nome completo (indica maior seriedade)
  if (input.name && input.name.split(" ").length >= 2) {
    score += 15;
  } else if (input.name) {
    score += 5;
  }

  // Email corporativo (maior probabilidade de conversão)
  if (input.email) {
    const domain = input.email.split("@")[1]?.toLowerCase();
    if (domain && !["gmail.com", "hotmail.com", "yahoo.com", "outlook.com"].includes(domain)) {
      score += 20; // Email corporativo
    } else {
      score += 5; // Email pessoal
    }
  }

  // Telefone (indica intenção)
  if (input.phone && input.phone.length >= 10) {
    score += 10;
  }

  // Empresa (B2B é mais valioso)
  if (input.company && input.company.length > 2) {
    score += 15;
  }

  return Math.min(score, 50);
}

/**
 * Calcula score de engajamento baseado em interações
 */
function calculateEngagementScore(input: LeadScoringInput): number {
  let score = 0;

  // Nível de engajamento
  if (input.engagement_level === "high") {
    score += 25;
  } else if (input.engagement_level === "medium") {
    score += 15;
  } else {
    score += 5;
  }

  // Tags indicam ações/interesse
  if (input.tags && input.tags.length > 0) {
    score += Math.min(input.tags.length * 5, 15);
  }

  // Fonte de tráfego (alguns canais convertem melhor)
  if (input.source) {
    const highValueSources = ["direct", "email", "referral", "paid_search"];
    if (highValueSources.includes(input.source.toLowerCase())) {
      score += 10;
    }
  }

  return Math.min(score, 30);
}

/**
 * Calcula score financeiro baseado em deal value
 */
function calculateFinancialScore(input: LeadScoringInput): number {
  let score = 0;

  if (!input.deal_value || input.deal_value <= 0) {
    return 0;
  }

  // Escala logarítmica para deal value
  if (input.deal_value >= 100000) {
    score = 25; // Enterprise
  } else if (input.deal_value >= 50000) {
    score = 20; // Mid-market
  } else if (input.deal_value >= 10000) {
    score = 15; // SMB
  } else if (input.deal_value >= 1000) {
    score = 10; // Small
  } else {
    score = 5; // Micro
  }

  return score;
}

/**
 * Calcula score comportamental baseado em respostas do quiz
 */
function calculateBehavioralScore(input: LeadScoringInput): number {
  let score = 0;

  if (!input.quiz_answers) {
    return 0;
  }

  // Análise de respostas para indicadores de qualificação
  const answers = input.quiz_answers;

  // Indicadores de interesse/urgência
  const urgencyKeywords = ["urgente", "imediato", "agora", "rápido", "asap", "critical"];
  const budgetKeywords = ["sim", "yes", "aprovado", "approved", "alocado", "allocated"];
  const authorityKeywords = ["ceo", "diretor", "gerente", "manager", "decisor", "decision"];

  Object.values(answers).forEach((value: any) => {
    const stringValue = String(value).toLowerCase();

    if (urgencyKeywords.some(kw => stringValue.includes(kw))) {
      score += 8;
    }
    if (budgetKeywords.some(kw => stringValue.includes(kw))) {
      score += 10;
    }
    if (authorityKeywords.some(kw => stringValue.includes(kw))) {
      score += 12;
    }
  });

  // Quantidade de respostas preenchidas (engagement)
  const filledAnswers = Object.values(answers).filter(v => v && String(v).length > 0).length;
  score += Math.min(filledAnswers * 2, 15);

  return Math.min(score, 20);
}

/**
 * Função principal: Calcula o lead score completo (0-100)
 */
export function calculateLeadScore(input: LeadScoringInput): LeadScoreResult {
  const demographic = calculateDemographicScore(input);
  const engagement = calculateEngagementScore(input);
  const financial = calculateFinancialScore(input);
  const behavioral = calculateBehavioralScore(input);

  const totalScore = demographic + engagement + financial + behavioral;
  const score = Math.min(Math.round(totalScore), 100);

  // Classificar em categorias
  let category: "hot" | "warm" | "cold";
  if (score >= 80) {
    category = "hot";
  } else if (score >= 40) {
    category = "warm";
  } else {
    category = "cold";
  }

  // Gerar recomendação
  let recommendation = "";
  if (category === "hot") {
    recommendation = "🔥 Prioridade máxima! Contate imediatamente. Lead qualificado com alta probabilidade de conversão.";
  } else if (category === "warm") {
    recommendation = "⚠️ Lead promissor. Acompanhe e qualifique melhor antes de contato comercial.";
  } else {
    recommendation = "❄️ Lead frio. Considere nurturing ou descarte se não houver potencial.";
  }

  return {
    score,
    category,
    breakdown: {
      demographic,
      engagement,
      financial,
      behavioral,
    },
    recommendation,
  };
}

/**
 * Calcula score baseado em respostas de quiz específicas
 * Útil para quizzes de qualificação
 */
export function calculateQuizLeadScore(quizAnswers: Record<string, any>): number {
  const input: LeadScoringInput = {
    quiz_answers: quizAnswers,
  };

  return calculateLeadScore(input).score;
}

/**
 * Retorna cor/classe Tailwind baseada no score
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return "text-red-500"; // Hot - vermelho
  if (score >= 40) return "text-amber-500"; // Warm - âmbar
  return "text-blue-500"; // Cold - azul
}

/**
 * Retorna classe de sombra/glow baseada no score
 */
export function getScoreGlowClass(score: number): string {
  if (score >= 80) return "shadow-[0_0_15px_rgba(239,68,68,0.6)]"; // Hot - glow vermelho
  if (score >= 40) return "shadow-[0_0_10px_rgba(217,119,6,0.4)]"; // Warm - glow âmbar
  return ""; // Cold - sem glow
}

/**
 * Retorna label do score
 */
export function getScoreLabel(score: number): string {
  if (score >= 80) return "🔥 Hot Lead";
  if (score >= 40) return "⚠️ Warm Lead";
  return "❄️ Cold Lead";
}
