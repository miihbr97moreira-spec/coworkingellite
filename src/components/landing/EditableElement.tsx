import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Edit2, X, Check } from "lucide-react";

interface EditableElementProps {
  id: string;
  type: "text" | "color" | "number";
  value: string | number;
  onEdit: (id: string, value: any) => void;
  children: ReactNode;
  className?: string;
  isEditing?: boolean;
}

export const EditableElement = ({
  id,
  type,
  value,
  onEdit,
  children,
  className = "",
  isEditing = false,
}: EditableElementProps) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editValue, setEditValue] = useState(String(value));

  const handleSave = () => {
    if (type === "number") {
      onEdit(id, Number(editValue));
    } else {
      onEdit(id, editValue);
    }
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setEditValue(String(value));
    setIsEditMode(false);
  };

  if (!isEditing) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`relative group ${className}`}
    >
      <AnimatePresence>
        {isHovering && !isEditMode && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsEditMode(true)}
            className="absolute top-0 right-0 p-1 bg-primary text-primary-foreground rounded-lg shadow-lg z-50 hover:bg-primary/90"
          >
            <Edit2 className="w-3 h-3" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute top-0 left-0 right-0 z-50 bg-background border-2 border-primary rounded-lg p-2 shadow-2xl"
          >
            {type === "color" ? (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <div className="flex gap-1">
                  <button
                    onClick={handleSave}
                    className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type={type === "number" ? "number" : "text"}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSave()}
                  autoFocus
                  className="flex-1 px-2 py-1 bg-secondary border border-border rounded text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                />
                <button
                  onClick={handleSave}
                  className="p-1 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className={isEditMode ? "opacity-50" : ""}>{children}</div>
    </motion.div>
  );
};

export default EditableElement;
