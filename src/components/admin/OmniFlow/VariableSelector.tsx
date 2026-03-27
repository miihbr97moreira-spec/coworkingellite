import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VariableSelectorProps {
  selectedVariables: string[];
  onToggle: (variable: string) => void;
  onInsertIntoTextarea?: (variable: string) => void;
}

const AVAILABLE_VARIABLES = [
  { name: "{lead_name}", description: "Nome do Lead" },
  { name: "{lead_email}", description: "Email do Lead" },
  { name: "{lead_phone}", description: "Telefone do Lead" },
  { name: "{lead_source}", description: "Fonte do Lead" },
  { name: "{checkout_value}", description: "Valor do Checkout" },
  { name: "{checkout_items}", description: "Itens do Checkout" },
  { name: "{timestamp}", description: "Data/Hora do Evento" },
  { name: "{event_type}", description: "Tipo do Evento" },
];

const VariableSelector: React.FC<VariableSelectorProps> = ({
  selectedVariables,
  onToggle,
  onInsertIntoTextarea,
}) => {
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-semibold uppercase text-muted-foreground block mb-2">
          Variáveis Disponíveis
        </label>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_VARIABLES.map((variable) => (
            <button
              key={variable.name}
              onClick={() => {
                onToggle(variable.name);
                onInsertIntoTextarea?.(variable.name);
              }}
              title={variable.description}
              className={`px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all border ${
                selectedVariables.includes(variable.name)
                  ? "bg-[#D97757]/20 text-[#D97757] border-[#D97757]/50"
                  : "bg-secondary/50 text-muted-foreground border-border/50 hover:border-[#D97757]/50 hover:text-[#D97757]"
              }`}
            >
              {variable.name}
            </button>
          ))}
        </div>
      </div>

      {selectedVariables.length > 0 && (
        <div>
          <label className="text-xs font-semibold uppercase text-muted-foreground block mb-2">
            Selecionadas ({selectedVariables.length})
          </label>
          <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-secondary/30 border border-border/50">
            {selectedVariables.map((variable) => (
              <div
                key={variable}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-[#D97757]/20 text-[#D97757] border border-[#D97757]/50"
              >
                {variable}
                <button
                  onClick={() => onToggle(variable)}
                  className="hover:opacity-70 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VariableSelector;
