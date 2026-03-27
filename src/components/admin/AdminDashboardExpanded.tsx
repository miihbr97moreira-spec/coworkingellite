import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, ComposedChart, Legend, CartesianGrid, Line
} from "recharts";
import {
  Eye, MousePointerClick, TrendingUp, Users, Download, Calendar, ArrowUpRight,
  ArrowDownRight, DollarSign, Target, MessageCircle, Zap, Activity, Gauge, ListChecks, Globe
} from "lucide-react";
import { useLPEvents, useLeads, useStages, useQuizzes, useQuizSubmissions } from "@/hooks/useSupabaseQuery";
import jsPDF from "jspdf";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";

/* ── KPI Card ── */
const KPICard = ({ label, value, icon: Icon, trend, up, color, subtitle }: any) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
    className="p-5 rounded-xl border border-border/40 bg-secondary/10 hover:border-primary/30 transition-all group">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-1.5">{label}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-1">{subtitle}</p>}
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-[10px] font-semibold ${up ? 'text-emerald-500' : 'text-red-400'}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <div className={`p-2.5 rounded-lg bg-secondary/50 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </motion.div>
);

const chartTooltipStyle = {
  contentStyle: { background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: "10px", fontSize: "12px" },
};

const AdminDashboardExpanded = () => {
  const { data: events } = useLPEvents();
  const { data: leads } = useLeads(null);
  const { data: stages } = useStages(null);
  const { data: quizzes } = useQuizzes();
  const { data: quizSubs } = useQuizSubmissions(null);

  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: subDays(new Date(), 30), to: new Date(),
  });

  const filterByDate = <T extends { created_at: string }>(items: T[] | undefined) => {
    if (!items) return [];
    if (!dateRange.from || !dateRange.to) return items;
    return items.filter(i => isWithinInterval(new Date(i.created_at), { start: startOfDay(dateRange.from!), end: endOfDay(dateRange.to!) }));
  };

  const fEvents = useMemo(() => filterByDate(events), [events, dateRange]);
  const fLeads = useMemo(() => filterByDate(leads), [leads, dateRange]);
  const fSubs = useMemo(() => filterByDate(quizSubs), [quizSubs, dateRange]);

  const getMeta = (e: any, key: string): any => (e.metadata as Record<string, any> | null)?.[key];

  // ── Computed Stats ──
  const stats = useMemo(() => {
    const uniqueVisits = new Set(fEvents.filter(e => e.event_type === 'page_view').map(e => getMeta(e, 'session_id'))).size;
    const totalPageViews = fEvents.filter(e => e.event_type === 'page_view').length;
    const totalClicks = fEvents.filter(e => ['button_click', 'plan_click', 'cta_click', 'whatsapp_click'].includes(e.event_type)).length;
    const whatsappClicks = fEvents.filter(e =>
      (e.event_type === 'button_click' && getMeta(e, 'cta_type') === 'whatsapp') || e.event_type === 'whatsapp_click' || e.event_type === 'plan_click'
    ).length;

    const totalLeads = fLeads.length;
    const closedLeads = fLeads.filter(l => {
      const stage = stages?.find(s => s.id === l.stage_id);
      return stage && stage.name.toLowerCase().includes('fechado');
    });
    const revenue = closedLeads.reduce((a, l) => a + Number(l.deal_value || 0), 0);
    const pipelineValue = fLeads.filter(l => !closedLeads.includes(l)).reduce((a, l) => a + Number(l.deal_value || 0), 0);
    const conversionRate = totalLeads > 0 ? ((closedLeads.length / totalLeads) * 100).toFixed(1) : "0";
    const avgTicket = closedLeads.length > 0 ? Math.round(revenue / closedLeads.length) : 0;

    // Daily chart
    const dailyData: Record<string, any> = {};
    fEvents.forEach(e => {
      const day = format(new Date(e.created_at), "dd/MM");
      if (!dailyData[day]) dailyData[day] = { date: day, leads: 0, views: 0, clicks: 0, whatsapp: 0 };
      if (e.event_type === 'page_view') dailyData[day].views++;
      if (['button_click', 'cta_click'].includes(e.event_type)) dailyData[day].clicks++;
      if (e.event_type === 'whatsapp_click' || (e.event_type === 'button_click' && getMeta(e, 'cta_type') === 'whatsapp')) dailyData[day].whatsapp++;
    });
    fLeads.forEach(l => {
      const day = format(new Date(l.created_at), "dd/MM");
      if (!dailyData[day]) dailyData[day] = { date: day, leads: 0, views: 0, clicks: 0, whatsapp: 0 };
      dailyData[day].leads++;
    });

    const stageData = stages?.map(s => ({
      name: s.name, value: fLeads.filter(l => l.stage_id === s.id).length,
      amount: fLeads.filter(l => l.stage_id === s.id).reduce((a, l) => a + Number(l.deal_value || 0), 0),
      color: s.color,
    })) || [];

    const ctaClicks: Record<string, number> = {};
    fEvents.forEach(e => { if (e.event_type === 'button_click') { const l = getMeta(e, 'cta_label') || '?'; ctaClicks[l] = (ctaClicks[l] || 0) + 1; } });
    const ctaClicksData = Object.entries(ctaClicks).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8);

    return {
      uniqueVisits, totalPageViews, totalClicks, whatsappClicks, totalLeads,
      revenue, pipelineValue, conversionRate, avgTicket,
      clickThroughRate: totalPageViews > 0 ? ((totalClicks / totalPageViews) * 100).toFixed(1) : "0",
      dailyChart: Object.values(dailyData).sort((a: any, b: any) => a.date.localeCompare(b.date)),
      stageChart: stageData, ctaClicksData,
      topLeads: [...fLeads].sort((a, b) => Number(b.deal_value || 0) - Number(a.deal_value || 0)).slice(0, 5),
    };
  }, [fEvents, fLeads, stages]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Omni Builder — Relatório", 20, 20);
    doc.setFontSize(11);
    const r = dateRange.from && dateRange.to ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}` : "Todo o período";
    doc.text(`Período: ${r}`, 20, 30);
    doc.text(`Receita: R$ ${stats.revenue.toLocaleString("pt-BR")}`, 20, 45);
    doc.text(`Leads: ${stats.totalLeads}`, 20, 52);
    doc.text(`Conversão: ${stats.conversionRate}%`, 20, 59);
    doc.text(`Pipeline: R$ ${stats.pipelineValue.toLocaleString("pt-BR")}`, 20, 66);
    doc.text(`Visitantes: ${stats.uniqueVisits}`, 20, 73);
    doc.text(`WhatsApp Cliques: ${stats.whatsappClicks}`, 20, 80);
    doc.save(`omni-relatorio-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const DateFilter = () => (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 text-xs rounded-lg border-border/40 bg-secondary/20">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            {dateRange.from && dateRange.to
              ? `${format(dateRange.from, "dd MMM", { locale: ptBR })} – ${format(dateRange.to, "dd MMM", { locale: ptBR })}`
              : "Período"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <div className="p-3">
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">De</p>
                <CalendarComponent mode="single" selected={dateRange.from} onSelect={(d) => setDateRange(p => ({ ...p, from: d }))} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Até</p>
                <CalendarComponent mode="single" selected={dateRange.to} onSelect={(d) => setDateRange(p => ({ ...p, to: d }))} />
              </div>
            </div>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" className="flex-1 text-[10px] h-7" onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}>7d</Button>
              <Button variant="ghost" size="sm" className="flex-1 text-[10px] h-7" onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}>30d</Button>
              <Button variant="outline" size="sm" className="flex-1 text-[10px] h-7" onClick={() => setDateRange({ from: undefined, to: undefined })}>Tudo</Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <Button onClick={exportPDF} variant="outline" size="sm" className="gap-1.5 text-xs rounded-lg">
        <Download className="w-3.5 h-3.5" /> PDF
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Analytics e performance consolidados.</p>
        </div>
        <DateFilter />
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="bg-secondary/30 border border-border/30 p-1 rounded-lg">
          <TabsTrigger value="overview" className="text-xs rounded-md data-[state=active]:bg-background">Visão Geral</TabsTrigger>
          <TabsTrigger value="crm" className="text-xs rounded-md data-[state=active]:bg-background">CRM & Vendas</TabsTrigger>
          <TabsTrigger value="lp" className="text-xs rounded-md data-[state=active]:bg-background">Landing Pages</TabsTrigger>
          <TabsTrigger value="quizzes" className="text-xs rounded-md data-[state=active]:bg-background">Quizzes</TabsTrigger>
          <TabsTrigger value="whatsapp" className="text-xs rounded-md data-[state=active]:bg-background">WhatsApp</TabsTrigger>
        </TabsList>

        {/* ═══ OVERVIEW ═══ */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Receita" value={`R$ ${stats.revenue.toLocaleString("pt-BR")}`} icon={DollarSign} color="text-emerald-500" />
            <KPICard label="Total de Leads" value={stats.totalLeads} icon={Users} color="text-blue-500" />
            <KPICard label="Conversão" value={`${stats.conversionRate}%`} icon={Target} color="text-amber-500" />
            <KPICard label="Ticket Médio" value={`R$ ${stats.avgTicket.toLocaleString("pt-BR")}`} icon={TrendingUp} color="text-primary" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 p-5 rounded-xl border border-border/40 bg-secondary/10">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">Atividade Diária</h3>
              <ResponsiveContainer width="100%" height={280}>
                <ComposedChart data={stats.dailyChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                  <Tooltip {...chartTooltipStyle} />
                  <Area type="monotone" dataKey="views" fill="hsl(var(--primary) / 0.15)" stroke="hsl(var(--primary))" name="Views" />
                  <Line type="monotone" dataKey="leads" stroke="#10b981" strokeWidth={2} name="Leads" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div className="p-5 rounded-xl border border-border/40 bg-secondary/10">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">Pipeline por Etapa</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={stats.stageChart} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                    {stats.stageChart.map((entry, i) => <Cell key={i} fill={entry.color || '#8884d8'} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-3">
                {stats.stageChart.map(s => (
                  <div key={s.name} className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} /><span className="text-muted-foreground">{s.name}</span></div>
                    <span className="font-mono font-medium">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══ CRM & VENDAS ═══ */}
        <TabsContent value="crm" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Receita (Fechados)" value={`R$ ${stats.revenue.toLocaleString("pt-BR")}`} icon={DollarSign} color="text-emerald-500" />
            <KPICard label="Em Negociação" value={`R$ ${stats.pipelineValue.toLocaleString("pt-BR")}`} icon={Activity} color="text-blue-500" />
            <KPICard label="Conversão" value={`${stats.conversionRate}%`} icon={Target} color="text-amber-500" />
            <KPICard label="Ticket Médio" value={`R$ ${stats.avgTicket.toLocaleString("pt-BR")}`} icon={TrendingUp} color="text-primary" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-border/40 bg-secondary/10">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">Volume vs. Valor por Etapa</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.stageChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} name="Valor (R$)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-5 rounded-xl border border-border/40 bg-secondary/10">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">Top Leads</h3>
              <div className="space-y-3">
                {stats.topLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-background/50 border border-border/20">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-semibold text-xs">{lead.name?.[0]}</div>
                      <div>
                        <p className="text-xs font-semibold">{lead.name}</p>
                        <p className="text-[10px] text-muted-foreground">{lead.company || '—'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary">R$ {Number(lead.deal_value || 0).toLocaleString("pt-BR")}</p>
                      <span className="text-[9px] font-medium text-muted-foreground">{stages?.find(s => s.id === lead.stage_id)?.name}</span>
                    </div>
                  </div>
                ))}
                {stats.topLeads.length === 0 && <p className="text-center text-muted-foreground text-xs py-8">Nenhum lead no período.</p>}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ═══ LANDING PAGES ═══ */}
        <TabsContent value="lp" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Visitantes Únicos" value={stats.uniqueVisits} icon={Eye} color="text-blue-500" />
            <KPICard label="Visualizações" value={stats.totalPageViews} icon={Activity} color="text-cyan-500" />
            <KPICard label="Cliques em CTAs" value={stats.totalClicks} icon={MousePointerClick} color="text-amber-500" />
            <KPICard label="CTR" value={`${stats.clickThroughRate}%`} icon={Gauge} color="text-purple-500" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl border border-border/40 bg-secondary/10">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">Tráfego Diário</h3>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={stats.dailyChart}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                  <Tooltip {...chartTooltipStyle} />
                  <Area type="monotone" dataKey="views" stroke="hsl(var(--primary))" fill="url(#viewsGrad)" strokeWidth={2} name="Views" />
                  <Area type="monotone" dataKey="clicks" stroke="#f59e0b" fill="transparent" strokeWidth={2} strokeDasharray="4 4" name="Cliques" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="p-5 rounded-xl border border-border/40 bg-secondary/10">
              <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">Cliques por CTA</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.ctaClicksData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" width={120} stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} name="Cliques" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </TabsContent>

        {/* ═══ QUIZZES ═══ */}
        <TabsContent value="quizzes" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard label="Quizzes Criados" value={quizzes?.length || 0} icon={ListChecks} color="text-purple-500" />
            <KPICard label="Respostas Totais" value={fSubs.length} icon={Users} color="text-blue-500" />
            <KPICard label="Taxa Média" value={quizzes?.length ? `${((fSubs.length / Math.max(quizzes.length, 1))).toFixed(0)} resp/quiz` : "0"} icon={TrendingUp} color="text-emerald-500" />
          </div>

          <div className="p-5 rounded-xl border border-border/40 bg-secondary/10">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">Respostas por Quiz</h3>
            {quizzes && quizzes.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={quizzes.map(q => ({
                  name: q.title?.substring(0, 20) || 'Quiz',
                  respostas: fSubs.filter(s => s.quiz_id === q.id).length,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                  <Tooltip {...chartTooltipStyle} />
                  <Bar dataKey="respostas" fill="#8b5cf6" radius={[6, 6, 0, 0]} name="Respostas" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground text-xs py-12">Nenhum quiz criado.</p>
            )}
          </div>
        </TabsContent>

        {/* ═══ WHATSAPP ═══ */}
        <TabsContent value="whatsapp" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KPICard label="Cliques em WhatsApp" value={stats.whatsappClicks} icon={MessageCircle} color="text-emerald-500" />
            <KPICard label="Taxa de Conversão" value={stats.totalClicks > 0 ? `${((stats.whatsappClicks / stats.totalClicks) * 100).toFixed(1)}%` : "0%"} icon={Zap} color="text-green-500" />
            <KPICard label="Visitante → WhatsApp" value={stats.uniqueVisits > 0 ? `${((stats.whatsappClicks / stats.uniqueVisits) * 100).toFixed(1)}%` : "0%"} icon={TrendingUp} color="text-lime-500" />
          </div>

          <div className="p-5 rounded-xl border border-border/40 bg-secondary/10">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-4">WhatsApp Cliques por Dia</h3>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={stats.dailyChart}>
                <defs>
                  <linearGradient id="waGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '10px' }} tickLine={false} axisLine={false} />
                <Tooltip {...chartTooltipStyle} />
                <Area type="monotone" dataKey="whatsapp" stroke="#10b981" fill="url(#waGrad)" strokeWidth={2} name="WhatsApp" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboardExpanded;
