import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Users, Building2, Award, TrendingUp } from "lucide-react";

const stats = [
  { icon: Users, value: 200, suffix: "+", label: "Profissionais Atendidos" },
  { icon: Building2, value: 3, suffix: "", label: "Salas Premium" },
  { icon: Award, value: 98, suffix: "%", label: "Satisfação" },
  { icon: TrendingUp, value: 150, suffix: "%", label: "Aumento de Produtividade" },
];

const AnimatedNumber = ({ value, suffix }: { value: number; suffix: string }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const start = Date.now();
          const tick = () => {
            const elapsed = Date.now() - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(tick);
          };
          tick();
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value]);

  return (
    <span ref={ref} className="text-4xl md:text-5xl font-bold text-gradient-gold">
      {display}{suffix}
    </span>
  );
};

const StatsCounter = () => (
  <section className="py-16 relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5" />
    <div className="container px-4 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="text-center"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <s.icon className="w-6 h-6 text-primary" />
            </div>
            <AnimatedNumber value={s.value} suffix={s.suffix} />
            <p className="text-sm text-muted-foreground mt-2">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default StatsCounter;
