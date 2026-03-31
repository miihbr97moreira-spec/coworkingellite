import React, { useState, useMemo } from "react";
import { 
  X, 
  Phone, 
  Mail, 
  MessageSquare, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  User,
  Building,
  DollarSign,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useLeads } from "@/hooks/useSupabaseQuery";

const ExecutionMode = ({ onClose }: { onClose: () => void }) => {
  const { data: leads, isLoading } = useLeads(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [script, setScript] = useState("Olá [NOME], vi que você se interessou por nosso serviço. Gostaria de saber mais sobre como podemos ajudar a [EMPRESA]?");

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    // Priorizar leads quentes e ativos
    return leads.filter(l => l.status !== 'won' && l.status !== 'lost')
      .sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0));
  }, [leads]);

  const currentLead = filteredLeads[currentIndex];

  const handleNext = () => {
    if (currentIndex < filteredLeads.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      toast.success("Você completou a lista de execução!");
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const personalizedScript = useMemo(() => {
    if (!currentLead) return script;
    return script
      .replace("[NOME]", currentLead.name || "Cliente")
      .replace("[EMPRESA]", currentLead.company || "sua empresa");
  }, [currentLead, script]);

  if (isLoading) return <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">Carregando...</div>;
  if (!currentLead) return <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">Nenhum lead para processar.</div>;

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-xl z-50 flex flex-col p-6 animate-in fade-in zoom-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tighter uppercase italic">Modo Execução <span className="text-primary">Ativo</span></h2>
            <p className="text-sm text-muted-foreground">Foco total em vendas • Lead {currentIndex + 1} de {filteredLeads.length}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-destructive/20 hover:text-destructive transition-colors">
          <X className="w-6 h-6" />
        </Button>
      </div>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden">
        
        {/* Coluna 1: Dados do Lead */}
        <div className="space-y-6">
          <Card className="bg-secondary/10 border-border/20 shadow-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-primary" /> Perfil do Lead
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-xl bg-background/50 border border-border/10">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Nome</p>
                <p className="text-xl font-bold">{currentLead.name}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-background/50 border border-border/10">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Empresa</p>
                  <p className="font-semibold truncate flex items-center gap-2"><Building className="w-3.5 h-3.5" /> {currentLead.company || "—"}</p>
                </div>
                <div className="p-4 rounded-xl bg-background/50 border border-border/10">
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Valor Deal</p>
                  <p className="font-semibold text-emerald-500 flex items-center gap-2"><DollarSign className="w-3.5 h-3.5" /> {Number(currentLead.deal_value || 0).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-background/50 border border-border/10">
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-1">Contatos</p>
                <div className="space-y-2 mt-2">
                  <p className="text-sm flex items-center gap-2"><Mail className="w-4 h-4 text-primary" /> {currentLead.email || "Sem e-mail"}</p>
                  <p className="text-sm flex items-center gap-2"><Phone className="w-4 h-4 text-primary" /> {currentLead.phone || "Sem telefone"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <Button variant="outline" size="lg" className="flex-1 rounded-2xl h-16 text-lg font-bold" onClick={handlePrev} disabled={currentIndex === 0}>
              <ChevronLeft className="w-6 h-6 mr-2" /> Anterior
            </Button>
            <Button size="lg" className="flex-1 rounded-2xl h-16 text-lg font-bold bg-primary hover:bg-primary/90" onClick={handleNext}>
              Próximo <ChevronRight className="w-6 h-6 ml-2" />
            </Button>
          </div>
        </div>

        {/* Coluna 2: Script de Vendas */}
        <div className="lg:col-span-2 flex flex-col space-y-6">
          <Card className="flex-1 bg-secondary/10 border-border/20 shadow-2xl flex flex-col overflow-hidden">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="w-5 h-5 text-primary" /> Script de Abordagem
                </CardTitle>
                <CardDescription>Personalizado automaticamente para este lead</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => toast.info("Script salvo como padrão")}>Salvar Alterações</Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <div className="p-6 flex-1">
                <Textarea 
                  value={personalizedScript}
                  onChange={(e) => setScript(e.target.value)}
                  className="w-full h-full min-h-[200px] text-xl font-medium bg-background/50 border-border/10 focus:ring-primary p-6 rounded-2xl resize-none leading-relaxed"
                  placeholder="Escreva seu script aqui..."
                />
              </div>
              
              <div className="p-6 bg-background/50 border-t border-border/10 flex flex-wrap gap-4">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 h-16 px-8 rounded-2xl text-lg font-bold flex-1 min-w-[200px]">
                  <MessageSquare className="w-6 h-6 mr-3" /> Abrir WhatsApp
                </Button>
                <Button size="lg" variant="outline" className="h-16 px-8 rounded-2xl text-lg font-bold flex-1 min-w-[200px]">
                  <Phone className="w-6 h-6 mr-3" /> Ligar Agora
                </Button>
                <Button size="lg" variant="outline" className="h-16 px-8 rounded-2xl text-lg font-bold flex-1 min-w-[200px]">
                  <Mail className="w-6 h-6 mr-3" /> Enviar E-mail
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Button size="lg" variant="secondary" className="h-16 rounded-2xl text-lg font-bold" onClick={() => toast.success("Atividade registrada")}>
              <CheckCircle2 className="w-6 h-6 mr-3 text-emerald-500" /> Marcar Atividade
            </Button>
            <Button size="lg" variant="secondary" className="h-16 rounded-2xl text-lg font-bold" onClick={() => toast.warning("Lembrete agendado")}>
              <Clock className="w-6 h-6 mr-3 text-orange-500" /> Agendar Retorno
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ExecutionMode;
