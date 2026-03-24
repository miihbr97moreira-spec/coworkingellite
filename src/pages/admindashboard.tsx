import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Eye, MousePointerClick, TrendingUp, Users, Download, Calendar } from "lucide-react";
import { useLPEvents } from "@/hooks/useSupabaseQuery";
import jsPDF from "jspdf";

const AdminDashboard = () => {
  const { data: events } = useLPEvents();
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const stats = useMemo(() => {
    if (!events) return { views: 0, clicks: 0, rate: "0%", leads: 0, dailyViews: [], dailyClicks: [] };

    // Filtragem por data
    const filteredEvents = events.filter((e) => {
      const eventDate = new Date(e.created_at).getTime();
      const start = startDate ? new Date(startDate).getTime() : -Infinity;
      const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
      return eventDate >= start && eventDate <= end;
    });

    const views = filteredEvents.filter((e) => e.event_type === "page_view").length;
    const clicks = filteredEvents.filter((e) => ["cta_click", "plan_click", "whatsapp_click"].includes(e.event_type)).length;
    const rate = views > 0 ? ((clicks / views) * 100).toFixed(1) + "%" : "0%";
    const leads = filteredEvents.filter((e) => e.event_type === "whatsapp_click").length;

    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const viewsByDay: Record<string, number> = {};
    const clicksByDay: Record<string, number> = {};
    days.forEach((d) => { viewsByDay[d] = 0; clicksByDay[d] = 0; });

    filteredEvents.forEach((e) => {
      const d = days[new Date(e.created_at).getDay()];
      if (e.event_type === "page_view") viewsByDay[d]++;
      if (["cta_click", "plan_click"].includes(e.event_type)) clicksByDay[d]++;
    });

    return {
      views,
      clicks,
      rate,
      leads,
      dailyViews: days.map((d) => ({ day: d, visitas: viewsByDay[d] })),
      dailyClicks: days.map((d) => ({ day: d, cliques: clicksByDay[d] })),
    };
  }, [events, startDate, endDate]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Ellite Coworking — Relatório", 20, 20);
    doc.setFontSize(12);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 20, 30);
    if(startDate || endDate) doc.text(`Período: ${startDate || 'Início'} até ${endDate || 'Hoje'}`, 20, 37);
    doc.text(`Visitas: ${stats.views}`, 20, 45);
    doc.text(`Cliques CTA: ${stats.clicks}`, 20, 55);
    doc.text(`Taxa de Conversão: ${stats.rate}`, 20, 65);
    doc.text(`Leads WhatsApp: ${stats.leads}`, 20, 75);
    doc.save("ellite-relatorio.pdf");
  };

  const statCards = [
    { icon: Eye, label: "Visitas", value: stats.views.toString() },
    { icon: MousePointerClick, label: "Cliques CTA", value: stats.clicks.toString() },
    { icon: TrendingUp, label: "Taxa Conversão", value: stats.rate },
    { icon: Users, label: "Leads WhatsApp", value: stats.leads.toString() },
  ];

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <h2 className="font-display text-2xl font-bold">Dashboard</h2>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-secondary/50 p-2 rounded-lg border border-border">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent text-xs outline-none"
            />
            <span className="text-muted-foreground text-xs">até</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent text-xs outline-none"
            />
          </div>
          
          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((s) => (
          <div key={s.label} className="glass p-5">
            <s.icon className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass p-6">
          <h3 className="font-semibold mb-4">Visitas por dia</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.dailyViews}>
              <XAxis dataKey="day" stroke="hsl(220 10% 55%)" fontSize={12} />
              <YAxis stroke="hsl(220 10% 55%)" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(220 15% 10%)", border: "1px solid hsl(220 10% 18%)", borderRadius: 8 }} />
              <Bar dataKey="visitas" fill="hsl(45 100% 56%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass p-6">
          <h3 className="font-semibold mb-4">Cliques nos CTAs</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={stats.dailyClicks}>
              <XAxis dataKey="day" stroke="hsl(220 10% 55%)" fontSize={12} />
              <YAxis stroke="hsl(220 10% 55%)" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(220 15% 10%)", border: "1px solid hsl(220 10% 18%)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="cliques" stroke="hsl(45 100% 56%)" strokeWidth={2} dot={{ fill: "hsl(45 100% 56%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};