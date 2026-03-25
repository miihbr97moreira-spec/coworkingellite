import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Users, Award } from "lucide-react";
import SpotlightCard from "./SpotlightCard";

const targets = [
  {
    icon: Briefcase,
    title: "Profissionais Liberais",
    desc: "Advogados, médicos, arquitetos e engenheiros que precisam de um endereço à altura da sua expertise.",
  },
  {
    icon: Users,
    title: "Consultores & Especialistas",
    desc: "Consultores financeiros, coaches e mentores que valorizam networking estratégico e ambiente profissional.",
  },
  {
    icon: Award,
    title: "Corretores & Executivos",
    desc: "Profissionais que fecham negócios presencialmente e precisam de salas de reunião premium para impressionar.",
  },
];

const Tilt3DCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    setRotateY((x - midX) / midX * 8);
    setRotateX(-((y - midY) / midY) * 8);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX, rotateY }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
      style={{ perspective: 1000, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const TargetAudience = () => (
  <section className="py-20 grid-bg-subtle">
    <div className="container px-4">
      <div className="text-center mb-14">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-gradient-gold mb-4">
          Para quem é o Ellite?
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Se você precisa de foco, networking e autoridade para fechar negócios de alto valor, o Ellite é seu lugar.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {targets.map((t) => (
          <Tilt3DCard key={t.title}>
            <SpotlightCard
              className="glass p-8 text-center group hover:border-primary/40 transition-colors h-full"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
                <t.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">{t.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
            </SpotlightCard>
          </Tilt3DCard>
        ))}
      </div>
    </div>
  </section>
);

export default TargetAudience;