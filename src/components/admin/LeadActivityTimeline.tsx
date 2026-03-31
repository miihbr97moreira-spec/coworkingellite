import React from "react";
import { 
  Phone, 
  Mail, 
  MessageSquare, 
  ArrowRight, 
  FileText, 
  CheckCircle2, 
  Clock, 
  User,
  Zap,
  MoreVertical,
  ChevronRight,
  ArrowUpRight,
  Plus
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const LeadActivityTimeline = ({ leadId }: { leadId: string }) => {
  // Mock de atividades (em um sistema real viria da tabela 'activities')
  const activities = [
    { id: "1", type: "call", title: "Chamada Realizada", description: "Conversa sobre orçamento para 20 pessoas.", performedBy: "Gabriel Oliveira", createdAt: new Date(), metadata: { duration: "5m 20s" } },
    { id: "2", type: "stage_change", title: "Mudança de Estágio", description: "Movido de 'Qualificação' para 'Proposta'.", performedBy: "Sistema", createdAt: subHours(new Date(), 2), metadata: { from: "Qualificação", to: "Proposta" } },
    { id: "3", type: "message", title: "WhatsApp Enviado", description: "Enviado script de apresentação do coworking.", performedBy: "Ana Beatriz", createdAt: subDays(new Date(), 1), metadata: { status: "delivered" } },
    { id: "4", type: "note", title: "Nota Adicionada", description: "Cliente demonstrou interesse em plano anual com desconto de 10%.", performedBy: "Gabriel Oliveira", createdAt: subDays(new Date(), 2), metadata: {} },
    { id: "5", type: "task_completed", title: "Tarefa Concluída", description: "Enviar proposta comercial via e-mail.", performedBy: "Gabriel Oliveira", createdAt: subDays(new Date(), 3), metadata: {} }
  ];

  function subHours(date: Date, hours: number) {
    const result = new Date(date);
    result.setHours(result.getHours() - hours);
    return result;
  }

  function subDays(date: Date, days: number) {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'call': return { icon: Phone, color: 'bg-blue-500/20 text-blue-500' };
      case 'message': return { icon: MessageSquare, color: 'bg-emerald-500/20 text-emerald-500' };
      case 'email': return { icon: Mail, color: 'bg-orange-500/20 text-orange-500' };
      case 'stage_change': return { icon: ArrowRight, color: 'bg-primary/20 text-primary' };
      case 'note': return { icon: FileText, color: 'bg-slate-500/20 text-slate-500' };
      case 'task_completed': return { icon: CheckCircle2, color: 'bg-emerald-500/20 text-emerald-500' };
      default: return { icon: Clock, color: 'bg-slate-500/20 text-slate-500' };
    }
  };

  return (
    <Card className="bg-background/50 border-border/30 shadow-xl overflow-hidden h-full flex flex-col">
      <CardHeader className="border-b border-border/5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-black uppercase tracking-tight italic">Timeline de <span className="text-primary">Atividades</span></CardTitle>
              <CardDescription>Histórico completo de interações com o lead</CardDescription>
            </div>
          </div>
          <Button size="sm" className="rounded-xl bg-primary hover:bg-primary/90 font-bold text-xs uppercase tracking-widest">
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Atividade
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-full p-6">
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary/20 before:via-border/10 before:to-transparent">
            {activities.map((activity, i) => {
              const { icon: Icon, color } = getIcon(activity.type);
              return (
                <div key={activity.id} className="relative flex gap-6 group">
                  <div className={`relative z-10 w-10 h-10 rounded-full ${color} flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black tracking-tight uppercase">{activity.title}</p>
                        <Badge variant="ghost" className="text-[10px] font-bold text-muted-foreground uppercase px-0">{activity.performedBy}</Badge>
                      </div>
                      <time className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {format(activity.createdAt, "dd MMM, HH:mm", { locale: ptBR })}
                      </time>
                    </div>
                    
                    <div className="p-4 rounded-2xl bg-secondary/5 border border-border/5 hover:bg-secondary/10 transition-all">
                      <p className="text-sm font-medium leading-relaxed text-muted-foreground">{activity.description}</p>
                      
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <Badge key={key} variant="secondary" className="bg-background/50 text-[9px] font-bold uppercase tracking-widest border-none">
                              {key}: {String(value)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

const Activity = ({ className }: { className?: string }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export default LeadActivityTimeline;
