import React, { useState, useMemo } from "react";
import { 
  LayoutGrid, 
  List, 
  Search, 
  Filter, 
  Plus, 
  History, 
  Zap, 
  DollarSign, 
  User, 
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Calendar,
  Layers,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Briefcase
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLeads, useStages } from "@/hooks/useSupabaseQuery";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const ModularCRM = () => {
  const { data: leads, isLoading: leadsLoading } = useLeads(null);
  const { data: stages, isLoading: stagesLoading } = useStages(null);
  const [activeView, setActiveView] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    let result = leads;

    // Busca
    if (searchTerm) {
      result = result.filter(l => 
        l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (l.email && l.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Visões Inteligentes
    const now = new Date();
    switch (activeView) {
      case "hot":
        return result.filter(l => (l.lead_score || 0) >= 80);
      case "stuck":
        return result.filter(l => {
          const lastAct = l.last_activity_at ? new Date(l.last_activity_at) : new Date(l.created_at);
          return differenceInDays(now, lastAct) >= 5 && l.status !== 'won' && l.status !== 'lost';
        });
      case "closing":
        const closingStages = stages?.slice(-2).map(s => s.id) || [];
        return result.filter(l => closingStages.includes(l.stage_id));
      default:
        return result;
    }
  }, [leads, activeView, searchTerm, stages]);

  const stats = useMemo(() => {
    if (!leads) return { total: 0, value: 0, conversion: 0 };
    const won = leads.filter(l => l.status === 'won');
    return {
      total: leads.length,
      value: leads.reduce((acc, l) => acc + Number(l.deal_value || 0), 0),
      conversion: leads.length > 0 ? Math.round((won.length / leads.length) * 100) : 0
    };
  }, [leads]);

  if (leadsLoading || stagesLoading) return <div className="p-8 text-center">Carregando CRM Modular...</div>;

  return (
    <div className="space-y-6 p-6">
      {/* Header com KPIs Rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="md:col-span-2">
          <h2 className="text-3xl font-black tracking-tighter uppercase italic">CRM <span className="text-primary">Operacional</span></h2>
          <p className="text-sm text-muted-foreground font-medium">Gestão avançada de leads, negócios e histórico</p>
        </div>
        <div className="bg-secondary/5 border border-border/10 p-4 rounded-3xl flex items-center gap-4 shadow-inner">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Volume Pipeline</p>
            <p className="text-xl font-black">R$ {stats.value.toLocaleString('pt-BR')}</p>
          </div>
        </div>
        <div className="bg-secondary/5 border border-border/10 p-4 rounded-3xl flex items-center gap-4 shadow-inner">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Conversão</p>
            <p className="text-xl font-black">{stats.conversion}%</p>
          </div>
        </div>
      </div>

      {/* Barra de Ferramentas e Visões */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-background/50 border border-border/30 p-3 rounded-3xl shadow-xl">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "Todos", icon: Layers, color: "bg-primary" },
            { id: "hot", label: "Quentes Hoje", icon: Zap, color: "bg-red-500" },
            { id: "stuck", label: "Parados", icon: Clock, color: "bg-orange-500" },
            { id: "closing", label: "Fechamento Próximo", icon: CheckCircle2, color: "bg-emerald-500" }
          ].map((view) => (
            <Button 
              key={view.id}
              variant={activeView === view.id ? "default" : "ghost"}
              onClick={() => setActiveView(view.id)}
              className={`rounded-2xl px-4 py-2 font-bold text-[11px] uppercase tracking-widest h-10 ${activeView === view.id ? view.color : 'text-muted-foreground hover:bg-secondary/10'}`}
            >
              <view.icon className="w-4 h-4 mr-2" /> {view.label}
            </Button>
          ))}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar lead..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-[250px] bg-secondary/10 border-border/10 rounded-2xl h-10 font-medium text-sm focus:ring-primary" 
            />
          </div>
          <Button variant="outline" className="rounded-2xl border-border/20 h-10 px-4 font-bold text-[11px] uppercase tracking-widest">
            <Filter className="w-4 h-4 mr-2" /> Filtros
          </Button>
          <Button className="rounded-2xl bg-primary hover:bg-primary/90 h-10 px-4 font-bold text-[11px] uppercase tracking-widest shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" /> Novo Lead
          </Button>
        </div>
      </div>

      {/* Conteúdo Principal: Leads e Negócios */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Lista de Leads (Oportunidades) */}
        <div className="lg:col-span-2 space-y-4">
          <ScrollArea className="h-[600px] pr-4">
            {filteredLeads.map((lead) => (
              <Card key={lead.id} className="mb-4 bg-background/50 border-border/30 shadow-lg hover:border-primary/30 transition-all group cursor-pointer overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-0">
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-primary font-black shadow-inner">
                        {lead.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-lg font-black tracking-tight">{lead.name}</h4>
                          {(lead.lead_score || 0) >= 80 && <Badge className="bg-red-500/20 text-red-500 border-none font-black text-[9px] uppercase tracking-widest">Hot</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5" /> {lead.company || "Pessoa Física"} • <DollarSign className="w-3.5 h-3.5" /> R$ {Number(lead.deal_value || 0).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Último Contato</p>
                        <p className="text-sm font-black">{lead.last_activity_at ? format(new Date(lead.last_activity_at), "dd/MM/yy") : "—"}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Seção de Negócios (Deals) Expandida */}
                  <div className="bg-secondary/5 border-t border-border/5 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="rounded-lg font-bold text-[9px] uppercase tracking-widest bg-background/50 border-border/10">
                        1 Negócio Ativo
                      </Badge>
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-background flex items-center justify-center text-[8px] font-bold text-white">GO</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="text-[10px] font-black uppercase tracking-widest h-8 px-3 rounded-xl hover:bg-primary/10 hover:text-primary">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Novo Negócio
                      </Button>
                      <Button size="sm" variant="ghost" className="text-[10px] font-black uppercase tracking-widest h-8 px-3 rounded-xl hover:bg-secondary/20">
                        <History className="w-3.5 h-3.5 mr-1" /> Histórico
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredLeads.length === 0 && (
              <div className="p-20 text-center bg-secondary/5 rounded-[40px] border border-dashed border-border/30">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-lg font-bold text-muted-foreground">Nenhum lead encontrado nesta visão.</p>
                <Button variant="link" onClick={() => setActiveView("all")} className="text-primary font-bold">Ver todos os leads</Button>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Sidebar: Histórico Global & Lógicas */}
        <div className="space-y-6">
          <Card className="bg-background/50 border-border/30 shadow-xl">
            <CardHeader className="border-b border-border/5">
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <History className="w-4 h-4 text-primary" /> Histórico Global
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ScrollArea className="h-[300px] pr-4">
                {[
                  { user: "Gabriel", action: "moveu", target: "Lead X", time: "10m atrás", color: "text-blue-500" },
                  { user: "Ana", action: "fechou", target: "Negócio Y", time: "1h atrás", color: "text-emerald-500" },
                  { user: "Sistema", action: "marcou", target: "Lead Z como Quente", time: "3h atrás", color: "text-red-500" },
                  { user: "Lucas", action: "anexou", target: "Contrato_Z.pdf", time: "5h atrás", color: "text-orange-500" }
                ].map((log, i) => (
                  <div key={i} className="mb-6 last:mb-0 relative pl-6 before:absolute before:left-0 before:top-1.5 before:w-2 before:h-2 before:rounded-full before:bg-border/30">
                    <p className="text-xs font-medium leading-relaxed">
                      <span className="font-black text-primary">{log.user}</span> {log.action} <span className="font-black">{log.target}</span>
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{log.time}</p>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="bg-background/50 border-border/30 shadow-xl border-l-4 border-l-primary">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Lógicas Automáticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-2xl bg-secondary/5 border border-border/5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-tight">Auto-Mover Ganhos</span>
                <Badge className="bg-emerald-500 text-white font-bold">ON</Badge>
              </div>
              <div className="p-3 rounded-2xl bg-secondary/5 border border-border/5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-tight">Auto-Prioridade Hot</span>
                <Badge className="bg-emerald-500 text-white font-bold">ON</Badge>
              </div>
              <div className="p-3 rounded-2xl bg-secondary/5 border border-border/5 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-tight">Auto-Tarefa Follow-up</span>
                <Badge variant="outline" className="font-bold border-border/20">OFF</Badge>
              </div>
              <Button variant="outline" className="w-full rounded-xl border-border/20 text-[10px] font-bold uppercase tracking-widest h-10 hover:bg-primary/10 hover:text-primary transition-all">
                Configurar Regras
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default ModularCRM;
