import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const LogoTrust = () => {
  const { data: logos } = useQuery({
    queryKey: ["logos"],
    queryFn: async () => {
      const { data } = await supabase.from("logos").select("*").eq("active", true).order("sort_order");
      return data ?? [];
    },
  });

  if (!logos?.length) return null;

  return (
    <section className="py-12 border-y border-border/30">
      <div className="container px-4">
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-8">
          Empresas que confiam no Ellite
        </p>
        <div className="flex items-center justify-center gap-10 flex-wrap opacity-60">
          {logos.map((logo, i) => (
            <motion.img
              key={logo.id}
              src={logo.image_url}
              alt={logo.name}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="h-8 md:h-10 object-contain grayscale hover:grayscale-0 transition-all"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default LogoTrust;
