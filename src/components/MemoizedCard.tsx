import { memo } from "react";
import { motion } from "framer-motion";

interface MemoizedCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: "primary" | "green" | "blue" | "amber" | "purple";
  onClick?: () => void;
  className?: string;
}

const colorMap = {
  primary: "text-primary/50",
  green: "text-green-500/50",
  blue: "text-blue-500/50",
  amber: "text-amber-500/50",
  purple: "text-purple-500/50",
};

const MemoizedCard = memo(({
  title,
  value,
  icon,
  color = "primary",
  onClick,
  className = "",
}: MemoizedCardProps) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`bg-secondary/30 border border-border rounded-xl p-4 md:p-6 cursor-pointer transition-all hover:border-primary/50 ${className}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-xs md:text-sm text-muted-foreground truncate">{title}</p>
        <p className="text-2xl md:text-3xl font-bold mt-2">{value}</p>
      </div>
      {icon && (
        <div className={`w-6 h-6 md:w-8 md:h-8 ${colorMap[color]} flex-shrink-0`}>
          {icon}
        </div>
      )}
    </div>
  </motion.div>
));

MemoizedCard.displayName = "MemoizedCard";

export default MemoizedCard;
