import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  ShieldCheck, ArrowRight, Zap, Layers, MessageSquare, 
  BarChart3, MousePointer2, Sparkles, CheckCircle2, Star,
  TrendingUp, Globe, Smartphone, Lock
} from "lucide-react";
import { useRef } from "react";

const Home = () => {
  const navigate = useNavigate();
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  const logos = [
    "Digital Nexus", "Quantum Soft", "Elite Flow", "Agência Pro", 
    "Vendas AI", "Growth Master", "Lead Gen", "Scale Up"
  ];

  const features = [
    {
      title: "IA Page Builder",
      description: "Criação de Landing Pages de alta conversão através de prompts simples.",
      icon: <Layers className="w-6 h-6 text-[#D97757]" />,
      image: "/assets/home/builder-preview.png",
      glow: "from-[#D97757]/20 to-transparent"
    },
    {
      title: "CRM Kanban Inteligente",
      description: "Gestão visual e automatizada de todos os seus leads e oportunidades.",
      icon: <BarChart3 className="w-6 h-6 text-[#D97757]" />,
      image: "/assets/home/crm-preview.png",
      glow: "from-[#D97757]/20 to-transparent"
    },
    {
      title: "Quizzes Gamificados",
      description: "Qualifique seus leads de forma interativa e aumente seu ROI.",
      icon: <Zap className="w-6 h-6 text-[#D97757]" />,
      image: "/assets/home/quiz-preview.png",
      glow: "from-[#D97757]/20 to-transparent"
    },
    {
      title: "Omni Flow Hub",
      description: "Automações inteligentes e integração nativa com WhatsApp.",
      icon: <MessageSquare className="w-6 h-6 text-[#D97757]" />,
      image: "/assets/home/flow-preview.png",
      glow: "from-[#D97757]/20 to-transparent"
    }
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-[#D97757]/30 selection:text-[#D97757] font-sans overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D97757]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D97757]/5 blur-[120px] rounded-full" />
        <img 
          src="/assets/home/hero-background.png" 
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay"
          alt=""
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-center">
        <div className="max-w-7xl w-full flex items-center justify-between bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl shadow-2xl">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#D97757] rounded-lg shadow-[0_0_15px_rgba(217,119,87,0.5)]">
              <ShieldCheck className="w-5 h-5 text-black" />
            </div>
            <span className="font-bold text-lg tracking-tight">Omni Builder <span className="text-[#D97757]">CRM</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Funcionalidades</a>
            <a href="#pricing" className="hover:text-white transition-colors">Preços</a>
            <a href="#demo" className="hover:text-white transition-colors">Demonstração</a>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-sm font-medium hover:bg-white/5" onClick={() => navigate("/admin/login")}>Entrar</Button>
            <Button className="bg-[#D97757] hover:bg-[#D97757]/80 text-black font-bold text-sm px-5 rounded-xl shadow-[0_0_20px_rgba(217,119,87,0.3)]" onClick={() => navigate("/admin/login")}>Começar</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={targetRef} className="relative pt-44 pb-32 px-6 flex flex-col items-center justify-center overflow-hidden z-10">
        <motion.div style={{ opacity, scale }} className="max-w-5xl w-full text-center space-y-8 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-bold text-[#D97757] uppercase tracking-widest"
          >
            <Sparkles className="w-3 h-3" /> O Futuro do Marketing Digital Chegou
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight leading-[1.1]"
          >
            Sua agência inteira substituída por uma única <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#D97757] to-[#f4a261]">IA</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-white/60 max-w-3xl mx-auto leading-relaxed"
          >
            O primeiro AI Operating System de Vendas do Brasil. Construa páginas, qualifique leads e automatize seu CRM em um único ecossistema integrado.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-6"
          >
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#D97757] to-[#f4a261] rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse" />
              <Button 
                size="lg" 
                className="relative bg-black text-white hover:bg-black/90 text-lg px-10 py-7 rounded-2xl gap-2 font-bold border border-white/10"
                onClick={() => navigate("/admin/login")}
              >
                Começar Gratuitamente
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            <Button size="lg" variant="ghost" className="text-lg px-10 py-7 rounded-2xl gap-2 border border-white/10 hover:bg-white/5">
              Ver Demonstração
            </Button>
          </motion.div>

          {/* Mega Card Flutuante (Dashboard Preview) */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="mt-20 relative mx-auto max-w-6xl group"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-[#D97757]/20 to-[#f4a261]/20 rounded-[2rem] blur-2xl opacity-50 group-hover:opacity-100 transition duration-1000" />
            <div className="relative bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
              <div className="h-8 bg-white/5 border-b border-white/10 flex items-center px-4 gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
                <div className="ml-4 text-[10px] text-white/20 font-mono tracking-widest uppercase">omni-builder-v2-dashboard.exe</div>
              </div>
              <img 
                src="/assets/home/dashboard-preview.png" 
                alt="Omni Builder Dashboard" 
                className="w-full h-auto grayscale-[20%] group-hover:grayscale-0 transition-all duration-700"
              />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Marquee Social Proof */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02] overflow-hidden z-10">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...logos, ...logos].map((logo, i) => (
            <div key={i} className="flex items-center gap-12 mx-12">
              <span className="text-2xl font-black text-white/20 uppercase tracking-tighter italic">{logo}</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-3 h-3 text-[#D97757]/40 fill-current" />)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 max-w-7xl mx-auto z-10 relative">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Um Ecossistema de <span className="text-[#D97757]">Elite</span></h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto">Tudo o que você precisa para escalar seu negócio digital sem precisar de uma agência ou programador.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative p-1 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl hover:border-[#D97757]/30 transition-all overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <h3 className="text-2xl font-bold">{f.title}</h3>
                </div>
                <p className="text-base text-white/40 leading-relaxed">{f.description}</p>
                <div className="relative mt-4 rounded-2xl overflow-hidden border border-white/5 bg-black/40">
                  <img 
                    src={f.image} 
                    alt={f.title} 
                    className="w-full h-auto opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                    onError={(e) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800";
                    }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sessão Imersiva (Analytics Preview) */}
      <section id="demo" className="py-32 px-6 bg-white/[0.01] relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D97757]/10 border border-[#D97757]/20 text-[10px] font-bold text-[#D97757] uppercase tracking-widest">
              Performance Real-time
            </div>
            <h2 className="text-4xl md:text-6xl font-bold leading-tight">Decisões baseadas em <span className="text-[#D97757]">Dados Reais</span>, não em palpites.</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <TrendingUp className="w-6 h-6 text-[#D97757]" />
                <h4 className="font-bold">ROI Automatizado</h4>
                <p className="text-xs text-white/40">Cálculo instantâneo de retorno sobre investimento por página.</p>
              </div>
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 space-y-2">
                <MousePointer2 className="w-6 h-6 text-[#D97757]" />
                <h4 className="font-bold">Heatmaps Integrados</h4>
                <p className="text-xs text-white/40">Veja exatamente onde seus clientes estão clicando.</p>
              </div>
            </div>
          </div>
          <motion.div 
            initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}
            className="relative group"
          >
            <div className="absolute -inset-4 bg-[#D97757]/10 blur-3xl rounded-full opacity-50" />
            <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              <img 
                src="/assets/home/analytics-preview.png" 
                alt="Omni Analytics" 
                className="w-full h-auto"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1551288049-bbbda536339a?auto=format&fit=crop&q=80&w=800";
                }}
              />
            </div>
            {/* Floating Stats */}
            <div className="absolute -bottom-6 -left-6 p-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-bounce">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-500 font-bold text-xs">+42%</div>
                <div className="text-xs font-bold">Taxa de Conversão</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mobile Experience */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="bg-gradient-to-br from-[#D97757]/20 to-transparent rounded-[3rem] p-12 md:p-24 border border-[#D97757]/20 flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1 space-y-8">
            <h2 className="text-4xl md:text-6xl font-bold">Leve seu CRM no <span className="text-[#D97757]">Bolso</span>.</h2>
            <p className="text-lg text-white/60">Interface 100% responsiva. Gerencie seus leads, responda no WhatsApp e acompanhe suas métricas de qualquer lugar do mundo.</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-sm font-bold"><Smartphone className="w-5 h-5 text-[#D97757]" /> Mobile-First</div>
              <div className="flex items-center gap-2 text-sm font-bold"><Lock className="w-5 h-5 text-[#D97757]" /> 100% Seguro</div>
              <div className="flex items-center gap-2 text-sm font-bold"><Globe className="w-5 h-5 text-[#D97757]" /> Cloud Sync</div>
            </div>
          </div>
          <div className="w-full max-w-[300px] relative">
            <div className="absolute -inset-10 bg-[#D97757]/20 blur-[80px] rounded-full" />
            <img 
              src="/assets/home/mobile-preview.png" 
              alt="Mobile Experience" 
              className="relative z-10 w-full h-auto drop-shadow-[0_0_50px_rgba(217,119,87,0.3)]"
              onError={(e) => {
                e.currentTarget.src = "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=400";
              }}
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 relative overflow-hidden z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#D97757]/5 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Preços <span className="text-[#D97757]">Transparentes</span></h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">Escolha o plano ideal para o momento do seu negócio.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Starter */}
            <div className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Starter</h3>
                <p className="text-sm text-white/40">Para quem está começando agora.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">R$ 197</span>
                <span className="text-white/40 text-sm">/mês</span>
              </div>
              <ul className="space-y-4 text-sm text-white/60">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#D97757]" /> 3 Landing Pages</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#D97757]" /> CRM Kanban Básico</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#D97757]" /> 1 Quiz Ativo</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#D97757]" /> Suporte via Email</li>
              </ul>
              <Button variant="outline" className="w-full py-6 rounded-xl border-white/10 hover:bg-white/5">Começar Agora</Button>
            </div>

            {/* Pro */}
            <div className="relative p-10 bg-white/5 border-2 border-[#D97757] rounded-[2.5rem] backdrop-blur-2xl space-y-8 scale-105 shadow-[0_0_50px_rgba(217,119,87,0.15)] z-10">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-[#D97757] text-black text-[10px] font-black uppercase tracking-widest rounded-full">Mais Popular</div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Pro</h3>
                <p className="text-sm text-white/40">Para negócios em escala.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-bold">R$ 297</span>
                <span className="text-white/40 text-sm">/mês</span>
              </div>
              <ul className="space-y-4 text-sm text-white/80 font-medium">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#D97757]" /> Páginas Ilimitadas</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#D97757]" /> CRM Kanban Completo</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#D97757]" /> Quizzes Ilimitados</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#D97757]" /> Automações de WhatsApp</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-[#D97757]" /> Suporte Prioritário</li>
              </ul>
              <Button className="w-full py-7 rounded-2xl bg-[#D97757] hover:bg-[#D97757]/80 text-black font-bold text-lg shadow-[0_0_30px_rgba(217,119,87,0.3)]">Começar Pro</Button>
            </div>

            {/* Enterprise */}
            <div className="p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl space-y-8">
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Enterprise</h3>
                <p className="text-sm text-white/40">Para agências e grandes operações.</p>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">R$ 397</span>
                <span className="text-white/40 text-sm">/mês</span>
              </div>
              <ul className="space-y-4 text-sm text-white/60">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#D97757]" /> White-label Completo</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#D97757]" /> Gestão de Clientes</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#D97757]" /> APIs Customizadas</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#D97757]" /> Account Manager</li>
              </ul>
              <Button variant="outline" className="w-full py-6 rounded-xl border-white/10 hover:bg-white/5">Falar com Consultor</Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 bg-black z-10 relative">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-[#D97757] rounded-lg">
                <ShieldCheck className="w-5 h-5 text-black" />
              </div>
              <span className="font-bold text-xl tracking-tight">Omni Builder <span className="text-[#D97757]">CRM</span></span>
            </div>
            <p className="text-white/40 text-sm max-w-sm leading-relaxed">O primeiro AI Operating System de Vendas do Brasil. Transformamos complexidade em lucro através de inteligência artificial.</p>
          </div>
          <div className="space-y-6">
            <h4 className="font-bold text-sm uppercase tracking-widest text-white/60">Produto</h4>
            <ul className="space-y-3 text-sm text-white/40">
              <li><a href="#" className="hover:text-white transition-colors">Builder</a></li>
              <li><a href="#" className="hover:text-white transition-colors">CRM</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Quizzes</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Omni Flow</a></li>
            </ul>
          </div>
          <div className="space-y-6">
            <h4 className="font-bold text-sm uppercase tracking-widest text-white/60">Legal</h4>
            <ul className="space-y-3 text-sm text-white/40">
              <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookies</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-10 border-t border-white/5 text-center text-xs text-white/20">
          © 2026 Omni Builder CRM. Todos os direitos reservados. Design by Elite Team.
        </div>
      </footer>

      {/* Custom Styles */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default Home;
