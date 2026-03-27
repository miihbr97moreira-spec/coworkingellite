import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

interface PremiumQuizOptionProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  style: "pills" | "cards" | "bento-grid" | "radio";
  theme: {
    buttonColor: string;
    buttonTextColor: string;
  };
  imageUrl?: string;
}

const PremiumQuizOption = ({
  label,
  isSelected,
  onClick,
  style,
  theme,
  imageUrl
}: PremiumQuizOptionProps) => {
  const baseClasses = "transition-all duration-300 cursor-pointer";

  if (style === "pills") {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`${baseClasses} px-6 py-3 rounded-full font-semibold border-2 text-sm flex items-center justify-center gap-2 ${
          isSelected
            ? "border-primary bg-primary/20 shadow-lg"
            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
        }`}
        style={{
          borderColor: isSelected ? theme.buttonColor : undefined,
          backgroundColor: isSelected ? `${theme.buttonColor}20` : undefined,
        }}
      >
        <span>{label}</span>
        {isSelected && <CheckCircle2 className="w-4 h-4" />}
      </motion.button>
    );
  }

  if (style === "cards") {
    return (
      <motion.button
        whileHover={{ scale: 1.02, y: -4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`${baseClasses} p-5 rounded-2xl border-2 text-left font-medium flex items-center justify-between backdrop-blur-sm ${
          isSelected
            ? "border-primary bg-primary/10 shadow-xl"
            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 hover:shadow-lg"
        }`}
        style={{
          borderColor: isSelected ? theme.buttonColor : undefined,
          backgroundColor: isSelected ? `${theme.buttonColor}15` : undefined,
        }}
      >
        <span className="text-lg">{label}</span>
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
            isSelected ? "bg-primary border-primary" : "border-white/20"
          }`}
          style={{
            backgroundColor: isSelected ? theme.buttonColor : "transparent",
            borderColor: isSelected ? theme.buttonColor : undefined,
          }}
        >
          {isSelected && <CheckCircle2 className="w-4 h-4 text-black" />}
        </div>
      </motion.button>
    );
  }

  if (style === "bento-grid" && imageUrl) {
    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onClick}
        className={`${baseClasses} group relative aspect-square rounded-3xl overflow-hidden border-4 transition-all ${
          isSelected ? "border-primary shadow-2xl" : "border-transparent hover:shadow-xl"
        }`}
        style={{
          borderColor: isSelected ? theme.buttonColor : undefined,
        }}
      >
        <img
          src={imageUrl}
          alt={label}
          className="w-full h-full object-cover transition-transform group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-4">
          <span className="font-bold text-sm text-white">{label}</span>
        </div>
        {isSelected && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: theme.buttonColor }}
            >
              <CheckCircle2 className="w-6 h-6 text-black" />
            </div>
          </div>
        )}
      </motion.button>
    );
  }

  // Default radio style
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${baseClasses} w-full p-4 rounded-lg border-2 text-left font-medium flex items-center gap-3 ${
        isSelected
          ? "border-primary bg-primary/10"
          : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
      }`}
      style={{
        borderColor: isSelected ? theme.buttonColor : undefined,
        backgroundColor: isSelected ? `${theme.buttonColor}15` : undefined,
      }}
    >
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
          isSelected ? "bg-primary border-primary" : "border-white/20"
        }`}
        style={{
          backgroundColor: isSelected ? theme.buttonColor : "transparent",
          borderColor: isSelected ? theme.buttonColor : undefined,
        }}
      >
        {isSelected && <div className="w-2 h-2 rounded-full bg-black" />}
      </div>
      <span>{label}</span>
    </motion.button>
  );
};

export default PremiumQuizOption;
