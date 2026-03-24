import { useState } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { TrendingUp, Zap, Target, Sparkles, ArrowRight } from "lucide-react";

const ROICalculator = () => {
  const [days, setDays] = useState(10);

  const focusBoost = Math.min(95, 40 + days * 3.5);
  const authorityBoost = Math.min(98, 30 + days * 4);
  const savingsPerMonth = days * 85;

  return (
    <section className="py-32 relative overflow-hidden">
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
            Calculadora de Impacto
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-display text-4xl md:text-6xl font-black mb-8 tracking-tight"
          >
            Quanto o Ellite pode <span className="text-gradient-ticto">transformar seu negócio?</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-zinc-400 leading-relaxed"
          >
            Arraste o seletor abaixo e descubra o impacto real no seu desempenho profissional ao trocar o home office pelo nosso ecossistema.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
          className="max-w-6xl mx-auto bg-zinc-900/40 backdrop-blur-3xl border border-white/10 p-10 md:p-20 rounded-[4rem] relative overflow-hidden group"
        >
          {/* Decorative Sparkles Ticto Style */}
          <motion.div 
            animate={{ rotate: 360 }} 
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }} 
            className="absolute -top-10 -right-10 text-primary/10 group-hover:text-primary/20 transition-colors"
          >
            <Sparkles className="w-40 h-40" />
          </motion.div>

          <div className="relative z-10">
            <div className="mb-20">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-white uppercase tracking-widest">
                    Dias por mês no Ellite
                  </label>
                  <p className="text-xs text-zinc-500 font-medium">Ajuste para ver a projeção de crescimento</p>
                </div>
                <div className="flex items-baseline gap-2">
                  <motion.span
                    key={days}
                    initial={{ scale: 1.2, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-7xl font-black text-white tracking-tighter"
                  >
                    {days}
                  </motion.span>
                  <span className="text-xl font-bold text-zinc-500 uppercase tracking-widest">Dias</span>
                </div>
              </div>
              
              <div className="px-2">
                <Slider
                  value={[days]}
                  onValueChange={(v) => setDays(v[0])}
                  min={1}
                  max={25}
                  step={1}
                  className="relative flex items-center select-none touch-none w-full h-5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <MetricCard
                icon={Zap}
                label="Aumento de Foco"
                value={`${focusBoost.toFixed(0)}%`}
                desc="Produtividade sem distrações"
              />
              <MetricCard
                icon={Target}
                label="Autoridade"
                value={`${authorityBoost.toFixed(0)}%`}
                desc="Percepção de valor do cliente"
              />
              <MetricCard
                icon={TrendingUp}
                label="Economia Real"
                value={`R$ ${savingsPerMonth.toLocaleString("pt-BR")}`}
                desc="Vs. Escritório Próprio"
              />
            </div>

            <div className="mt-20 text-center">
              <button
                onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
                className="ticto-button group"
              >
                Começar minha transformação
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const MetricCard = ({ icon: Icon, label, value, desc }: { icon: any; label: string; value: string; desc: string }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true }}
    className="bg-zinc-950/50 border border-white/5 p-8 rounded-[2.5rem] text-center group hover:border-primary/30 transition-all duration-500"
  >
    <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
      <Icon className="w-6 h-6 text-zinc-500 group-hover:text-primary transition-colors" />
    </div>
    
    <motion.p
      key={value}
      initial={{ scale: 1.1, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-4xl font-black text-white mb-2 tracking-tight"
    >
      {value}
    </motion.p>
    
    <div className="space-y-1">
      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{label}</h4>
      <p className="text-[10px] text-zinc-500 font-medium">{desc}</p>
    </div>
  </motion.div>
);

export default ROICalculator;
