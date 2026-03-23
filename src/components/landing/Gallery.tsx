import { motion } from "framer-motion";
import { useSiteContent } from "@/context/SiteContext";

const Gallery = () => {
  const { content } = useSiteContent();

  return (
    <section className="py-20">
      <div className="container px-4">
        <div className="text-center mb-14">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-gradient-silver mb-4">
            Conheça o Espaço
          </h2>
          <p className="text-muted-foreground">Um ambiente projetado para performance e sofisticação</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {content.galleryImages.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative overflow-hidden rounded-xl aspect-[4/3] group cursor-pointer"
            >
              <img
                src={src}
                alt={`Ellite Coworking - Espaço ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
