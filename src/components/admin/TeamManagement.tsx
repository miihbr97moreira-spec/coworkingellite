import React, { useMemo } from "react";
import { 
  Users, 
  Trophy, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  User,
  Star,
  Zap,
  LayoutGrid,
  Settings
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLeads } from "@/hooks/useSupabaseQuery";

const TeamManagement = () => {
  const { data: leads, isLoading: leadsLoading } = useLeads(null);

  const teamStats = useMemo(() => {
    if (!leads) return [];
    
    // Mock de vendedores (em um sistema real viria de auth.users e team_members)
    const sellers = [
      { id: "1", name: "Gabriel Oliveira", avatar: "GO", role: "Vendedor Sênior", leads: 45, conversion: 72, responseTime: "12m", value: 125000 },
      { id: "2", name: "Ana Beatriz", avatar: "AB", role: "Vendedor Pleno", leads: 38, conversion: 68, responseTime: "18m", value: 98000 },
      { id: "3", name: "Lucas Mendes", avatar: "LM", role: "Vendedor Junior", leads: 22, conversion: 54, responseTime: "25m", value: 45000 }
    ];

    return sellers.sort((a, b) => b.value - a.value);
  }, [leads]);

  if (leadsLoading) return <div className="p-8 text-center">Analisando desempenho da equipe...</div>;

  const RankingItem = ({ seller, index }: { seller: any, index: number }) => (
    <div className="flex items-center justify-between p-4 mb-4 rounded-3xl border border-border/10 bg-secondary/5 hover:bg-secondary/10 transition-all group">
      <div className="flex items-center gap-4 overflow-hidden">
        <div className="relative shrink-0">
          <div className={`w-14 h-14 rounded-2xl ${index === 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/10 text-primary'} flex items-center justify-center text-lg font-black shadow-inner`}>
            {seller.avatar}
          </div>
          {index === 0 && <div className="absolute -top-2 -right-2 bg-amber-500 text-white p-1 rounded-full shadow-lg border-2 border-background"><Trophy className="w-3.5 h-3.5" /></div>}
        </div>
        <div className="overflow-hidden">
          <div className="flex items-center gap-2">
            <p className="text-base font-black truncate tracking-tight">{seller.name}</p>
            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest px-2 py-0 h-4 border-primary/20 text-primary">{seller.role}</Badge>
          </div>
          <p className="text-xs text-muted-foreground font-medium mt-0.5 flex items-center gap-2">
            <Users className="w-3 h-3" /> {seller.leads} leads atribuídos • <Clock className="w-3 h-3" /> {seller.responseTime} de resposta
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-8 pr-4">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Conversão</p>
          <p className="text-lg font-black text-emerald-500">{seller.conversion}%</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Vendas (R$)</p>
          <p className="text-xl font-black">R$ {seller.value.toLocaleString('pt-BR')}</p>
        </div>
        <Button size="icon" variant="ghost" className="rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-all">
          <ArrowUpRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-black tracking-tighter uppercase italic">Gestão de <span className="text-primary">Equipe</span></h2>
          <p className="text-sm text-muted-foreground">Desempenho, conversão e distribuição de leads</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="outline" className="rounded-xl border-border/20 flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
            <Settings className="w-4 h-4" /> Configurar Round-Robin
          </Button>
          <Button className="rounded-xl bg-primary hover:bg-primary/90 flex items-center gap-2 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
            <Zap className="w-4 h-4" /> Distribuir Leads
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Ranking de Vendedores */}
        <Card className="lg:col-span-2 bg-background/50 border-border/30 shadow-xl overflow-hidden">
          <CardHeader className="border-b border-border/5 pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2 uppercase font-black italic tracking-tight">
                <Star className="w-5 h-5 text-amber-500" /> Top Performers
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-none font-bold">Total Equipe: R$ 268.000</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <ScrollArea className="h-[500px] pr-4">
              {teamStats.map((seller, i) => (
                <RankingItem key={seller.id} seller={seller} index={i} />
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Estatísticas Consolidadas */}
        <div className="space-y-6">
          <Card className="bg-background/50 border-border/30 shadow-xl border-l-4 border-l-emerald-500">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" /> Saúde da Equipe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Taxa de Conversão</p>
                  <p className="text-2xl font-black">64.8%</p>
                </div>
                <div className="text-emerald-500 flex items-center gap-1 font-bold">
                  <ArrowUpRight className="w-4 h-4" /> +4.2%
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tempo Médio de Resposta</p>
                  <p className="text-2xl font-black">18 min</p>
                </div>
                <div className="text-emerald-500 flex items-center gap-1 font-bold">
                  <ArrowDownRight className="w-4 h-4" /> -5 min
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Ticket Médio</p>
                  <p className="text-2xl font-black">R$ 12.450</p>
                </div>
                <div className="text-red-500 flex items-center gap-1 font-bold">
                  <ArrowDownRight className="w-4 h-4" /> -R$ 1.200
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-background/50 border-border/30 shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-primary" /> Distribuição Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/10 border border-border/5">
                  <span className="text-sm font-medium">Round-Robin</span>
                  <Badge className="bg-emerald-500 text-white font-bold">Ativo</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/10 border border-border/5">
                  <span className="text-sm font-medium">Leads na Fila</span>
                  <Badge variant="outline" className="font-bold">12</Badge>
                </div>
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                  <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Dica de Gestão</p>
                  <p className="text-xs font-medium leading-relaxed">Vendedores com tempo de resposta abaixo de 10 min convertem 3x mais. Considere automatizar a primeira resposta.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default TeamManagement;
