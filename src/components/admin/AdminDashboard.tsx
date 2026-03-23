import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Eye, MousePointerClick, TrendingUp, Users } from "lucide-react";

const visitData = [
  { day: "Seg", visitas: 45 }, { day: "Ter", visitas: 62 }, { day: "Qua", visitas: 58 },
  { day: "Qui", visitas: 73 }, { day: "Sex", visitas: 89 }, { day: "Sáb", visitas: 34 }, { day: "Dom", visitas: 21 },
];

const clickData = [
  { day: "Seg", cliques: 12 }, { day: "Ter", cliques: 18 }, { day: "Qua", cliques: 15 },
  { day: "Qui", cliques: 22 }, { day: "Sex", cliques: 31 }, { day: "Sáb", cliques: 9 }, { day: "Dom", cliques: 5 },
];

const stats = [
  { icon: Eye, label: "Visitas (7d)", value: "382", color: "text-primary" },
  { icon: MousePointerClick, label: "Cliques CTA", value: "112", color: "text-primary" },
  { icon: TrendingUp, label: "Taxa Conversão", value: "29.3%", color: "text-primary" },
  { icon: Users, label: "Leads WhatsApp", value: "87", color: "text-primary" },
];

const AdminDashboard = () => (
  <div>
    <h2 className="font-display text-2xl font-bold mb-6">Dashboard</h2>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((s) => (
        <div key={s.label} className="glass p-5">
          <s.icon className={`w-5 h-5 ${s.color} mb-2`} />
          <p className="text-2xl font-bold">{s.value}</p>
          <p className="text-xs text-muted-foreground">{s.label}</p>
        </div>
      ))}
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      <div className="glass p-6">
        <h3 className="font-semibold mb-4">Visitas por dia</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={visitData}>
            <XAxis dataKey="day" stroke="hsl(220 10% 55%)" fontSize={12} />
            <YAxis stroke="hsl(220 10% 55%)" fontSize={12} />
            <Tooltip
              contentStyle={{ background: "hsl(220 15% 10%)", border: "1px solid hsl(220 10% 18%)", borderRadius: 8 }}
              labelStyle={{ color: "hsl(45 10% 90%)" }}
            />
            <Bar dataKey="visitas" fill="hsl(45 100% 56%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass p-6">
        <h3 className="font-semibold mb-4">Cliques nos CTAs</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={clickData}>
            <XAxis dataKey="day" stroke="hsl(220 10% 55%)" fontSize={12} />
            <YAxis stroke="hsl(220 10% 55%)" fontSize={12} />
            <Tooltip
              contentStyle={{ background: "hsl(220 15% 10%)", border: "1px solid hsl(220 10% 18%)", borderRadius: 8 }}
              labelStyle={{ color: "hsl(45 10% 90%)" }}
            />
            <Line type="monotone" dataKey="cliques" stroke="hsl(45 100% 56%)" strokeWidth={2} dot={{ fill: "hsl(45 100% 56%)" }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>

    <p className="text-xs text-muted-foreground mt-4">* Dados simulados para demonstração</p>
  </div>
);

export default AdminDashboard;
