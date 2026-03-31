import React, { useMemo } from "react";
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Zap, 
  ChevronRight, 
  Phone, 
  Mail, 
  MessageSquare,
  Calendar
} from "lucide-react";
import { format, isToday, isPast, subDays, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLeads, useStages } from "@/hooks/useSupabaseQuery";

const DailyActions = ({ onSelectLead }: { onSelectLead: (lead: any) => void }) => {
  const { data: leads, isLoading } = useLeads(null);
  const { data: stages } = useStages(null);

  const actions = useMemo(() => {
    if (!leads) return { today: [], forgotten: [], hot: [], closing: [] };

    const now = new Date();
    
    // 1. Leads que precisam de contato hoje (baseado em last_activity_at ou logicamente novos)
    const today = leads.filter(l => {
      const lastAct = l.last_activity_at ? new Date(l.last_activity_at) : new Date(l.created_at);
      return isToday(lastAct) || differenceInDays(now, lastAct) === 1;
    }).slice(0, 5);

    // 2. Leads esquecidos (sem atividade há mais de 3 dias)
    const forgotten = leads.filter(l => {
      const lastAct = l.last_activity_at ? new Date(l.last_activity_at) : new Date(l.created_at);
      return differenceInDays(now, lastAct) >= 3 && l.status !== 'won' && l.status !== 'lost';
    }).slice(0, 5);

    // 3. Oportunidades quentes (score alto)
    const hot = leads.filter(l => (l.lead_score || 0) >= 80).slice(0, 5);

    // 4. Negócios próximos de fechar (etapas finais do pipeline)
    // Assumindo que as últimas etapas são de fechamento
    const closingStages = stages?.slice(-2).map(s => s.id) || [];
    const closing = leads.filter(l => closingStages.includes(l.stage_id)).slice(0, 5);

    return { today, forgotten, hot, closing };
  }, [leads, stages]);

  if (isLoading) return <div className="p-8 text-center"><Zap className="w-8 h-8 animate-spin mx-auto text-primary mb-2" /> Carregando ações...</div>;

  const ActionItem = ({ lead, type, icon: Icon, color }: { lead: any, type: string, icon: any, color: string }) => (
    <div className="flex items-center justify-between p-3 mb-2 rounded-xl border border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-all group">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold truncate">{lead.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {type} • R$ {Number(lead.deal_value || 0).toLocaleString('pt-BR')}
          </p>
        </div>
      </div>
      <Button size="sm" variant="ghost" className="shrink-0 group-hover:bg-primary group-hover:text-white transition-all rounded-full" onClick={() => onSelectLead(lead)}>
        Executar <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
      {/* Coluna 1: Contatos de Hoje */}
      <Card className="bg-background/50 border-border/30 shadow-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" /> Contatos Hoje
            </CardTitle>
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-none">{actions.today.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-2">
          <ScrollArea className="h-[300px] px-2">
            {actions.today.length > 0 ? (
              actions.today.map(l => <ActionItem key={l.id} lead={l} type="Follow-up" icon={Phone} color="bg-blue-500" />)
            ) : (
              <p className="text-xs text-center text-muted-foreground py-10 italic">Nenhuma ação para hoje.</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Coluna 2: Leads Esquecidos */}
      <Card className="bg-background/50 border-border/30 shadow-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" /> Esquecidos
            </CardTitle>
            <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-none">{actions.forgotten.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-2">
          <ScrollArea className="h-[300px] px-2">
            {actions.forgotten.length > 0 ? (
              actions.forgotten.map(l => <ActionItem key={l.id} lead={l} type="Reativar" icon={AlertCircle} color="bg-orange-500" />)
            ) : (
              <p className="text-xs text-center text-muted-foreground py-10 italic">Tudo em dia!</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Coluna 3: Oportunidades Quentes */}
      <Card className="bg-background/50 border-border/30 shadow-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-red-500" /> Leads Quentes
            </CardTitle>
            <Badge variant="secondary" className="bg-red-500/10 text-red-500 border-none">{actions.hot.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-2">
          <ScrollArea className="h-[300px] px-2">
            {actions.hot.length > 0 ? (
              actions.hot.map(l => <ActionItem key={l.id} lead={l} type="Prioridade" icon={TrendingUp} color="bg-red-500" />)
            ) : (
              <p className="text-xs text-center text-muted-foreground py-10 italic">Sem leads quentes no momento.</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Coluna 4: Próximos de Fechar */}
      <Card className="bg-background/50 border-border/30 shadow-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Fechamento
            </CardTitle>
            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none">{actions.closing.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-4 p-2">
          <ScrollArea className="h-[300px] px-2">
            {actions.closing.length > 0 ? (
              actions.closing.map(l => <ActionItem key={l.id} lead={l} type="Fechar Negócio" icon={CheckCircle2} color="bg-emerald-500" />)
            ) : (
              <p className="text-xs text-center text-muted-foreground py-10 italic">Continue prospectando!</p>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyActions;
