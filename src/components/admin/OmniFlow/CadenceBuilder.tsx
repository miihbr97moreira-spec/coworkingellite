import React, { useState } from "react";
import { Plus, Trash2, Clock, MessageCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import TooltipHelp from "@/components/ui/tooltip-help";

interface Message {
  delay_minutes: number;
  message_text: string;
}

interface CadenceBuilderProps {
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
}

const CadenceBuilder: React.FC<CadenceBuilderProps> = ({ messages, onMessagesChange }) => {
  const [newDelay, setNewDelay] = useState(0);
  const [newMessage, setNewMessage] = useState("");

  const addMessage = () => {
    if (!newMessage.trim()) return;
    onMessagesChange([
      ...messages,
      { delay_minutes: newDelay, message_text: newMessage },
    ]);
    setNewMessage("");
    setNewDelay(0);
  };

  const removeMessage = (index: number) => {
    onMessagesChange(messages.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 p-4 rounded-lg bg-secondary/30 border border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="w-5 h-5 text-[#D97757]" />
        <h3 className="font-semibold">Cadência de Mensagens (Sequência)</h3>
        <TooltipHelp content="Crie uma sequência de mensagens que serão enviadas automaticamente com intervalos de tempo. Por exemplo: enviar 1ª mensagem agora, 2ª após 1 hora, 3ª no dia seguinte." />
      </div>

      {messages.length > 0 && (
        <div className="space-y-2">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-3 rounded-lg bg-background/50 border border-[#D97757]/20 flex items-start justify-between gap-3"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-3 h-3 text-[#D97757]" />
                  <span className="text-xs font-semibold text-[#D97757]">
                    {msg.delay_minutes === 0 ? "Agora" : `+${msg.delay_minutes}min`}
                  </span>
                </div>
                <p className="text-sm text-foreground break-words">{msg.message_text}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => removeMessage(idx)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}

      <div className="space-y-3 pt-3 border-t border-border/50">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Delay (minutos)
            </label>
            <input
              type="number"
              min="0"
              value={newDelay}
              onChange={(e) => setNewDelay(Math.max(0, parseInt(e.target.value) || 0))}
              placeholder="0"
              className="w-full px-2 py-1.5 rounded text-sm bg-background border border-border"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Ação
            </label>
            <Button
              size="sm"
              onClick={addMessage}
              disabled={!newMessage.trim()}
              className="w-full gap-1 bg-[#D97757] hover:bg-[#D97757]/90"
            >
              <Plus className="w-3 h-3" />
              Adicionar
            </Button>
          </div>
        </div>

        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Escreva a mensagem da cadência..."
          className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm font-mono resize-none h-20"
        />
      </div>

      {messages.length === 0 && (
        <div className="text-center py-4 text-muted-foreground text-sm">
          <Info className="w-4 h-4 inline mr-1" />
          Nenhuma mensagem adicionada. Crie uma sequência acima.
        </div>
      )}
    </div>
  );
};

export default CadenceBuilder;
