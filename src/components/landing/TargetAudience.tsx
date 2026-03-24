import { motion } from "framer-motion";
import { Briefcase, Users, Award, Zap, ArrowRight, CheckCircle2 } from "lucide-react";

const targets = [
  {
    icon: Briefcase,
    title: "Profissionais Liberais",
    desc: "Advogados, médicos, arquitetos e engenheiros que precisam de um endereço à altura da sua expertise.",
    features: ["Endereço Fiscal", "Salas Privativas", "Atendimento VIP"]
  },
  {
    icon: Users,
    title: "Consultores & Especialistas",
    desc: "Consultores financeiros, coaches e mentores que valorizam networking estratégico e ambiente profissional.",
    features: ["Networking VIP", "Auditório", "Café Gourmet"]
  },
  {
    icon: Award,
    title: "Corretores & Executivos",
    desc: "Profissionais que fecham negócios presencialmente e precisam de salas de reunião premium para impressionar.",
    features: ["Salas de Reunião", "Acesso 24/7", "Localização Moema"]
  },
];

const TargetAudience = () => (
  <section className="py-32 relative overflow-hidden bg-zinc-950/50">
    {/* Ticto Style Background Orbs */}
    <div className="absolute top-1/2 left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
    <div className="absolute bottom-0 right-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

    <div className="container px-4 relative z-10">
      <div className="max-w-3xl mx-auto text-center mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-[10px] font-black tracking-[0.3em] uppercase rounded-full border border-primary/20 bg-primary/5 text-primary"
        >
          <Zap className="w-3 h-3" />
          Público Alvo
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="font-display text-4xl md:text-6xl font-black mb-8 tracking-tight"
        >
          Para quem é o <span className="text-gradient-ticto">ecossistema Ellite?</span>
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-lg md:text-xl text-zinc-400 leading-relaxed"
        >
          Se você busca foco, networking estratégico e autoridade para fechar negócios de alto valor, o Ellite é o seu lugar.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {targets.map((t, i) => (
          <motion.div
            key={t.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="ticto-card group flex flex-col"
          >
            {/* Icon Container Ticto Style */}
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-white/5 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
              <t.icon className="w-8 h-8 text-zinc-400 group-hover:text-primary transition-colors" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-primary transition-colors">{t.title}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8 flex-1">{t.desc}</p>
            
            <div className="space-y-3 mb-10">
              {t.features.map((f) => (
                <div key={f} className="flex items-center gap-3">
                  <CheckCircle2 className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-zinc-300 transition-colors">{f}</span>
                </div>
              ))}
            </div>

            <button className="w-full py-4 rounded-2xl bg-zinc-800 text-zinc-300 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-white transition-all duration-300">
              Saiba Mais
              <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </button>

            {/* Decorative Background Ticto Style */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rounded-tr-[2rem] pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default TargetAudience;
