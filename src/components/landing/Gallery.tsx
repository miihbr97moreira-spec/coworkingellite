import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ZoomIn } from "lucide-react";

import img01 from "@/assets/gallery/01_cw.jpeg";
import img02 from "@/assets/gallery/02_cw.jpeg";
import img03 from "@/assets/gallery/03_cw.jpeg";
import img04 from "@/assets/gallery/04_cw.jpeg";
import img05 from "@/assets/gallery/05_cw.jpeg";
import img06 from "@/assets/gallery/06_cw.jpeg";

const galleryImages = [
  { src: img01, label: "Estações de Trabalho" },
  { src: img02, label: "Ambiente Ellite Flats" },
  { src: img03, label: "Sala Compartilhada" },
  { src: img04, label: "Área de Descompressão" },
  { src: img05, label: "Sala Premium" },
  { src: img06, label: "Escritório Privativo" },
];

const Gallery = () => {
  const [selected, setSelected] = useState<number | null>(null);

  return (
    <section className="py-20">
      <div className="container px-4">
        <div className="text-center mb-14">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block px-4 py-1.5 mb-4 text-xs font-semibold tracking-widest uppercase rounded-full border border-primary/30 text-primary bg-primary/5"
          >
            Tour Virtual
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-display text-3xl md:text-4xl font-bold text-gradient-silver mb-4"
          >
            Conheça o Espaço
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground"
          >
            Um ambiente projetado para performance e sofisticação
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {galleryImages.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
              whileHover={{ y: -6 }}
              className="relative overflow-hidden rounded-xl aspect-[4/3] group cursor-pointer"
              onClick={() => setSelected(i)}
            >
              <img
                src={img.src}
                alt={`Ellite Coworking - ${img.label}`}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-end pb-4">
                <ZoomIn className="w-6 h-6 text-primary mb-2" />
                <span className="text-sm font-semibold text-foreground">{img.label}</span>
              </div>
              {/* Gold corner accent */}
              <div className="absolute top-0 right-0 w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-primary/40 to-transparent" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl p-4"
            onClick={() => setSelected(null)}
          >
            <motion.button
              className="absolute top-6 right-6 text-foreground/70 hover:text-foreground z-50"
              whileHover={{ scale: 1.1, rotate: 90 }}
              onClick={() => setSelected(null)}
            >
              <X className="w-8 h-8" />
            </motion.button>
            <motion.img
              key={selected}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 200, damping: 25 }}
              src={galleryImages[selected].src}
              alt={galleryImages[selected].label}
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-8 text-center font-display text-lg font-semibold text-gradient-gold"
            >
              {galleryImages[selected].label}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Gallery;
