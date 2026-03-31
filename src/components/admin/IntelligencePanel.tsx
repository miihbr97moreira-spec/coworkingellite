import React, { useMemo } from "react";
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  CheckSquare, 
  BookOpen, 
  ArrowRight,
  ChevronRight,
  ShieldAlert,
  Zap,
  MousePointer2,
  BarChart2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLeads, useStages } from "@/hooks/useSupabaseQuery";
import { differenceInDays } from "date-fns";

const IntelligencePanel = () => {
  const { data: leads, isLoading: leadsLoading } = useLeads(null);
  const { data: stages, isLoading: stagesLoading } = useStages(null);

  const insights = useMemo(() => {
    if (!leads || !stages) return { bottlenecks: [], conversionRates: [], playbookRecs: [] };

    const now = new Date();
    
    // 1. Detectar Gargalos (etapas com muitos leads parados há mais de 5 dias)
    const bottlenecks = stages.map(s => {
      const stageLeads = leads.filter(l => l.stage_id === s.id);
      const stuckLeads = stageLeads.filter(l => {
        const lastAct = l.last_activity_at ? new Date(l.last_activity_at) : new Date(l.created_at);
        return differenceInDays(now, lastAct) >= 5;
      });
      return {
        stageName: s.name,
        count: stageLeads.length,
        stuckCount: stuckLeads.length,
        isBottleneck: stuckLeads.length > stageLeads.length * 0.3 && stageLeads.length > 0
      };
    }).filter(b => b.isBottleneck);

    // 2. Playbooks recomendados (baseado na etapa do lead)
    const playbookRecs = [
      { stage: "Qualificação", items: ["Confirmar orçamento", "Identificar tomador de decisão", "Validar dor principal"], script: "Olá, entendi seu interesse. Para sermos assertivos, qual o principal desafio hoje?" },
      { stage: "Proposta", items: ["Apresentar ROI", "Enviar PDF personalizado", "Agendar reunião de fechamento"], script: "Conforme conversamos, segue nossa proposta focada em aumentar seu faturamento em X%." }
    ];

    return { bottlenecks, playbookRecs };
  }, [leads, stages]);

  if (leadsLoading || stagesLoading) return <div className="p-8 text-center">Analisando inteligência do pipeline...</div>;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-black tracking-tighter uppercase italic">Inteligência & <span className="text-primary">Processos</span></h2>
          <p className="text-sm text-muted-foreground">Detecção de gargalos e playbooks de execução</p>
        </div>
        <Badge variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/20 flex items-center gap-2">
          <Brain className="w-4 h-4" /> Motor de IA Ativo
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Alertas de Gargalos */}
        <Card className="bg-background/50 border-border/30 shadow-xl border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 uppercase font-black italic tracking-tight">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Detecção de Gargalos
            </CardTitle>
            <CardDescription>Onde seu dinheiro está parado no funil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {insights.bottlenecks.length > 0 ? (
              insights.bottlenecks.map((b, i) => (
                <div key={i} className="p-4 rounded-2xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                      <ShieldAlert className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-widest text-red-500">Etapa: {b.stageName}</p>
                      <p className="text-lg font-black">{b.stuckCount} Leads Parados</p>
                      <p className="text-xs text-muted-foreground">Você está perdendo velocidade de fechamento aqui.</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all">Ver Leads</Button>
                </div>
              ))
            ) : (
              <div className="p-10 text-center bg-emerald-500/5 rounded-3xl border border-emerald-500/10">
                <Zap className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
                <p className="text-lg font-bold">Fluxo Perfeito!</p>
                <p className="text-sm text-muted-foreground">Não detectamos gargalos significativos no seu funil hoje.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Playbooks de Vendas */}
        <Card className="bg-background/50 border-border/30 shadow-xl border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 uppercase font-black italic tracking-tight">
              <BookOpen className="w-5 h-5 text-primary" /> Playbooks de Execução
            </CardTitle>
            <CardDescription>Processos e roteiros para cada etapa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <ScrollArea className="h-[400px] pr-4">
              {insights.playbookRecs.map((p, i) => (
                <div key={i} className="mb-8 last:mb-0">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-primary text-white font-bold px-3 py-1 rounded-lg">{p.stage}</Badge>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Processo Padrão</span>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                      <CheckSquare className="w-3.5 h-3.5" /> Checklist Obrigatório
                    </p>
                    {p.items.map((item, j) => (
                      <div key={j} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/10 border border-border/5">
                        <div className="w-5 h-5 rounded border-2 border-primary/30 flex items-center justify-center shrink-0">
                          <div className="w-2.5 h-2.5 bg-primary rounded-sm opacity-20" />
                        </div>
                        <span className="text-sm font-medium">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                      <MousePointer2 className="w-3.5 h-3.5" /> Script Recomendado
                    </p>
                    <p className="text-sm italic font-medium leading-relaxed">"{p.script}"</p>
                    <Button size="sm" variant="link" className="text-primary p-0 h-auto mt-2 text-xs font-bold">Copiar Script <ArrowRight className="w-3 h-3 ml-1" /></Button>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default IntelligencePanel;
