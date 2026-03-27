import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  MessageSquare,
  Users,
  Zap,
  TrendingUp,
  Calendar,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import TooltipHelp from "@/components/ui/tooltip-help";

interface AnalyticsProps {
  onBack: () => void;
}

const Analytics: React.FC<AnalyticsProps> = ({ onBack }) => {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("30d");

  const [metrics, setMetrics] = useState({
    totalMessages: 0,
    totalContacts: 0,
    totalLeads: 0,
    activeAutomations: 0,
    automationSuccess: 0,
    avgResponseTime: 0,
  });

  const [chartData, setChartData] = useState({
    messagesPerDay: [],
    automationTriggers: [],
    leadSources: [],
    agentPerformance: [],
  });

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("organizations")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (data) {
          setOrganizationId(data.id);
          await loadAnalytics(data.id);
        }
      } catch (err) {
        console.error("Erro ao carregar organização:", err);
        toast.error("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    loadOrganization();
  }, []);

  const loadAnalytics = async (orgId: string) => {
    try {
      const daysAgo = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      // Total de mensagens
      const { count: messageCount } = await supabase
        .from("messages")
        .select("*", { count: "exact" })
        .eq("organization_id", orgId)
        .gte("created_at", startDate.toISOString());

      // Total de contatos
      const { count: contactCount } = await supabase
        .from("contacts")
        .select("*", { count: "exact" })
        .eq("organization_id", orgId);

      // Total de leads
      const { count: leadCount } = await supabase
        .from("leads")
        .select("*", { count: "exact" })
        .eq("organization_id", orgId);

      // Automações ativas
      const { count: automationCount } = await supabase
        .from("chat_automations")
        .select("*", { count: "exact" })
        .eq("organization_id", orgId)
        .eq("is_active", true);

      // Mensagens por dia
      const { data: messagesData } = await supabase
        .from("messages")
        .select("created_at")
        .eq("organization_id", orgId)
        .gte("created_at", startDate.toISOString());

      const messagesPerDay = aggregateByDay(messagesData || []);

      // Fontes de leads
      const { data: leadsData } = await supabase
        .from("leads")
        .select("source")
        .eq("organization_id", orgId);

      const leadSources = aggregateLeadSources(leadsData || []);

      setMetrics({
        totalMessages: messageCount || 0,
        totalContacts: contactCount || 0,
        totalLeads: leadCount || 0,
        activeAutomations: automationCount || 0,
        automationSuccess: 85, // Placeholder
        avgResponseTime: 2.5, // Placeholder em minutos
      });

      setChartData({
        messagesPerDay,
        automationTriggers: generateAutomationTriggers(),
        leadSources,
        agentPerformance: generateAgentPerformance(),
      });
    } catch (err) {
      console.error("Erro ao carregar analytics:", err);
      toast.error("Erro ao carregar métricas");
    }
  };

  const aggregateByDay = (messages: any[]) => {
    const grouped: Record<string, number> = {};

    messages.forEach((msg) => {
      const date = new Date(msg.created_at).toLocaleDateString("pt-BR");
      grouped[date] = (grouped[date] || 0) + 1;
    });

    return Object.entries(grouped)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14); // Últimos 14 dias
  };

  const aggregateLeadSources = (leads: any[]) => {
    const grouped: Record<string, number> = {};

    leads.forEach((lead) => {
      const source = lead.source || "Desconhecido";
      grouped[source] = (grouped[source] || 0) + 1;
    });

    return Object.entries(grouped).map(([name, value]) => ({ name, value }));
  };

  const generateAutomationTriggers = () => [
    { name: "Mensagem Recebida", value: 450 },
    { name: "Palavra-chave", value: 320 },
    { name: "Primeira Mensagem", value: 180 },
    { name: "Regex", value: 95 },
    { name: "Tipo de Mídia", value: 60 },
  ];

  const generateAgentPerformance = () => [
    { name: "Agente 1", conversas: 145, taxa_sucesso: 92 },
    { name: "Agente 2", conversas: 128, taxa_sucesso: 88 },
    { name: "Agente 3", conversas: 97, taxa_sucesso: 85 },
    { name: "Agente 4", conversas: 76, taxa_sucesso: 91 },
  ];

  const COLORS = ["#D97757", "#E8A87C", "#F0B89F", "#F8C8C2", "#FFD9D3"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#D97757]" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={onBack} variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#D97757]/20 to-[#D97757]/10 border border-[#D97757]/30">
                <TrendingUp className="w-6 h-6 text-[#D97757]" />
              </div>
              Analytics & Dashboard
              <TooltipHelp content="Métricas completas de conversas, automações, agentes IA e leads." />
            </h1>
          </div>
        </div>

        <div className="flex gap-2">
          {(["7d", "30d", "90d"] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? "default" : "outline"}
              onClick={() => setPeriod(p)}
              className={period === p ? "bg-[#D97757]" : ""}
            >
              {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "90 dias"}
            </Button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#D97757]" />
              Total de Mensagens
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">+12% vs período anterior</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="w-4 h-4 text-[#D97757]" />
              Contatos Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.totalContacts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">+8% vs período anterior</p>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#D97757]" />
              Automações Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{metrics.activeAutomations}</div>
            <p className="text-xs text-muted-foreground mt-1">Taxa de sucesso: {metrics.automationSuccess}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mensagens por dia */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Mensagens por Dia</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.messagesPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#D97757"
                  strokeWidth={2}
                  dot={{ fill: "#D97757", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Automações por gatilho */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Automações por Gatilho</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.automationTriggers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Bar dataKey="value" fill="#D97757" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fontes de leads */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Fontes de Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.leadSources}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.leadSources.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                  labelStyle={{ color: "#fff" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance de agentes */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg">Performance de Agentes IA</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.agentPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                  labelStyle={{ color: "#fff" }}
                />
                <Legend />
                <Bar dataKey="conversas" fill="#D97757" radius={[8, 8, 0, 0]} />
                <Bar dataKey="taxa_sucesso" fill="#E8A87C" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default Analytics;
