import React, { useMemo } from "react";
import { 
  TrendingUp, 
  DollarSign, 
  PieChart, 
  Target, 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity,
  Calendar,
  Layers,
  BarChart3
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart as RePieChart,
  Pie,
  LineChart,
  Line
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useLeads, useStages } from "@/hooks/useSupabaseQuery";

const RevenueEngine = () => {
  const { data: leads, isLoading: leadsLoading } = useLeads(null);
  const { data: stages, isLoading: stagesLoading } = useStages(null);

  const stats = useMemo(() => {
    if (!leads || !stages) return { 
      totalForecast: 0, 
      weightedRevenue: 0, 
      lostRevenue: 0, 
      wonRevenue: 0, 
      byStage: [], 
      probabilities: [] 
    };

    const wonLeads = leads.filter(l => l.status === 'won');
    const lostLeads = leads.filter(l => l.status === 'lost');
    const openLeads = leads.filter(l => l.status !== 'won' && l.status !== 'lost');

    const totalForecast = openLeads.reduce((acc, l) => acc + Number(l.expected_revenue || l.deal_value || 0), 0);
    const weightedRevenue = openLeads.reduce((acc, l) => acc + (Number(l.expected_revenue || l.deal_value || 0) * (l.probability || 50) / 100), 0);
    const lostRevenue = lostLeads.reduce((acc, l) => acc + Number(l.deal_value || 0), 0);
    const wonRevenue = wonLeads.reduce((acc, l) => acc + Number(l.deal_value || 0), 0);

    const byStage = stages.map(s => {
      const stageLeads = leads.filter(l => l.stage_id === s.id);
      return {
        name: s.name,
        value: stageLeads.reduce((acc, l) => acc + Number(l.deal_value || 0), 0),
        count: stageLeads.length
      };
    });

    return { totalForecast, weightedRevenue, lostRevenue, wonRevenue, byStage };
  }, [leads, stages]);

  if (leadsLoading || stagesLoading) return <div className="p-8 text-center">Calculando motor de receita...</div>;

  const KPICard = ({ label, value, icon: Icon, trend, trendUp, color }: any) => (
    <Card className="bg-background/50 border-border/30 shadow-xl">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-2xl ${color} bg-opacity-10`}>
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-500' : 'text-red-500'}`}>
              {trendUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
              {trend}
            </div>
          )}
        </div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        <h3 className="text-2xl font-black mt-1">R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</h3>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-black tracking-tighter uppercase italic">Motor de <span className="text-primary">Receita</span></h2>
          <p className="text-sm text-muted-foreground">Análise financeira e forecast em tempo real</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/20 p-1 rounded-xl border border-border/10">
          <div className="px-3 py-1.5 rounded-lg bg-background text-xs font-bold shadow-sm">Mensal</div>
          <div className="px-3 py-1.5 rounded-lg text-xs font-bold text-muted-foreground hover:bg-background/50 transition-all cursor-pointer">Trimestral</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard label="Forecast Total" value={stats.totalForecast} icon={TrendingUp} trend="+12.5%" trendUp={true} color="bg-blue-500" />
        <KPICard label="Receita Ponderada" value={stats.weightedRevenue} icon={Target} trend="+5.2%" trendUp={true} color="bg-primary" />
        <KPICard label="Receita Ganha" value={stats.wonRevenue} icon={DollarSign} trend="+18.4%" trendUp={true} color="bg-emerald-500" />
        <KPICard label="Receita Perdida" value={stats.lostRevenue} icon={ArrowDownRight} trend="-2.1%" trendUp={false} color="bg-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Receita por Etapa */}
        <Card className="lg:col-span-2 bg-background/50 border-border/30 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 uppercase font-black italic tracking-tight">
              <Layers className="w-5 h-5 text-primary" /> Distribuição por Etapa
            </CardTitle>
            <CardDescription>Volume financeiro em cada fase do pipeline</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byStage} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `R$ ${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: any) => [`R$ ${value.toLocaleString('pt-BR')}`, 'Valor']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {stats.byStage.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#D97757' : '#f97316'} fillOpacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Funil de Conversão Financeira */}
        <Card className="bg-background/50 border-border/30 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 uppercase font-black italic tracking-tight">
              <Activity className="w-5 h-5 text-primary" /> Pipeline Health
            </CardTitle>
            <CardDescription>Saúde financeira do funil</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-1">
                <span>Eficiência de Conversão</span>
                <span className="text-emerald-500">74%</span>
              </div>
              <div className="w-full h-2 bg-secondary/30 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '74%' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-1">
                <span>Ticket Médio</span>
                <span className="text-blue-500">R$ 12.450</span>
              </div>
              <div className="w-full h-2 bg-secondary/30 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-1">
                <span>Ciclo de Vendas</span>
                <span className="text-orange-500">18 dias</span>
              </div>
              <div className="w-full h-2 bg-secondary/30 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '45%' }} />
              </div>
            </div>

            <div className="mt-8 p-4 rounded-2xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <PieChart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-primary">Insight do Dia</p>
                  <p className="text-sm font-medium mt-0.5 leading-snug">Sua etapa de "Proposta" concentra 45% do valor total do pipeline. Foco em fechamento!</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RevenueEngine;
