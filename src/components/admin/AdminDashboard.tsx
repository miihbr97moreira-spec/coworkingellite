import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Eye, MousePointerClick, TrendingUp, Users, Download, Calendar } from "lucide-react";
import { useLPEvents } from "@/hooks/useSupabaseQuery";
import jsPDF from "jspdf";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const AdminDashboard = () => {
  const { data: events } = useLPEvents();
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    return events.filter((e) => {
      const eventDate = new Date(e.created_at);
      if (dateRange.from && eventDate < dateRange.from) return false;
      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        if (eventDate > toDate) return false;
      }
      return true;
    });
  }, [events, dateRange]);

  const stats = useMemo(() => {
    if (!filteredEvents) return { views: 0, clicks: 0, rate: "0%", leads: 0, dailyViews: [], dailyClicks: [] };

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
  }, [filteredEvents]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("Ellite Coworking — Relatório", 20, 20);
    doc.setFontSize(12);
    const dateRangeText = dateRange.from && dateRange.to
      ? `Período: ${format(dateRange.from, "dd/MM/yyyy", { locale: pt })} a ${format(dateRange.to, "dd/MM/yyyy", { locale: pt })}`
      : `Data: ${new Date().toLocaleDateString("pt-BR")}`;
    doc.text(dateRangeText, 20, 30);
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">Dashboard</h2>
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Calendar className="w-4 h-4" />
                {dateRange.from && dateRange.to
                  ? `${format(dateRange.from, "dd/MM", { locale: pt })} - ${format(dateRange.to, "dd/MM", { locale: pt })}`
                  : "Filtrar por datas"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-4">
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Data Inicial</p>
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.from}
                    onSelect={(date) => setDateRange({ ...dateRange, from: date })}
                    disabled={(date) => dateRange.to ? date > dateRange.to : false}
                  />
                </div>
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Data Final</p>
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.to}
                    onSelect={(date) => setDateRange({ ...dateRange, to: date })}
                    disabled={(date) => dateRange.from ? date < dateRange.from : false}
                  />
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setDateRange({ from: undefined, to: undefined })}
                >
                  Limpar Filtro
                </Button>
              </div>
            </PopoverContent>
          </Popover>
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

export default AdminDashboard;
