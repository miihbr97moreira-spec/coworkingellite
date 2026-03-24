import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
  AreaChart, Area, PieChart, Pie, Cell, ComposedChart, Legend, CartesianGrid
} from "recharts";
import {
  Eye, MousePointerClick, TrendingUp, Users, Download, Calendar, ArrowUpRight,
  ArrowDownRight, DollarSign, Target, MessageCircle, Zap, Activity, Gauge
} from "lucide-react";
import { useLPEvents, useLeads, useStages } from "@/hooks/useSupabaseQuery";
import jsPDF from "jspdf";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const AdminDashboardExpanded = () => {
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
    // Métricas de Landing Page
    const uniqueVisits = new Set(filteredEvents.filter(e => e.event_type === 'page_view').map(e => e.session_id)).size;
    const totalPageViews = filteredEvents.filter(e => e.event_type === 'page_view').length;
    const totalClicks = filteredEvents.filter(e => e.event_type === 'button_click').length;
    const whatsappClicks = filteredEvents.filter(e => e.event_type === 'button_click' && e.cta_type === 'whatsapp').length;
    const linkClicks = filteredEvents.filter(e => e.event_type === 'button_click' && e.cta_type === 'url').length;

    // Métricas de CRM
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

    // Taxa de conversão de visitantes para leads
    const visitorToLeadRate = uniqueVisits > 0 ? ((totalLeads / uniqueVisits) * 100).toFixed(2) : "0";

    // Gráfico de Leads por Dia
    const dailyData: Record<string, { date: string, leads: number, views: number, clicks: number, whatsapp: number }> = {};
    filteredEvents.forEach(e => {
      const day = format(new Date(e.created_at), "dd/MM");
      if (!dailyData[day]) dailyData[day] = { date: day, leads: 0, views: 0, clicks: 0, whatsapp: 0 };
      if (e.event_type === 'page_view') dailyData[day].views++;
      if (e.event_type === 'button_click') {
        dailyData[day].clicks++;
        if (e.cta_type === 'whatsapp') dailyData[day].whatsapp++;
      }
    });
    filteredLeads.forEach(l => {
      const day = format(new Date(l.created_at), "dd/MM");
      if (!dailyData[day]) dailyData[day] = { date: day, leads: 0, views: 0, clicks: 0, whatsapp: 0 };
      dailyData[day].leads++;
    });

    // Leads por Etapa
    const stageData = stages?.map(s => ({
      name: s.name,
      value: filteredLeads.filter(l => l.stage_id === s.id).length,
      amount: filteredLeads.filter(l => l.stage_id === s.id).reduce((acc, curr) => acc + Number(curr.deal_value || 0), 0),
      color: s.color
    })) || [];

    // Cliques por CTA
    const ctaClicks: Record<string, number> = {};
    filteredEvents.forEach(e => {
      if (e.event_type === 'button_click') {
        ctaClicks[e.cta_label || 'Desconhecido'] = (ctaClicks[e.cta_label || 'Desconhecido'] || 0) + 1;
      }
    });
    const ctaClicksData = Object.entries(ctaClicks).map(([label, count]) => ({
      name: label,
      value: count
    })).sort((a, b) => b.value - a.value).slice(0, 8);

    return {
      // Landing Page Metrics
      uniqueVisits,
      totalPageViews,
      totalClicks,
      whatsappClicks,
      linkClicks,
      visitorToLeadRate,
      clickThroughRate: totalPageViews > 0 ? ((totalClicks / totalPageViews) * 100).toFixed(2) : "0",
      whatsappConversionRate: totalClicks > 0 ? ((whatsappClicks / totalClicks) * 100).toFixed(1) : "0",

      // CRM Metrics
      totalLeads,
      pipelineValue,
      conversionRate,
      avgTicket,

      // Charts
      dailyChart: Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date)),
      stageChart: stageData,
      ctaClicksData,
      topLeads: [...filteredLeads].sort((a, b) => Number(b.deal_value || 0) - Number(a.deal_value || 0)).slice(0, 5)
    };
  }, [filteredLeads, filteredEvents, stages]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Ellite Coworking — Relatório Completo de Performance", 20, 20);
    doc.setFontSize(12);
    const rangeText = dateRange.from && dateRange.to
      ? `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`
      : "Todo o período";
    doc.text(`Período: ${rangeText}`, 20, 30);

    // Landing Page Metrics
    doc.setFontSize(14);
    doc.text("Métricas da Landing Page", 20, 45);
    doc.setFontSize(11);
    doc.text(`Visitantes Únicos: ${stats.uniqueVisits}`, 20, 55);
    doc.text(`Visualizações Totais: ${stats.totalPageViews}`, 20, 62);
    doc.text(`Cliques em Botões: ${stats.totalClicks}`, 20, 69);
    doc.text(`Cliques em WhatsApp: ${stats.whatsappClicks}`, 20, 76);
    doc.text(`Taxa de Cliques: ${stats.clickThroughRate}%`, 20, 83);

    // CRM Metrics
    doc.setFontSize(14);
    doc.text("Métricas de CRM", 20, 100);
    doc.setFontSize(11);
    doc.text(`Total de Leads: ${stats.totalLeads}`, 20, 110);
    doc.text(`Valor em Pipeline: R$ ${stats.pipelineValue.toLocaleString("pt-BR")}`, 20, 117);
    doc.text(`Taxa de Conversão: ${stats.conversionRate}%`, 20, 124);
    doc.text(`Ticket Médio: R$ ${Number(stats.avgTicket).toLocaleString("pt-BR")}`, 20, 131);

    doc.save(`relatorio-ellite-${format(new Date(), "yyyy-MM-dd")}.pdf`);
  };

  const KPICard = ({ label, value, icon: Icon, trend, up, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6 rounded-2xl border border-border/40 hover:border-primary/40 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest mb-2">{label}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${up ? 'text-emerald-500' : 'text-red-500'}`}>
              {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trend}
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 group-hover:scale-110 transition-transform`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard Avançado</h2>
          <p className="text-sm text-muted-foreground mt-1">Métricas completas da Landing Page e CRM integradas.</p>
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
          <Button onClick={exportPDF} variant="outline" className="gap-2 rounded-xl">
            <Download className="w-4 h-4" /> Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards - Landing Page */}
      <div>
        <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-primary">Métricas da Landing Page</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Visitantes Únicos"
            value={stats.uniqueVisits}
            icon={Eye}
            trend="+18%"
            up={true}
            color="text-blue-500"
          />
          <KPICard
            label="Visualizações Totais"
            value={stats.totalPageViews}
            icon={Activity}
            trend="+12%"
            up={true}
            color="text-cyan-500"
          />
          <KPICard
            label="Cliques em Botões"
            value={stats.totalClicks}
            icon={MousePointerClick}
            trend="+24%"
            up={true}
            color="text-amber-500"
          />
          <KPICard
            label="Taxa de Cliques"
            value={`${stats.clickThroughRate}%`}
            icon={Gauge}
            trend="+3.2%"
            up={true}
            color="text-purple-500"
          />
        </div>
      </div>

      {/* KPI Cards - WhatsApp */}
      <div>
        <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-emerald-500">Métricas de WhatsApp</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            label="Cliques em WhatsApp"
            value={stats.whatsappClicks}
            icon={MessageCircle}
            trend="+31%"
            up={true}
            color="text-emerald-500"
          />
          <KPICard
            label="Taxa de Conversão WhatsApp"
            value={`${stats.whatsappConversionRate}%`}
            icon={Zap}
            trend="+5.1%"
            up={true}
            color="text-green-500"
          />
          <KPICard
            label="Visitante → Lead"
            value={`${stats.visitorToLeadRate}%`}
            icon={TrendingUp}
            trend="+2.4%"
            up={true}
            color="text-lime-500"
          />
        </div>
      </div>

      {/* KPI Cards - CRM */}
      <div>
        <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-primary">Métricas de CRM</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total de Leads"
            value={stats.totalLeads}
            icon={Users}
            trend="+15%"
            up={true}
            color="text-blue-500"
          />
          <KPICard
            label="Pipeline"
            value={`R$ ${stats.pipelineValue.toLocaleString("pt-BR")}`}
            icon={DollarSign}
            trend="+22%"
            up={true}
            color="text-emerald-500"
          />
          <KPICard
            label="Taxa de Conversão"
            value={`${stats.conversionRate}%`}
            icon={Target}
            trend="-1.5%"
            up={false}
            color="text-amber-500"
          />
          <KPICard
            label="Ticket Médio"
            value={`R$ ${Number(stats.avgTicket).toLocaleString("pt-BR")}`}
            icon={TrendingUp}
            trend="+8%"
            up={true}
            color="text-primary"
          />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Linha - Leads e Visualizações por Dia */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-2xl border border-border/40"
        >
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Atividade Diária</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={stats.dailyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
              <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Area type="monotone" dataKey="views" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" name="Visualizações" />
              <Line type="monotone" dataKey="leads" stroke="#10b981" strokeWidth={2} name="Leads" />
              <Line type="monotone" dataKey="clicks" stroke="#f59e0b" strokeWidth={2} name="Cliques" />
            </ComposedChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Gráfico de Pizza - Leads por Etapa */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 rounded-2xl border border-border/40"
        >
          <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Distribuição por Etapa</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.stageChart}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.stageChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || '#8884d8'} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Cliques por CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass p-6 rounded-2xl border border-border/40"
      >
        <h3 className="font-bold text-sm uppercase tracking-wider mb-4">Cliques por Botão de CTA</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.ctaClicksData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
            <YAxis stroke="rgba(255,255,255,0.5)" style={{ fontSize: '12px' }} />
            <Tooltip
              contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px' }}
              labelStyle={{ color: '#fff' }}
            />
            <Bar dataKey="value" fill="#fbbf24" radius={[8, 8, 0, 0]} name="Cliques" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default AdminDashboardExpanded;
