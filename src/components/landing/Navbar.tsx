import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight, Sparkles } from "lucide-react";
import { useCTAs, trackEvent } from "@/hooks/useSupabaseQuery";

const links = [
  { label: "Início", href: "#" },
  { label: "Espaço", href: "#espaco" },
  { label: "Planos", href: "#planos" },
  { label: "Contato", href: "#contato" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: ctas } = useCTAs();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (href: string) => {
    setOpen(false);
    if (href === "#") return window.scrollTo({ top: 0, behavior: "smooth" });
    const id = href.replace("#", "");
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleCTAClick = (cta: any) => {
    trackEvent("cta_click", { label: cta.label, type: cta.type, source: "navbar" });
    
    if (cta.type === 'whatsapp') {
      window.open(`https://wa.me/${cta.destination}`, '_blank');
    } else if (cta.type === 'url') {
      window.open(cta.destination, '_blank');
    } else if (cta.type === 'email') {
      window.location.href = `mailto:${cta.destination}`;
    } else if (cta.type === 'phone') {
      window.location.href = `tel:${cta.destination}`;
    } else if (cta.type === 'anchor') {
      scrollTo(cta.destination);
    }
  };

  const activeCTAs = ctas?.filter(c => c.active) || [];

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        scrolled ? "py-4" : "py-8"
      }`}
    >
      <div className="container px-4">
        <div 
          className={`mx-auto max-w-7xl flex items-center justify-between px-6 md:px-10 h-20 rounded-[2rem] transition-all duration-500 border ${
            scrolled 
              ? "bg-zinc-950/80 backdrop-blur-2xl border-white/10 shadow-2xl shadow-black/50" 
              : "bg-transparent border-transparent"
          }`}
        >
          {/* Logo Ticto Style */}
          <div 
            className="flex items-center gap-2 cursor-pointer group" 
            onClick={() => scrollTo("#")}
          >
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-2xl font-black tracking-tighter text-white">
              ELLITE<span className="text-primary">.</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-12">
            <div className="flex items-center gap-8">
              {links.map(l => (
                <button 
                  key={l.label} 
                  onClick={() => scrollTo(l.href)} 
                  className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 hover:text-primary transition-colors"
                >
                  {l.label}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-4">
              {activeCTAs.slice(0, 1).map((cta) => (
                <button
                  key={cta.id}
                  onClick={() => handleCTAClick(cta)}
                  className="px-8 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] bg-primary text-white hover:scale-105 hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] active:scale-95 transition-all flex items-center gap-2"
                >
                  {cta.label}
                  <ArrowRight className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Toggle */}
          <button 
            onClick={() => setOpen(!open)} 
            className="md:hidden w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden fixed inset-x-4 top-32 z-[101] bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl"
          >
            <div className="flex flex-col gap-8">
              {links.map(l => (
                <button 
                  key={l.label} 
                  onClick={() => scrollTo(l.href)} 
                  className="text-lg font-bold text-zinc-400 hover:text-primary transition-colors text-left"
                >
                  {l.label}
                </button>
              ))}
              
              <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
                {activeCTAs.map((cta) => (
                  <button
                    key={cta.id}
                    onClick={() => handleCTAClick(cta)}
                    className="w-full py-5 rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                    style={{ backgroundColor: cta.color, color: '#fff' }}
                  >
                    {cta.label}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
