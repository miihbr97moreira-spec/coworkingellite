export interface PageTemplate {
  id: string;
  name: string;
  category: string;
  thumbnail: string;
  description: string;
  html: string;
}

const t = (name: string, cat: string, desc: string, accent: string, heroTitle: string, heroSub: string, features: string[]) => {
  const featureHtml = features.map((f, i) => `
    <div class="bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-8 hover:border-[${accent}]/40 transition-all group">
      <div class="w-12 h-12 bg-[${accent}]/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        <span class="text-2xl">${['🚀','⚡','🎯','💎','📊','🔒'][i % 6]}</span>
      </div>
      <h3 class="text-xl font-bold text-white mb-2">${f}</h3>
      <p class="text-gray-400 text-sm">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.</p>
    </div>`).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Inter', sans-serif; }
    .gradient-text { background: linear-gradient(135deg, ${accent}, #fff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
  </style>
</head>
<body class="bg-gray-950 text-white">
  <!-- Hero -->
  <section class="min-h-screen flex items-center justify-center relative overflow-hidden">
    <div class="absolute inset-0 bg-gradient-to-br from-[${accent}]/10 via-transparent to-transparent"></div>
    <div class="absolute top-20 right-20 w-72 h-72 bg-[${accent}]/20 rounded-full blur-[120px]"></div>
    <div class="relative z-10 text-center max-w-4xl mx-auto px-6">
      <div class="inline-block px-4 py-1.5 rounded-full bg-[${accent}]/10 border border-[${accent}]/20 text-[${accent}] text-sm font-semibold mb-8">${cat}</div>
      <h1 class="text-5xl md:text-7xl font-black tracking-tight mb-6 leading-tight">${heroTitle}</h1>
      <p class="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">${heroSub}</p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="#cta" class="px-8 py-4 bg-[${accent}] text-black font-bold rounded-xl hover:opacity-90 transition-all shadow-lg shadow-[${accent}]/30 text-lg">Começar Agora</a>
        <a href="#features" class="px-8 py-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-lg">Saiba Mais →</a>
      </div>
    </div>
  </section>

  <!-- Features -->
  <section id="features" class="py-24 px-6">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl font-black mb-4">Tudo que você precisa</h2>
        <p class="text-gray-400 text-lg">Soluções completas para o seu negócio</p>
      </div>
      <div class="grid md:grid-cols-3 gap-6">${featureHtml}</div>
    </div>
  </section>

  <!-- Social Proof -->
  <section class="py-24 px-6 bg-white/[0.02]">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-4xl font-black mb-12">O que nossos clientes dizem</h2>
      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-white/5 border border-white/10 rounded-2xl p-8 text-left">
          <div class="flex gap-1 mb-4">${'⭐'.repeat(5)}</div>
          <p class="text-gray-300 mb-4">"Resultado incrível! Superou todas as expectativas. Recomendo fortemente."</p>
          <p class="text-sm text-[${accent}] font-semibold">— Maria Silva, CEO</p>
        </div>
        <div class="bg-white/5 border border-white/10 rounded-2xl p-8 text-left">
          <div class="flex gap-1 mb-4">${'⭐'.repeat(5)}</div>
          <p class="text-gray-300 mb-4">"Profissionalismo de altíssimo nível. Transformou completamente nosso negócio."</p>
          <p class="text-sm text-[${accent}] font-semibold">— João Santos, Diretor</p>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section id="cta" class="py-24 px-6">
    <div class="max-w-3xl mx-auto text-center bg-gradient-to-br from-[${accent}]/10 to-transparent border border-[${accent}]/20 rounded-3xl p-16">
      <h2 class="text-4xl font-black mb-4">Pronto para começar?</h2>
      <p class="text-gray-400 mb-8 text-lg">Transforme seu negócio hoje mesmo.</p>
      <a href="https://wa.me/5511999999999" target="_blank" class="inline-block px-10 py-5 bg-[${accent}] text-black font-bold rounded-xl hover:opacity-90 transition-all text-lg shadow-lg shadow-[${accent}]/30">Falar no WhatsApp →</a>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-12 px-6 border-t border-white/10 text-center text-gray-500 text-sm">
    <p>© 2026 ${name}. Todos os direitos reservados.</p>
  </footer>
</body>
</html>`;
};

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: "imobiliaria",
    name: "Imobiliária Premium",
    category: "Imobiliário",
    thumbnail: "🏠",
    description: "Landing page de alto impacto para imobiliárias e corretores",
    html: t("Imobiliária Premium", "Imóveis de Luxo", "Encontre o imóvel dos seus sonhos com nossa curadoria exclusiva", "#D4A574",
      "Seu Imóvel dos <span class='gradient-text'>Sonhos</span> Está Aqui",
      "Curadoria exclusiva de imóveis de alto padrão. Encontre sua próxima conquista.",
      ["Imóveis Selecionados", "Visita Virtual 360°", "Financiamento Facilitado", "Atendimento VIP", "Documentação Completa", "Pós-Venda Premium"])
  },
  {
    id: "advocacia",
    name: "Escritório de Advocacia",
    category: "Jurídico",
    thumbnail: "⚖️",
    description: "Página profissional para escritórios de advocacia",
    html: t("Advocacia & Direito", "Escritório Jurídico", "Proteja seus direitos com quem entende. Consultoria jurídica especializada.", "#8B7355",
      "Seus Direitos, <span class='gradient-text'>Nossa Missão</span>",
      "Expertise jurídica de excelência. Defendemos seus interesses com rigor e dedicação.",
      ["Direito Empresarial", "Direito Trabalhista", "Direito Civil", "Consultoria Preventiva", "Contratos", "Contencioso"])
  },
  {
    id: "clinica",
    name: "Clínica Médica / Estética",
    category: "Saúde",
    thumbnail: "🏥",
    description: "Para clínicas médicas, estéticas e consultórios",
    html: t("Clínica Premium", "Saúde & Estética", "Sua saúde e beleza em primeiro lugar. Tecnologia de ponta e profissionais qualificados.", "#4ECDC4",
      "Sua Melhor <span class='gradient-text'>Versão</span> Começa Aqui",
      "Tratamentos exclusivos com tecnologia de última geração e equipe especializada.",
      ["Harmonização Facial", "Tratamentos Corporais", "Dermatologia", "Procedimentos Estéticos", "Consultas Online", "Equipe Especializada"])
  },
  {
    id: "restaurante",
    name: "Restaurante / Food",
    category: "Gastronomia",
    thumbnail: "🍽️",
    description: "Perfeito para restaurantes, bares e delivery",
    html: t("Restaurante Gourmet", "Gastronomia Premium", "Experiências gastronômicas únicas que encantam o paladar.", "#E85D04",
      "Uma Experiência <span class='gradient-text'>Gastronômica</span> Única",
      "Pratos autorais preparados com ingredientes selecionados e técnicas refinadas.",
      ["Menu Degustação", "Chef Premiado", "Ambiente Exclusivo", "Carta de Vinhos", "Eventos Privativos", "Delivery Premium"])
  },
  {
    id: "ecommerce",
    name: "E-commerce / Loja",
    category: "E-commerce",
    thumbnail: "🛒",
    description: "Landing page de produto ou loja virtual",
    html: t("Loja Online", "E-commerce Premium", "Produtos selecionados com entrega rápida e segura.", "#6C63FF",
      "Descubra Produtos <span class='gradient-text'>Exclusivos</span>",
      "Curadoria de produtos premium com frete grátis e garantia estendida.",
      ["Frete Grátis", "Garantia Estendida", "Pagamento Seguro", "Troca Fácil", "Atendimento 24/7", "Produtos Originais"])
  },
  {
    id: "saas",
    name: "SaaS / Software",
    category: "Tecnologia",
    thumbnail: "💻",
    description: "Para startups, SaaS e produtos digitais",
    html: t("SaaS Platform", "Software Inteligente", "Automatize processos e escale seu negócio com nossa plataforma.", "#7C3AED",
      "Automatize. Escale. <span class='gradient-text'>Domine</span>.",
      "A plataforma que transforma a maneira como você gerencia seu negócio.",
      ["Automação Inteligente", "Dashboard em Tempo Real", "Integrações Nativas", "API Completa", "Segurança Enterprise", "Suporte Premium"])
  },
  {
    id: "educacao",
    name: "Curso / Infoproduto",
    category: "Educação",
    thumbnail: "📚",
    description: "Página de vendas para cursos e mentorias",
    html: t("Curso Online", "Educação Transformadora", "Aprenda com os melhores. Metodologia comprovada e resultados reais.", "#F59E0B",
      "Transforme sua <span class='gradient-text'>Carreira</span> Agora",
      "Metodologia comprovada por mais de 10.000 alunos. Acesso vitalício.",
      ["Aulas Gravadas", "Comunidade Exclusiva", "Certificado", "Mentoria em Grupo", "Material Complementar", "Acesso Vitalício"])
  },
  {
    id: "fitness",
    name: "Academia / Personal",
    category: "Fitness",
    thumbnail: "💪",
    description: "Para academias, personal trainers e coaches",
    html: t("Fitness Pro", "Performance & Saúde", "Alcance seus objetivos com treinos personalizados e acompanhamento profissional.", "#EF4444",
      "Supere Seus <span class='gradient-text'>Limites</span>",
      "Treinos personalizados, nutrição orientada e resultados garantidos.",
      ["Treino Personalizado", "Avaliação Física", "Nutricionista", "Equipamentos Premium", "Aulas em Grupo", "App de Treino"])
  },
  {
    id: "agencia",
    name: "Agência de Marketing",
    category: "Marketing",
    thumbnail: "📈",
    description: "Para agências de marketing digital e publicidade",
    html: t("Agência Digital", "Marketing de Performance", "Estratégias que geram resultados mensuráveis para o seu negócio.", "#D97757",
      "Marketing que <span class='gradient-text'>Gera Resultados</span>",
      "Estratégias data-driven que transformam investimento em receita.",
      ["Google Ads", "Meta Ads", "SEO Avançado", "Social Media", "Automação", "CRM Integrado"])
  },
  {
    id: "coworking",
    name: "Coworking / Escritório",
    category: "Corporativo",
    thumbnail: "🏢",
    description: "Para coworkings, escritórios virtuais e salas comerciais",
    html: t("Coworking Premium", "Espaço Profissional", "Trabalhe em um ambiente que inspira produtividade e networking.", "#0EA5E9",
      "Seu Escritório <span class='gradient-text'>Premium</span> Te Espera",
      "Infraestrutura completa, localização privilegiada e networking de alto nível.",
      ["Salas Privativas", "Hot Desks", "Sala de Reunião", "Endereço Fiscal", "Internet 1Gbps", "Café Premium"])
  },
  {
    id: "evento",
    name: "Evento / Lançamento",
    category: "Eventos",
    thumbnail: "🎪",
    description: "Página de captação para eventos e lançamentos",
    html: t("Grande Evento", "Evento Exclusivo", "Garanta sua vaga no evento que vai transformar seu mercado.", "#EC4899",
      "O Evento que Vai <span class='gradient-text'>Mudar Tudo</span>",
      "Palestrantes internacionais, networking premium e conteúdo transformador.",
      ["Palestrantes Top", "Networking VIP", "Certificação", "Material Exclusivo", "Coffee Break Premium", "Vagas Limitadas"])
  },
  {
    id: "consultoria",
    name: "Consultoria / Mentoria",
    category: "Consultoria",
    thumbnail: "🎯",
    description: "Para consultores, mentores e coaches",
    html: t("Consultoria Expert", "Consultoria Estratégica", "Acelere seus resultados com consultoria personalizada de alto nível.", "#14B8A6",
      "Resultados <span class='gradient-text'>Extraordinários</span> Começam Aqui",
      "Mentoria personalizada com metodologia comprovada e ROI garantido.",
      ["Diagnóstico Gratuito", "Plano Personalizado", "Acompanhamento Semanal", "Networking Exclusivo", "Ferramentas Premium", "ROI Garantido"])
  },
];
