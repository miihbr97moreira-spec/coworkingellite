export interface QuizTemplate {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  description: string;
  theme: {
    bgColor: string;
    textColor: string;
    buttonColor: string;
    buttonTextColor: string;
    fontFamily: string;
    accentColor?: string;
    cardBgColor?: string;
    gradientStart?: string;
    gradientEnd?: string;
    backdropBlur?: boolean;
  };
  questions: {
    id: string;
    type: "multiple_choice" | "text" | "phone" | "email" | "image_grid";
    title: string;
    options?: string[];
    required?: boolean;
    auto_advance?: boolean;
    enable_fake_loading?: boolean;
    fake_loading_text?: string;
    button_text?: string;
    card_style?: string;
    option_style?: string;
  }[];
}

export const QUIZ_TEMPLATES: QuizTemplate[] = [
  {
    id: "imobiliario",
    name: "Perfil do Comprador de Imóvel",
    category: "Imobiliário",
    thumbnail: "🏠",
    description: "Qualifique leads para corretores e imobiliárias",
    theme: { bgColor: "#0f172a", textColor: "#ffffff", buttonColor: "#D4A574", buttonTextColor: "#000000", fontFamily: "Inter", accentColor: "#D4A574", cardBgColor: "rgba(255,255,255,0.06)", gradientStart: "#0f172a", gradientEnd: "#1a1a2e", backdropBlur: true },
    questions: [
      { id: "q1", type: "multiple_choice", title: "Qual tipo de imóvel você procura?", options: ["Apartamento", "Casa", "Cobertura", "Terreno", "Comercial"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "cards", button_text: "PRÓXIMO" },
      { id: "q2", type: "multiple_choice", title: "Qual sua faixa de investimento?", options: ["Até R$ 300mil", "R$ 300mil - R$ 600mil", "R$ 600mil - R$ 1M", "Acima de R$ 1M"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "cards" },
      { id: "q3", type: "multiple_choice", title: "Qual região de interesse?", options: ["Zona Sul", "Zona Norte", "Zona Oeste", "Zona Leste", "Litoral"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "pills" },
      { id: "q4", type: "multiple_choice", title: "Quando pretende comprar?", options: ["Imediato", "1-3 meses", "3-6 meses", "Apenas pesquisando"], required: true, auto_advance: true, enable_fake_loading: true, fake_loading_text: "Buscando imóveis ideais para você...", card_style: "glassmorphism", option_style: "cards" },
      { id: "q5", type: "text", title: "Qual seu nome completo?", required: true, button_text: "CONTINUAR", card_style: "glassmorphism" },
      { id: "q6", type: "phone", title: "Qual seu WhatsApp?", required: true, button_text: "VER IMÓVEIS EXCLUSIVOS", card_style: "glassmorphism" },
    ]
  },
  {
    id: "estetica",
    name: "Diagnóstico de Pele / Estética",
    category: "Saúde & Estética",
    thumbnail: "✨",
    description: "Capte leads para clínicas de estética",
    theme: { bgColor: "#0c0a09", textColor: "#ffffff", buttonColor: "#4ECDC4", buttonTextColor: "#000000", fontFamily: "Inter", accentColor: "#4ECDC4", cardBgColor: "rgba(78,205,196,0.06)", gradientStart: "#0c0a09", gradientEnd: "#1c1917", backdropBlur: true },
    questions: [
      { id: "q1", type: "multiple_choice", title: "Qual sua principal preocupação?", options: ["Rugas e linhas finas", "Manchas na pele", "Flacidez", "Acne", "Olheiras"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "cards" },
      { id: "q2", type: "multiple_choice", title: "Qual sua faixa etária?", options: ["18-25", "26-35", "36-45", "46-55", "55+"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "pills" },
      { id: "q3", type: "multiple_choice", title: "Já fez algum procedimento estético?", options: ["Sim, vários", "Sim, poucos", "Nunca, é a primeira vez"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "cards" },
      { id: "q4", type: "multiple_choice", title: "Qual seu orçamento mensal para cuidados?", options: ["Até R$ 500", "R$ 500 - R$ 1.500", "R$ 1.500 - R$ 3.000", "Acima de R$ 3.000"], required: true, auto_advance: true, enable_fake_loading: true, fake_loading_text: "Analisando seu perfil de pele...", card_style: "glassmorphism", option_style: "cards" },
      { id: "q5", type: "text", title: "Qual seu nome?", required: true, button_text: "CONTINUAR" },
      { id: "q6", type: "phone", title: "Seu WhatsApp para receber o diagnóstico", required: true, button_text: "RECEBER DIAGNÓSTICO GRATUITO" },
    ]
  },
  {
    id: "fitness",
    name: "Avaliação Fitness / Personal",
    category: "Fitness",
    thumbnail: "💪",
    description: "Qualifique alunos para personal trainers e academias",
    theme: { bgColor: "#0f0f0f", textColor: "#ffffff", buttonColor: "#EF4444", buttonTextColor: "#ffffff", fontFamily: "Inter", accentColor: "#EF4444", cardBgColor: "rgba(239,68,68,0.06)", gradientStart: "#0f0f0f", gradientEnd: "#1a0a0a", backdropBlur: true },
    questions: [
      { id: "q1", type: "multiple_choice", title: "Qual seu principal objetivo?", options: ["Emagrecer", "Ganhar massa muscular", "Condicionamento físico", "Saúde e bem-estar", "Competição"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "cards" },
      { id: "q2", type: "multiple_choice", title: "Com que frequência você treina?", options: ["Nunca treinei", "1-2x por semana", "3-4x por semana", "5+ vezes por semana"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "cards" },
      { id: "q3", type: "multiple_choice", title: "Qual horário você prefere treinar?", options: ["Manhã (6h-10h)", "Meio-dia (11h-14h)", "Tarde (14h-18h)", "Noite (18h-22h)"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "pills" },
      { id: "q4", type: "multiple_choice", title: "Quanto pretende investir por mês?", options: ["Até R$ 200", "R$ 200 - R$ 500", "R$ 500 - R$ 1.000", "Acima de R$ 1.000"], required: true, auto_advance: true, enable_fake_loading: true, fake_loading_text: "Montando seu plano de treino ideal...", card_style: "glassmorphism", option_style: "cards" },
      { id: "q5", type: "text", title: "Qual seu nome?", required: true, button_text: "CONTINUAR" },
      { id: "q6", type: "phone", title: "Seu WhatsApp para receber o plano", required: true, button_text: "RECEBER MEU PLANO" },
    ]
  },
  {
    id: "educacao",
    name: "Qualificação para Curso Online",
    category: "Educação",
    thumbnail: "📚",
    description: "Filtre leads para infoprodutos e cursos",
    theme: { bgColor: "#0f172a", textColor: "#ffffff", buttonColor: "#F59E0B", buttonTextColor: "#000000", fontFamily: "Inter", accentColor: "#F59E0B", cardBgColor: "rgba(245,158,11,0.06)", gradientStart: "#0f172a", gradientEnd: "#1e1b4b", backdropBlur: true },
    questions: [
      { id: "q1", type: "multiple_choice", title: "Qual seu nível de experiência?", options: ["Iniciante total", "Já sei o básico", "Intermediário", "Avançado"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "cards" },
      { id: "q2", type: "multiple_choice", title: "Quanto tempo por dia pode dedicar?", options: ["30 minutos", "1 hora", "2 horas", "Mais de 2 horas"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "pills" },
      { id: "q3", type: "multiple_choice", title: "Qual seu maior desafio atualmente?", options: ["Falta de conhecimento", "Falta de tempo", "Falta de orientação", "Falta de motivação"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "cards" },
      { id: "q4", type: "multiple_choice", title: "Quanto pretende investir em educação?", options: ["Até R$ 200", "R$ 200 - R$ 500", "R$ 500 - R$ 1.000", "Acima de R$ 1.000"], required: true, auto_advance: true, enable_fake_loading: true, fake_loading_text: "Personalizando sua trilha de aprendizado...", card_style: "glassmorphism", option_style: "cards" },
      { id: "q5", type: "email", title: "Qual seu melhor e-mail?", required: true, button_text: "CONTINUAR" },
      { id: "q6", type: "phone", title: "WhatsApp para envio da aula gratuita", required: true, button_text: "RECEBER AULA GRATUITA" },
    ]
  },
  {
    id: "marketing",
    name: "Diagnóstico de Marketing Digital",
    category: "Marketing",
    thumbnail: "📈",
    description: "Qualifique empresas para agências de marketing",
    theme: { bgColor: "#09090b", textColor: "#ffffff", buttonColor: "#D97757", buttonTextColor: "#000000", fontFamily: "Inter", accentColor: "#D97757", cardBgColor: "rgba(217,119,87,0.06)", gradientStart: "#09090b", gradientEnd: "#1c1917", backdropBlur: true },
    questions: [
      { id: "q1", type: "multiple_choice", title: "Qual o segmento da sua empresa?", options: ["E-commerce", "Serviços", "SaaS / Tech", "Varejo Físico", "Consultoria"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "cards" },
      { id: "q2", type: "multiple_choice", title: "Qual seu faturamento mensal?", options: ["Até R$ 10mil", "R$ 10mil - R$ 50mil", "R$ 50mil - R$ 200mil", "Acima de R$ 200mil"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "cards" },
      { id: "q3", type: "multiple_choice", title: "Investe em tráfego pago?", options: ["Não, nunca investi", "Sim, menos de R$ 3mil/mês", "Sim, R$ 3mil - R$ 10mil/mês", "Sim, mais de R$ 10mil/mês"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "cards" },
      { id: "q4", type: "multiple_choice", title: "Qual seu maior desafio?", options: ["Gerar leads qualificados", "Aumentar vendas", "Fortalecer a marca", "Reter clientes"], required: true, auto_advance: true, enable_fake_loading: true, fake_loading_text: "Gerando seu diagnóstico personalizado...", card_style: "glassmorphism", option_style: "cards" },
      { id: "q5", type: "text", title: "Qual seu nome e empresa?", required: true, button_text: "CONTINUAR" },
      { id: "q6", type: "phone", title: "WhatsApp para envio do diagnóstico", required: true, button_text: "RECEBER DIAGNÓSTICO GRATUITO" },
    ]
  },
  {
    id: "juridico",
    name: "Triagem Jurídica",
    category: "Jurídico",
    thumbnail: "⚖️",
    description: "Qualifique clientes para escritórios de advocacia",
    theme: { bgColor: "#0c0a09", textColor: "#ffffff", buttonColor: "#8B7355", buttonTextColor: "#ffffff", fontFamily: "Inter", accentColor: "#8B7355", cardBgColor: "rgba(139,115,85,0.06)", gradientStart: "#0c0a09", gradientEnd: "#1c1917", backdropBlur: true },
    questions: [
      { id: "q1", type: "multiple_choice", title: "Qual área do direito você precisa?", options: ["Trabalhista", "Empresarial", "Civil / Família", "Criminal", "Tributário", "Imobiliário"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "cards" },
      { id: "q2", type: "multiple_choice", title: "Qual a urgência do seu caso?", options: ["Muito urgente (dias)", "Urgente (semanas)", "Pode aguardar (meses)", "Apenas consultoria"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "cards" },
      { id: "q3", type: "multiple_choice", title: "Já tem advogado no caso?", options: ["Não, preciso de um", "Sim, mas quero trocar", "Quero segunda opinião"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "pills" },
      { id: "q4", type: "text", title: "Descreva brevemente sua situação", required: true, button_text: "CONTINUAR", enable_fake_loading: true, fake_loading_text: "Analisando seu caso..." },
      { id: "q5", type: "text", title: "Qual seu nome completo?", required: true, button_text: "CONTINUAR" },
      { id: "q6", type: "phone", title: "WhatsApp para contato do advogado", required: true, button_text: "SOLICITAR ANÁLISE GRATUITA" },
    ]
  },
  {
    id: "restaurante",
    name: "Reserva / Preferências Gastronômicas",
    category: "Gastronomia",
    thumbnail: "🍽️",
    description: "Capte reservas e preferências para restaurantes",
    theme: { bgColor: "#0c0a09", textColor: "#ffffff", buttonColor: "#E85D04", buttonTextColor: "#ffffff", fontFamily: "Inter", accentColor: "#E85D04", cardBgColor: "rgba(232,93,4,0.06)", gradientStart: "#0c0a09", gradientEnd: "#1a0c00", backdropBlur: true },
    questions: [
      { id: "q1", type: "multiple_choice", title: "Qual a ocasião?", options: ["Jantar Romântico", "Aniversário", "Reunião de Negócios", "Confraternização", "Evento Especial"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "cards" },
      { id: "q2", type: "multiple_choice", title: "Quantas pessoas?", options: ["2 pessoas", "3-4 pessoas", "5-8 pessoas", "9+ pessoas"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "pills" },
      { id: "q3", type: "multiple_choice", title: "Alguma restrição alimentar?", options: ["Nenhuma", "Vegetariano", "Vegano", "Sem Glúten", "Sem Lactose"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "pills" },
      { id: "q4", type: "text", title: "Qual seu nome?", required: true, button_text: "CONTINUAR" },
      { id: "q5", type: "phone", title: "WhatsApp para confirmação da reserva", required: true, button_text: "RESERVAR MESA", enable_fake_loading: true, fake_loading_text: "Verificando disponibilidade..." },
    ]
  },
  {
    id: "coaching",
    name: "Assessment de Coaching / Mentoria",
    category: "Coaching",
    thumbnail: "🎯",
    description: "Qualifique mentorados para coaches e mentores",
    theme: { bgColor: "#0f172a", textColor: "#ffffff", buttonColor: "#14B8A6", buttonTextColor: "#000000", fontFamily: "Inter", accentColor: "#14B8A6", cardBgColor: "rgba(20,184,166,0.06)", gradientStart: "#0f172a", gradientEnd: "#0f2a2a", backdropBlur: true },
    questions: [
      { id: "q1", type: "multiple_choice", title: "Qual área deseja desenvolver?", options: ["Carreira", "Negócios", "Relacionamentos", "Saúde & Bem-estar", "Financeiro"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "cards" },
      { id: "q2", type: "multiple_choice", title: "Onde você está na sua jornada?", options: ["Começando do zero", "Já tentei mas não funcionou", "Tenho resultados mas quero mais", "Estou no topo e quero manter"], required: true, auto_advance: true, card_style: "glassmorphism", option_style: "cards" },
      { id: "q3", type: "multiple_choice", title: "Quanto está disposto a investir em si?", options: ["Até R$ 500/mês", "R$ 500 - R$ 2.000/mês", "R$ 2.000 - R$ 5.000/mês", "Acima de R$ 5.000/mês"], required: true, auto_advance: true, enable_fake_loading: true, fake_loading_text: "Preparando sua análise personalizada...", card_style: "glassmorphism", option_style: "cards" },
      { id: "q4", type: "text", title: "Qual seu nome?", required: true, button_text: "CONTINUAR" },
      { id: "q5", type: "email", title: "Seu melhor e-mail", required: true, button_text: "CONTINUAR" },
      { id: "q6", type: "phone", title: "WhatsApp para sessão estratégica", required: true, button_text: "AGENDAR SESSÃO GRATUITA" },
    ]
  },
];
