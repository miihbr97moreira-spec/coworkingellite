import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Paperclip,
  Mic,
  StopCircle,
  Loader2,
  AlertCircle,
  Download,
  Play,
  Pause,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Message } from "./useInbox";

interface ChatAreaProps {
  messages: Message[];
  selectedClientId: string | null;
  whatsAppActive: boolean;
  sending: boolean;
  onSendMessage: (content: string, mediaUrl?: string, mediaType?: string) => Promise<void>;
  onFetchMoreMessages: () => Promise<void>;
  hasMoreMessages: boolean;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  selectedClientId,
  whatsAppActive,
  sending,
  onSendMessage,
  onFetchMoreMessages,
  hasMoreMessages,
}) => {
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll para o final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedClientId) return;

    const content = inputValue.trim();
    setInputValue("");

    await onSendMessage(content);
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });

        // Simular upload de áudio
        if (audioBlob.size > 500) {
          toast.success("✓ Áudio gravado com sucesso");
          // await onSendMessage("", audioUrl, "audio");
        } else {
          toast.error("Áudio muito curto");
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      toast.error("Erro ao acessar microfone");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!selectedClientId) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/30">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-semibold mb-2">Selecione uma conversa</p>
          <p className="text-sm">Escolha um contato na lista para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Alerta WhatsApp inativo */}
      {!whatsAppActive && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 p-3 flex items-center gap-2 text-amber-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">WhatsApp não está ativo. Configure em Integrações.</p>
        </div>
      )}

      {/* Área de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {hasMoreMessages && (
          <Button
            variant="outline"
            size="sm"
            onClick={onFetchMoreMessages}
            className="w-full"
          >
            Carregar mensagens anteriores
          </Button>
        )}

        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Nenhuma mensagem nesta conversa</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.02 }}
              className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.direction === "outbound"
                    ? "bg-[#D97757] text-white"
                    : "bg-muted text-foreground"
                }`}
              >
                {msg.media_url && msg.media_type?.startsWith("audio") && (
                  <div className="mb-2 flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-6 w-6">
                      <Play className="w-3 h-3" />
                    </Button>
                    <span className="text-xs">Áudio</span>
                  </div>
                )}

                {msg.media_url && msg.media_type?.startsWith("image") && (
                  <img
                    src={msg.media_url}
                    alt="Imagem"
                    className="rounded mb-2 max-w-xs"
                  />
                )}

                <p className="text-sm break-words">{msg.content}</p>

                <p className="text-xs opacity-70 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </motion.div>
          ))
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Área de Entrada */}
      <div className="border-t border-border/50 p-3 space-y-2 bg-muted/20">
        {isRecording && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm text-red-700">Gravando... {formatTime(recordingTime)}</span>
            </div>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleStopRecording}
              className="gap-2"
            >
              <StopCircle className="w-3 h-3" />
              Parar
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Digite uma mensagem..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={sending || isRecording}
            className="flex-1"
          />

          <Button
            size="icon"
            variant="outline"
            disabled={sending || isRecording}
          >
            <Paperclip className="w-4 h-4" />
          </Button>

          <Button
            size="icon"
            variant={isRecording ? "destructive" : "outline"}
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={sending}
          >
            {isRecording ? (
              <StopCircle className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>

          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={sending || !inputValue.trim()}
            className="bg-[#D97757] hover:bg-[#D97757]/90"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
