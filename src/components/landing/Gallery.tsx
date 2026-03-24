import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn, Loader2, Camera, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Gallery = () => {
  const [selected, setSelected] = useState<number | null>(null);

  const { data: files, isLoading } = useQuery({
    queryKey: ["gallery-files"],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("gallery").list("", { 
        limit: 50, 
        sortBy: { column: "created_at", order: "desc" } 
      });
      if (error) throw error;
      return data?.filter((f) => f.name !== ".emptyFolderPlaceholder") ?? [];
    },
  });

  const galleryImages = useMemo(() => {
    if (!files || files.length === 0) return [];
    return files.map(f => {
      const { data } = supabase.storage.from("gallery").getPublicUrl(f.name);
      return {
        src: data.publicUrl,
        label: "Espaço Ellite Coworking"
      };
    });
  }, [files]);

  if (isLoading) {
    return (
      <section className="py-32 flex flex-col items-center justify-center min-h-[600px] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Carregando Galeria...</p>
      </section>
    );
  }

  if (galleryImages.length === 0) return null;

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
            Tour Visual
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-display text-4xl md:text-6xl font-black mb-8 tracking-tight"
          >
            Conheça o <span className="text-gradient-ticto">ecossistema Ellite</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-lg md:text-xl text-zinc-400 leading-relaxed"
          >
            Um ambiente projetado para performance, sofisticação e networking de alto nível. Cada detalhe foi pensado para o seu sucesso.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {galleryImages.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
              className="relative aspect-[4/5] rounded-[2.5rem] overflow-hidden group cursor-pointer border border-white/5 hover:border-primary/30 transition-all duration-700"
              onClick={() => setSelected(i)}
            >
              <img
                src={img.src}
                alt={`Ellite Coworking - ${img.label}`}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                loading="lazy"
              />
              
              {/* Overlay Ticto Style */}
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 flex items-center justify-center text-primary scale-50 group-hover:scale-100 transition-transform duration-500">
                  <ZoomIn className="w-8 h-8" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white translate-y-4 group-hover:translate-y-0 transition-transform duration-500">Ampliar Imagem</span>
              </div>

              {/* Bottom Label Ticto Style */}
              <div className="absolute bottom-0 left-0 right-0 p-8 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 w-fit">
                  <Camera className="w-3 h-3 text-primary" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">{img.label}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox Ticto Style */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-zinc-950/95 backdrop-blur-2xl p-6 md:p-20"
            onClick={() => setSelected(null)}
          >
            <motion.button
              className="absolute top-10 right-10 w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors z-[210]"
              whileHover={{ scale: 1.1, rotate: 90 }}
              onClick={() => setSelected(null)}
            >
              <X className="w-8 h-8" />
            </motion.button>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              className="relative max-w-7xl w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={galleryImages[selected].src}
                alt={galleryImages[selected].label}
                className="max-w-full max-h-full rounded-[3rem] object-contain shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/5"
              />
              
              <div className="absolute bottom-[-40px] left-1/2 -translate-x-1/2 flex items-center gap-4">
                <div className="px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">{galleryImages[selected].label}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Gallery;
