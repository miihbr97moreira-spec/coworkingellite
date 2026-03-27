import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { Eye, MousePointerClick, TrendingUp, Users, Download, Calendar, ArrowUpRight, ArrowDownRight, DollarSign, Target } from "lucide-react";
import { useLPEvents, useLeads, useStages } from "@/hooks/useSupabaseQuery";
import jsPDF from "jspdf";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminDashboard = () => {
  const { data: events } = useLPEvents();
  const { data: leads } = useLeads(null);
  const { data: stages } = useStages(null);
  
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (!dateRange.from || !dateRange.to) return events;
    return events.filter((e) => {
      const eventDate = new Date(e.created_at);
      return isWithinInterval(eventDate, { start: startOfDay(dateRange.from!), end: endOfDay(dateRange.to!) });
    });
  }, [events, dateRange]);

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    if (!dateRange.from || !dateRange.to) return leads;
    return leads.filter((l) => {
      const leadDate = new Date(l.created_at);
      return isWithinInterval(leadDate, { start: startOfDay(dateRange.from!), end: endOfDay(dateRange.to!) });
    });
  }, [leads, dateRange]);

  const stats = useMemo(() => {
    const totalLeads = filteredLeads.length;
    const pipelineValue = filteredLeads
      .filter(l => {
        const stage = stages?.find(s => s.id === l.stage_id);
        return stage && stage.name.toLowerCase() !== 'fechado';
      })
      .reduce((acc, curr) => acc + Number(curr.deal_value || 0), 0);
    
    const closedLeads = filteredLeads.filter(l => {
      const stage = stages?.find(s => s.id === l.stage_id);
      return stage && stage.name.toLowerCase() === 'fechado';
    });
    
    const conversionRate = totalLeads > 0 ? ((closedLeads.length / totalLeads) * 100).toFixed(1) : "0";
    const totalRevenue = closedLeads.reduce((acc, curr) => acc + Number(curr.deal_value || 0), 0);
    const avgTicket = closedLeads.length > 0 
      ? (totalRevenue / closedLeads.length).toFixed(0)
      : "0";

    // Gráfico de Leads por Dia (últimos 30 dias ou range selecionado)
    const dailyData: Record<string, { date: string, leads: number, views: number }> = {};
    filteredEvents.forEach(e => {
      const day = format(new Date(e.created_at), "dd/MM");
      if (!dailyData[day]) dailyData[day] = { date: day, leads: 0, views: 0 };
      if (e.event_type === 'page_view') dailyData[day].views++;
    });
    filteredLeads.forEach(l => {
      const day = format(new Date(l.created_at), "dd/MM");
      if (!dailyData[day]) dailyData[day] = { date: day, leads: 0, views: 0 };
      dailyData[day].leads++;
    });

    // Leads por Etapa
    const stageData = stages?.map(s => ({
      name: s.name,
      value: filteredLeads.filter(l => l.stage_id === s.id).length,
      amount: filteredLeads.filter(l => l.stage_id === s.id).reduce((acc, curr) => acc + Number(curr.deal_value || 0), 0),
      color: s.color
    })) || [];

    return {
      totalLeads,
      pipelineValue,
      totalRevenue,
      conversionRate,
      avgTicket,
      dailyChart: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)),
      stageChart: stageData,
      topLeads: [...filteredLeads].sort((a, b) => Number(b.deal_value || 0) - Number(a.deal_value || 0)).slice(0, 5)
    };
  }, [filteredLeads, filteredEvents, stages]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Ellite Coworking — Relatório de Performance", 20, 20);
    doc.setFontSize(12);
    const rangeText = dateRange.from && dateRange.to 
      ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
      : "Todo o período";
    doc.text(`Período: ${rangeText}`, 20, 30);
    doc.text(`Total de Leads: ${stats.totalLeads}`, 20, 45);
    doc.text(`Receita Total: R$ ${stats.totalRevenue.toLocaleString("pt-BR")}`, 20, 55);
    doc.text(`Valor em Pipeline: R$ ${stats.pipelineValue.toLocaleString("pt-BR")}`, 20, 65);
    doc.text(`Taxa de Conversão: ${stats.conversionRate}%`, 20, 75);
    doc.text(`Ticket Médio: R$ ${Number(stats.avgTicket).toLocaleString("pt-BR")}`, 20, 85);
    doc.save(`relatorio-ellite-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const kpis = [
    { label: "Total de Leads", value: stats.totalLeads, icon: Users, trend: "+12%", up: true, color: "text-blue-500" },
    { label: "Receita Total", value: `R$ ${stats.totalRevenue.toLocaleString("pt-BR")}`, icon: DollarSign, trend: "+18%", up: true, color: "text-emerald-500" },
    { label: "Pipeline", value: `R$ ${stats.pipelineValue.toLocaleString("pt-BR")}`, icon: DollarSign, trend: "+8%", up: true, color: "text-amber-500" },
    { label: "Conversão", value: `${stats.conversionRate}%`, icon: Target, trend: "-2%", up: false, color: "text-red-500" },
    { label: "Ticket Médio", value: `R$ ${Number(stats.avgTicket).toLocaleString("pt-BR")}`, icon: TrendingUp, trend: "+5%", up: true, color: "text-primary" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground text-sm">Visão geral da performance e funil de vendas.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 rounded-xl border-border/40 bg-secondary/30">
                <Calendar className="w-4 h-4 text-primary" />
                {dateRange.from && dateRange.to
                  ? `${format(dateRange.from, "dd MMM", { locale: ptBR })} - ${format(dateRange.to, "dd MMM", { locale: ptBR })}`
                  : "Filtrar período"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-4 bg-background border border-border rounded-xl shadow-2xl">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Início</p>
                    <CalendarComponent mode="single" selected={dateRange.from} onSelect={(d) => setDateRange(prev => ({ ...prev, from: d }))} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Fim</p>
                    <CalendarComponent mode="single" selected={dateRange.to} onSelect={(d) => setDateRange(prev => ({ ...prev, to: d }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" className="flex-1 text-xs" onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}>7 dias</Button>
                  <Button variant="ghost" className="flex-1 text-xs" onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}>30 dias</Button>
                  <Button variant="outline" className="flex-1 text-xs" onClick={() => setDateRange({ from: undefined, to: undefined })}>Limpar</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={exportPDF} className="gap-2 rounded-xl font-bold">
            <Download className="w-4 h-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* Row 1 — KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="glass p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{kpi.label}</p>
                <h3 className="text-2xl font-bold">{kpi.value}</h3>
              </div>
              <div className={`p-2 rounded-lg bg-secondary/50 ${kpi.color}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className={`flex items-center text-[10px] font-bold ${kpi.up ? 'text-emerald-500' : 'text-red-500'}`}>
                {kpi.up ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                {kpi.trend}
              </span>
              <span className="text-[10px] text-muted-foreground">vs. mês anterior</span>
            </div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>

      {/* Row 2 — Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-sm uppercase tracking-wider">Crescimento de Leads & Visitas</h3>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase">
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary" /> Leads</div>
              <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500" /> Visitas</div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyChart}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(45 100% 56%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(45 100% 56%)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="hsl(220 10% 40%)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(220 10% 40%)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: "hsl(220 15% 10%)", border: "1px solid hsl(220 10% 20%)", borderRadius: "12px", fontSize: "12px" }}
                  itemStyle={{ fontWeight: "bold" }}
                />
                <Area type="monotone" dataKey="leads" stroke="hsl(45 100% 56%)" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                <Area type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6">
          <h3 className="font-bold text-sm uppercase tracking-wider mb-6">Distribuição por Etapa</h3>
          <div className="h-[300px] w-full flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="80%">
              <PieChart>
                <Pie
                  data={stats.stageChart}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.stageChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 w-full mt-4">
              {stats.stageChart.map((s) => (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[10px] font-bold text-muted-foreground truncate">{s.name}</span>
                  <span className="text-[10px] font-mono ml-auto">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 3 — Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6">
          <h3 className="font-bold text-sm uppercase tracking-wider mb-6">Top Leads por Valor</h3>
          <div className="space-y-4">
            {stats.topLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/20 border border-border/20 hover:border-primary/30 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                    {lead.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{lead.name}</p>
                    <p className="text-[10px] text-muted-foreground">{lead.company || '—'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">R$ {Number(lead.deal_value || 0).toLocaleString("pt-BR")}</p>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                    {stages?.find(s => s.id === lead.stage_id)?.name}
                  </span>
                </div>
              </div>
            ))}
            {stats.topLeads.length === 0 && <p className="text-center text-muted-foreground text-sm py-8 italic">Nenhum lead encontrado no período.</p>}
          </div>
        </div>

        <div className="glass p-6">
          <h3 className="font-bold text-sm uppercase tracking-wider mb-6">Volume vs. Valor por Etapa</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.stageChart}>
                <XAxis dataKey="name" stroke="hsl(220 10% 40%)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(220 10% 40%)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ background: "hsl(220 15% 10%)", border: "1px solid hsl(220 10% 20%)", borderRadius: "12px" }}
                />
                <Bar dataKey="amount" fill="hsl(45 100% 56%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
