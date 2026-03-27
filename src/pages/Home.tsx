import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion, useScroll, useTransform } from "framer-motion";
import { 
  ShieldCheck, ArrowRight, Zap, Layers, MessageSquare, 
  BarChart3, MousePointer2, Sparkles, CheckCircle2, Star
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
      glow: "from-[#D97757]/20 to-transparent"
    },
    {
      title: "CRM Kanban Inteligente",
      description: "Gestão visual e automatizada de todos os seus leads e oportunidades.",
      icon: <BarChart3 className="w-6 h-6 text-[#D97757]" />,
      glow: "from-[#D97757]/20 to-transparent"
    },
    {
      title: "Quizzes Gamificados",
      description: "Qualifique seus leads de forma interativa e aumente seu ROI.",
      icon: <Zap className="w-6 h-6 text-[#D97757]" />,
      glow: "from-[#D97757]/20 to-transparent"
    },
    {
      title: "Omni Flow Hub",
      description: "Automações inteligentes e integração nativa com WhatsApp.",
      icon: <MessageSquare className="w-6 h-6 text-[#D97757]" />,
      glow: "from-[#D97757]/20 to-transparent"
    }
  ];

  return (
    <div className="min-h-screen bg-[#000000] text-white selection:bg-[#D97757]/30 selection:text-[#D97757] font-sans overflow-x-hidden">
      {/* Background Glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D97757]/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D97757]/5 blur-[120px] rounded-full" />
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
            <a href="#about" className="hover:text-white transition-colors">Sobre</a>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="text-sm font-medium hover:bg-white/5" onClick={() => navigate("/admin/login")}>Entrar</Button>
            <Button className="bg-[#D97757] hover:bg-[#D97757]/80 text-black font-bold text-sm px-5 rounded-xl shadow-[0_0_20px_rgba(217,119,87,0.3)]" onClick={() => navigate("/admin/login")}>Começar</Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={targetRef} className="relative pt-44 pb-32 px-6 flex flex-col items-center justify-center overflow-hidden">
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

          {/* Floating Elements */}
          <motion.div 
            animate={{ y: [0, -15, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-20 top-40 hidden lg:block"
          >
            <div className="p-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div className="text-left">
                <p className="text-xs text-white/40 font-bold uppercase tracking-wider">Novo Lead Qualificado</p>
                <p className="font-bold">João Silva - ROI 4.5x</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            animate={{ y: [0, 15, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            className="absolute -right-20 bottom-20 hidden lg:block"
          >
            <div className="p-4 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl flex items-center gap-4">
              <div className="w-10 h-10 bg-[#D97757]/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-[#D97757]" />
              </div>
              <div className="text-left">
                <p className="text-xs text-white/40 font-bold uppercase tracking-wider">IA Gerando Página</p>
                <p className="font-bold">Status: 98% Concluído</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Marquee Social Proof */}
      <section className="py-10 border-y border-white/5 bg-white/[0.02] overflow-hidden">
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
      <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-20">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Um Ecossistema de <span className="text-[#D97757]">Elite</span></h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto">Tudo o que você precisa para escalar seu negócio digital sem precisar de uma agência ou programador.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}
              className="group relative p-8 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl hover:border-[#D97757]/30 transition-all"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${f.glow} opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl`} />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 relative overflow-hidden">
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
      <footer className="py-20 border-t border-white/5 bg-black">
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
