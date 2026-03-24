import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ScrollRevealTextProps {
  text: string;
  className?: string;
}

const ScrollRevealText = ({ text, className = "" }: ScrollRevealTextProps) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "end 0.3"],
  });

  const words = text.split(" ");

  return (
    <p ref={ref} className={`flex flex-wrap gap-x-2 gap-y-1 ${className}`}>
      {words.map((word, i) => {
        const start = i / words.length;
        const end = start + 1 / words.length;
        return <Word key={`${word}-${i}`} word={word} range={[start, end]} progress={scrollYProgress} />;
      })}
    </p>
  );
};

const Word = ({ word, range, progress }: { word: string; range: [number, number]; progress: any }) => {
  const opacity = useTransform(progress, range, [0.15, 1]);
  return (
    <motion.span style={{ opacity }} className="inline-block">
      {word}
    </motion.span>
  );
};

export default ScrollRevealText;
