import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, MessageCircle, ExternalLink, Mail, Phone, Anchor } from "lucide-react";
import { useCTAs, trackEvent } from "@/hooks/useSupabaseQuery";

const links = [
  { label: "Início", href: "#" },
  { label: "Espaço", href: "#espaco" },
  { label: "Planos", href: "#planos" },
  { label: "Contato", href: "#contato" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { data: ctas } = useCTAs();

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
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container px-4 flex items-center justify-between h-16">
        <span className="font-display text-xl font-bold text-gradient-gold cursor-pointer" onClick={() => scrollTo("#")}>ELLITE</span>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          <div className="flex items-center gap-6">
            {links.map(l => (
              <button key={l.label} onClick={() => scrollTo(l.href)} className="text-sm text-foreground/70 hover:text-primary transition-colors font-medium">
                {l.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-3">
            {activeCTAs.slice(0, 2).map((cta) => (
              <button
                key={cta.id}
                onClick={() => handleCTAClick(cta)}
                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/10"
                style={{ backgroundColor: cta.color, color: '#fff' }}
              >
                {cta.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden text-foreground p-2">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-strong border-t border-border overflow-hidden"
          >
            <div className="px-4 py-6 space-y-4">
              <div className="space-y-2">
                {links.map(l => (
                  <button key={l.label} onClick={() => scrollTo(l.href)} className="block w-full text-left text-sm text-foreground/70 hover:text-primary transition-colors py-3 font-medium border-b border-border/20">
                    {l.label}
                  </button>
                ))}
              </div>
              
              <div className="grid grid-cols-1 gap-3 pt-2">
                {activeCTAs.map((cta) => (
                  <button
                    key={cta.id}
                    onClick={() => handleCTAClick(cta)}
                    className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2"
                    style={{ backgroundColor: cta.color, color: '#fff' }}
                  >
                    {cta.label}
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
