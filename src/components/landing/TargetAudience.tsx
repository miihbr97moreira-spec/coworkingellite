import { motion } from "framer-motion";
import { Briefcase, Users, Award } from "lucide-react";

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
        {targets.map((t, i) => (
          <motion.div
            key={t.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.15 }}
            className="glass p-8 text-center group hover:border-primary/40 transition-colors"
          >
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5 group-hover:bg-primary/20 transition-colors">
              <t.icon className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-display text-xl font-bold mb-3">{t.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{t.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TargetAudience;
