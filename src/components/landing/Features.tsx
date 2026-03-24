import { motion } from "framer-motion";
import { Wifi, Wind, Armchair, MapPin, Coffee, Building2, CheckCircle2, Zap } from "lucide-react";

const features = [
  { icon: Wifi, label: "Wi-Fi Ultra Rápido", desc: "Conexão de fibra óptica dedicada de alta performance para videoconferências sem interrupções.", badge: "Exclusivo" },
  { icon: Wind, label: "Ar Condicionado", desc: "Climatização inteligente em todos os ambientes para o seu máximo conforto térmico.", badge: "Premium" },
  { icon: Armchair, label: "Mobiliário Ergonômico", desc: "Cadeiras Herman Miller e mesas amplas projetadas para longas jornadas de alta produtividade.", badge: "Saúde" },
  { icon: MapPin, label: "Localização VIP", desc: "Estrategicamente posicionado a apenas 500m do metrô Moema, no coração de SP.", badge: "Acesso" },
  { icon: Coffee, label: "Café & Água Free", desc: "Café gourmet selecionado e água mineral à vontade para manter sua energia no topo.", badge: "Gourmet" },
  { icon: Building2, label: "Região Premium", desc: "Cercado pelos melhores restaurantes, bancos e serviços da zona sul de São Paulo.", badge: "Status" },
];

const Features = () => (
  <section className="py-32 relative overflow-hidden">
    {/* Ticto Style Background Orbs */}
    <div className="absolute top-1/2 left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
    <div className="absolute bottom-0 right-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

    <div className="container px-4 relative z-10">
      <div className="max-w-3xl mx-auto text-center mb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-[10px] font-black tracking-[0.3em] uppercase rounded-full border border-primary/20 bg-primary/5 text-primary"
        >
          <Zap className="w-3 h-3" />
          Funcionalidades de Elite
        </motion.div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="font-display text-4xl md:text-6xl font-black mb-8 tracking-tight"
        >
          Uma estrutura projetada para <span className="text-gradient-ticto">escalar seus resultados</span>
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-lg md:text-xl text-zinc-400 leading-relaxed"
        >
          Não somos apenas um espaço de trabalho. Somos a ferramenta que faltava para você performar no mais alto nível do mercado.
        </motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {features.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="ticto-card group"
          >
            {/* Card Badge */}
            <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-primary group-hover:border-primary/30 transition-colors">
              {f.badge}
            </div>

            {/* Icon Container */}
            <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-white/5 flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
              <f.icon className="w-8 h-8 text-zinc-400 group-hover:text-primary transition-colors" />
            </div>

            <h3 className="text-xl font-bold text-white mb-4 group-hover:text-primary transition-colors">{f.label}</h3>
            <p className="text-zinc-400 text-sm leading-relaxed mb-8">{f.desc}</p>
            
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600 group-hover:text-zinc-400 transition-colors">
              <CheckCircle2 className="w-3 h-3 text-primary" />
              Incluso no Plano
            </div>

            {/* Decorative Line Ticto Style */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          </motion.div>
        ))}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-24 text-center"
      >
        <button
          onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
          className="ticto-button"
        >
          Quero minha vaga agora
          <ArrowRight className="w-5 h-5 ml-2" />
        </button>
      </motion.div>
    </div>
  </section>
);

export default Features;
