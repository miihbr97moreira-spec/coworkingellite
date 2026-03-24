import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { Users, Download, Calendar, ArrowUpRight, ArrowDownRight, DollarSign, Target, TrendingUp, Zap, Activity, Filter } from "lucide-react";
import { useLPEvents, useLeads, useStages } from "@/hooks/useSupabaseQuery";
import jsPDF from "jspdf";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminDashboard = () => {
  const { data: events } = useLPEvents();
  const { data: leads } = useLeads();
  const { data: stages } = useStages();
  
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
    const avgTicket = closedLeads.length > 0 
      ? (closedLeads.reduce((acc, curr) => acc + Number(curr.deal_value || 0), 0) / closedLeads.length).toFixed(0)
      : "0";

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

    const stageData = stages?.map(s => ({
      name: s.name,
      value: filteredLeads.filter(l => l.stage_id === s.id).length,
      color: s.color || "#3f3f46"
    })) || [];

    return {
      totalLeads,
      pipelineValue,
      conversionRate,
      avgTicket,
      dailyChart: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)),
      stageChart: stageData,
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
    doc.text(`Valor em Pipeline: R$ ${stats.pipelineValue.toLocaleString("pt-BR")}`, 20, 55);
    doc.text(`Taxa de Conversão: ${stats.conversionRate}%`, 20, 65);
    doc.text(`Ticket Médio: R$ ${Number(stats.avgTicket).toLocaleString("pt-BR")}`, 20, 75);
    doc.save(`relatorio-ellite-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const kpis = [
    { label: "Total de Leads", value: stats.totalLeads, icon: Users, trend: "+12%", up: true, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Pipeline", value: `R$ ${stats.pipelineValue.toLocaleString("pt-BR")}`, icon: DollarSign, trend: "+8%", up: true, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Conversão", value: `${stats.conversionRate}%`, icon: Target, trend: "-2%", up: false, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Ticket Médio", value: `R$ ${Number(stats.avgTicket).toLocaleString("pt-BR")}`, icon: TrendingUp, trend: "+5%", up: true, color: "text-primary", bg: "bg-primary/10" },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Activity className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Real-time Analytics</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Visão Geral</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-11 gap-3 rounded-xl border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 transition-all">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-xs font-medium">
                  {dateRange.from && dateRange.to
                    ? `${format(dateRange.from, "dd MMM", { locale: ptBR })} - ${format(dateRange.to, "dd MMM", { locale: ptBR })}`
                    : "Filtrar período"}
                </span>
                <Filter className="w-3 h-3 text-zinc-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-zinc-900 border-zinc-800 shadow-2xl rounded-2xl overflow-hidden" align="end">
              <div className="p-4">
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <CalendarComponent 
                    mode="range" 
                    selected={{ from: dateRange.from, to: dateRange.to }} 
                    onSelect={(range: any) => setDateRange({ from: range?.from, to: range?.to })}
                    className="bg-zinc-900 text-zinc-100"
                  />
                </div>
                <div className="flex gap-2 pt-4 border-t border-zinc-800">
                  <Button variant="ghost" className="flex-1 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800" onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}>7 dias</Button>
                  <Button variant="ghost" className="flex-1 text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800" onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}>30 dias</Button>
                  <Button variant="outline" className="flex-1 text-[10px] font-bold uppercase tracking-widest border-zinc-800" onClick={() => setDateRange({ from: undefined, to: undefined })}>Limpar</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button onClick={exportPDF} className="h-11 gap-2 rounded-xl font-bold bg-zinc-100 text-zinc-900 hover:bg-zinc-200 shadow-lg shadow-white/5">
            <Download className="w-4 h-4" /> Exportar
          </Button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-800 to-zinc-700 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500" />
            <div className="relative bg-zinc-900/50 border border-zinc-800/50 p-6 rounded-2xl backdrop-blur-sm hover:border-zinc-700 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color}`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${kpi.up ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                  {kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {kpi.trend}
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 mb-1">{kpi.label}</p>
              <h3 className="text-2xl font-bold text-zinc-100 tracking-tight">{kpi.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-zinc-900/30 border border-zinc-800/50 p-8 rounded-3xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-10">
            <div className="space-y-1">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Fluxo de Aquisição</h3>
              <p className="text-xs text-zinc-500">Comparativo entre visitas e novos leads</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(251,191,36,0.4)]" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-zinc-700" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Visitas</span>
              </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.dailyChart}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#FBBF24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="#3f3f46" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                />
                <YAxis 
                  stroke="#3f3f46" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "16px", fontSize: "12px", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)" }}
                  itemStyle={{ fontWeight: "bold", color: "#f4f4f5" }}
                  cursor={{ stroke: '#3f3f46', strokeWidth: 1 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="leads" 
                  stroke="#FBBF24" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorLeads)" 
                  animationDuration={2000}
                />
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="#3f3f46" 
                  strokeWidth={2} 
                  fill="transparent" 
                  strokeDasharray="6 6" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Chart */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 p-8 rounded-3xl backdrop-blur-sm flex flex-col">
          <div className="space-y-1 mb-10">
            <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Funil de Vendas</h3>
            <p className="text-xs text-zinc-500">Distribuição por etapa atual</p>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.stageChart}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.stageChart.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full space-y-3 mt-8">
              {stats.stageChart.map((s) => (
                <div key={s.name} className="flex items-center justify-between p-3 rounded-xl bg-zinc-800/30 border border-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-xs font-medium text-zinc-300">{s.name}</span>
                  </div>
                  <span className="text-xs font-bold text-zinc-100">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions / Footer */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-primary/10 via-transparent to-transparent border border-primary/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-100">Dica de Performance</h4>
            <p className="text-xs text-zinc-500">Sua taxa de conversão aumentou 2% desde a última atualização do Builder.</p>
          </div>
        </div>
        <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest text-primary hover:bg-primary/10">
          Ver Insights Detalhados
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
