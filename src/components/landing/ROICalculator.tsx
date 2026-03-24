import { useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, Zap, Target } from "lucide-react";

const ROICalculator = () => {
  const [days, setDays] = useState(10);

  const focusBoost = Math.min(95, 40 + days * 3.5);
  const authorityBoost = Math.min(98, 30 + days * 4);
  const savingsPerMonth = days * 85;

  return (
    <section className="py-20 grid-bg-subtle">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-12">
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-widest uppercase rounded-full border border-primary/30 text-primary bg-primary/5"
            >
              Calculadora de Impacto
            </motion.span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-gradient-gold mb-4">
              Quanto o Ellite pode transformar seu negócio?
            </h2>
            <p className="text-muted-foreground">Arraste e descubra o impacto real no seu desempenho profissional</p>
          </div>

          <div className="glass-strong p-8 md:p-12">
            <div className="mb-10">
              <label className="text-sm font-medium text-foreground/80 mb-4 block">
                Quantos dias por mês você trabalha fora de casa?
              </label>
              <div className="flex items-center gap-6">
                <Slider
                  value={[days]}
                  onValueChange={(v) => setDays(v[0])}
                  min={1}
                  max={25}
                  step={1}
                  className="flex-1"
                />
                <motion.span
                  key={days}
                  initial={{ scale: 1.3, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-4xl font-bold text-gradient-gold min-w-[3ch] text-center"
                >
                  {days}
                </motion.span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">dias/mês</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <MetricCard
                icon={Zap}
                label="Aumento de Foco"
                value={`${focusBoost.toFixed(0)}%`}
                color="text-primary"
              />
              <MetricCard
                icon={Target}
                label="Percepção de Autoridade"
                value={`${authorityBoost.toFixed(0)}%`}
                color="text-primary"
              />
              <MetricCard
                icon={TrendingUp}
                label="Economia vs. Escritório Próprio"
                value={`R$ ${savingsPerMonth.toLocaleString("pt-BR")}`}
                color="text-primary"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const MetricCard = ({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    className="glass p-6 text-center"
  >
    <Icon className={`w-8 h-8 ${color} mx-auto mb-3`} />
    <motion.p
      key={value}
      initial={{ scale: 1.2, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-3xl font-bold text-gradient-gold mb-1"
    >
      {value}
    </motion.p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </motion.div>
);

export default ROICalculator;
