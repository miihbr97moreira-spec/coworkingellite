import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

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
    <section className="py-20 relative overflow-hidden border-y border-white/5 bg-zinc-950/30">
      <div className="container px-4 relative z-10">
        <div className="flex flex-col items-center gap-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10"
          >
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">
              Empresas que confiam no ecossistema Ellite
            </span>
          </motion.div>

          <div className="flex items-center justify-center gap-x-16 gap-y-10 flex-wrap max-w-5xl mx-auto">
            {logos.map((logo, i) => (
              <motion.div
                key={logo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                className="relative group"
              >
                <img
                  src={logo.image_url}
                  alt={logo.name}
                  className="h-8 md:h-10 object-contain grayscale opacity-30 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700"
                />
                {/* Subtle Glow on Hover */}
                <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LogoTrust;
