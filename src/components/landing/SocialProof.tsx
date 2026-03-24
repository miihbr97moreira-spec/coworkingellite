import { motion } from "framer-motion";
import { Star, Quote, CheckCircle2, Zap } from "lucide-react";
import { useReviews } from "@/hooks/useSupabaseQuery";

const TestimonialCard = ({ name, role, text, stars }: { name: string; role: string; text: string; stars: number }) => {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  
  return (
    <div className="ticto-card flex-shrink-0 w-[380px] mx-4 group">
      <div className="flex items-center justify-between mb-8">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              className={`w-4 h-4 ${i < stars ? 'fill-primary text-primary' : 'fill-zinc-800 text-zinc-800'}`} 
            />
          ))}
        </div>
        <Quote className="w-8 h-8 text-zinc-800 group-hover:text-primary/20 transition-colors" />
      </div>

      <p className="text-zinc-300 text-lg font-medium leading-relaxed mb-10 italic">
        "{text}"
      </p>

      <div className="flex items-center gap-4 pt-8 border-t border-white/5">
        <div className="w-14 h-14 rounded-2xl bg-zinc-800 border border-white/5 flex items-center justify-center text-zinc-400 font-black text-lg group-hover:border-primary/30 group-hover:text-primary transition-all">
          {initials}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-white text-base">{name}</p>
            <CheckCircle2 className="w-3 h-3 text-primary" />
          </div>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mt-1">{role}</p>
        </div>
      </div>

      {/* Decorative Gradient Ticto Style */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-tr-[2rem] pointer-events-none" />
    </div>
  );
};

const SocialProof = () => {
  const { data: reviews } = useReviews();

  const items = reviews ?? [];
  if (items.length === 0) return null;

  return (
    <section className="py-32 relative overflow-hidden">
      {/* Ticto Style Background Orbs */}
      <div className="absolute top-1/2 right-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[40%] h-[40%] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container px-4 relative z-10 mb-24">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 mb-6 text-[10px] font-black tracking-[0.3em] uppercase rounded-full border border-primary/20 bg-primary/5 text-primary"
          >
            <Zap className="w-3 h-3" />
            Prova Social de Elite
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-display text-4xl md:text-6xl font-black mb-8 tracking-tight"
          >
            O que nossos <span className="text-gradient-ticto">membros dizem</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-zinc-400 leading-relaxed"
          >
            Junte-se a centenas de profissionais que já transformaram seu networking e produtividade em nosso ecossistema premium.
          </motion.p>
        </div>
      </div>

      {/* Marquee Ticto Style */}
      <div className="relative flex overflow-hidden py-10">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...items, ...items, ...items].map((t, i) => (
            <TestimonialCard key={`${t.id}-${i}`} name={t.name} role={t.role} text={t.text} stars={t.stars} />
          ))}
        </div>
        
        {/* Gradient Fades on Sides */}
        <div className="absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-background to-transparent z-20 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-background to-transparent z-20 pointer-events-none" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mt-24 text-center"
      >
        <div className="inline-flex items-center gap-6 px-8 py-4 rounded-3xl bg-zinc-900/40 border border-white/5 backdrop-blur-md">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500">
                {i}
              </div>
            ))}
          </div>
          <p className="text-sm font-bold text-zinc-300">
            <span className="text-primary">+200</span> profissionais ativos em Moema
          </p>
        </div>
      </motion.div>
    </section>
  );
};

export default SocialProof;
