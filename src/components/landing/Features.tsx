import { motion } from "framer-motion";
import { Wifi, Wind, Armchair, MapPin, Coffee, Building2 } from "lucide-react";

const features = [
  { icon: Wifi, label: "Wi-Fi Ultra Rápido", desc: "Conexão de fibra óptica dedicada" },
  { icon: Wind, label: "Ar Condicionado", desc: "Climatização em todos os ambientes" },
  { icon: Armchair, label: "Ambiente Aconchegante", desc: "Mobiliário ergonômico premium" },
  { icon: MapPin, label: "Localização VIP", desc: "500m do metrô Moema" },
  { icon: Coffee, label: "Café & Água Free", desc: "Café gourmet e água filtrada" },
  { icon: Building2, label: "Região Premium", desc: "Acesso aos melhores lugares da região" },
];

const Features = () => (
  <section className="py-20 grid-bg-subtle">
    <div className="container px-4">
      <div className="text-center mb-14">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-gradient-gold mb-4">
          Estrutura & Diferenciais
        </h2>
        <p className="text-muted-foreground">Tudo que você precisa para performar no mais alto nível</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
        {features.map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 flex flex-col items-center text-center group hover:border-primary/30 transition-colors"
          >
            <f.icon className="w-8 h-8 text-primary mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-semibold text-sm mb-1">{f.label}</h3>
            <p className="text-xs text-muted-foreground">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default Features;
