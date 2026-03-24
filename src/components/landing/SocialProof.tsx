import { Star } from "lucide-react";
import { useReviews } from "@/hooks/useSupabaseQuery";

const TestimonialCard = ({ name, role, text, stars }: { name: string; role: string; text: string; stars: number }) => (
  <div className="glass flex-shrink-0 w-[340px] p-6 mx-3 relative overflow-hidden">
    {/* Animated gradient behind glass */}
    <div className="absolute inset-0 opacity-[0.04] bg-gradient-to-br from-primary via-transparent to-primary animate-pulse pointer-events-none" />
    <div className="relative z-10">
      <div className="flex gap-1 mb-3">
        {Array.from({ length: stars }).map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-primary text-primary" />
        ))}
      </div>
      <p className="text-sm text-foreground/80 mb-4 leading-relaxed">"{text}"</p>
      <div>
        <p className="font-semibold text-sm text-foreground">{name}</p>
        <p className="text-xs text-muted-foreground">{role}</p>
      </div>
    </div>
  </div>
);

const SocialProof = () => {
  const { data: reviews } = useReviews();

  const items = reviews ?? [];
  if (items.length === 0) return null;

  return (
    <section className="py-20 overflow-hidden">
      <div className="container px-4 mb-12 text-center">
        <h2 className="font-display text-3xl md:text-4xl font-bold text-gradient-silver mb-4">
          O que nossos membros dizem
        </h2>
        <p className="text-muted-foreground">+200 profissionais já transformaram seus resultados</p>
      </div>

      <div className="relative">
        <div className="flex animate-marquee">
          {[...items, ...items].map((t, i) => (
            <TestimonialCard key={`${t.id}-${i}`} name={t.name} role={t.role} text={t.text} stars={t.stars} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
