import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Users, Building2, Award, TrendingUp, Zap } from "lucide-react";

const stats = [
  { icon: Users, value: 200, suffix: "+", label: "Membros Ativos", desc: "Profissionais de elite" },
  { icon: Building2, value: 3, suffix: "", label: "Salas Premium", desc: "Ambientes exclusivos" },
  { icon: Award, value: 98, suffix: "%", label: "Satisfação", desc: "NPS de excelência" },
  { icon: TrendingUp, value: 150, suffix: "%", label: "Produtividade", desc: "Aumento comprovado" },
];

const AnimatedNumber = ({ value, suffix }: { value: number; suffix: string }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated.current) {
        hasAnimated.current = true;
        const duration = 2500;
        const start = Date.now();
        const tick = () => {
          const elapsed = Date.now() - start;
          const progress = Math.min(elapsed / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 4); // Quartic ease out
          setDisplay(Math.round(eased * value));
          if (progress < 1) requestAnimationFrame(tick);
        };
        tick();
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="text-5xl md:text-7xl font-black tracking-tighter text-white">
      {display}{suffix}
    </span>
  );
};

const StatsCounter = () => (
  <section className="py-32 relative overflow-hidden border-y border-white/5 bg-zinc-950/50">
    {/* Ticto Style Background Elements */}
    <div className="absolute inset-0 bg-[url('https://ticto.com.br/grid.svg')] bg-center opacity-10 pointer-events-none" />
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

    <div className="container px-4 relative z-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
        {stats.map((s, i) => (
          <motion.div 
            key={s.label} 
            initial={{ opacity: 0, y: 30 }} 
            whileInView={{ opacity: 1, y: 0 }} 
            viewport={{ once: true }} 
            transition={{ delay: i * 0.1, duration: 0.8, ease: [0.23, 1, 0.32, 1] }} 
            className="relative group"
          >
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
              <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mb-8 group-hover:border-primary/30 group-hover:bg-primary/10 transition-all duration-500">
                <s.icon className="w-6 h-6 text-zinc-500 group-hover:text-primary transition-colors" />
              </div>
              
              <div className="flex flex-col gap-2">
                <AnimatedNumber value={s.value} suffix={s.suffix} />
                <div className="space-y-1">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{s.label}</h4>
                  <p className="text-xs text-zinc-500 font-medium">{s.desc}</p>
                </div>
              </div>
            </div>

            {/* Vertical Divider Ticto Style */}
            {i < stats.length - 1 && (
              <div className="hidden lg:block absolute top-1/2 -right-6 -translate-y-1/2 w-px h-24 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Bottom CTA Ticto Style */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8 }}
        className="mt-24 flex flex-col items-center gap-6"
      >
        <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
          <Zap className="w-4 h-4 text-primary animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Resultados comprovados por quem entende de performance</span>
        </div>
      </motion.div>
    </div>
  </section>
);

export default StatsCounter;
