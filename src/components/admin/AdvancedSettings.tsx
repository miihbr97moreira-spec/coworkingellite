import React, { useState } from "react";
import { 
  Target, 
  Bell, 
  Settings, 
  Plus, 
  Save, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Layers,
  Activity,
  Zap,
  Tag,
  Type,
  List,
  CalendarDays,
  Hash
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

const AdvancedSettings = () => {
  const [goals, setGoals] = useState([
    { id: "1", type: "Vendas (R$)", target: "150000", current: "85000", period: "Mensal" },
    { id: "2", type: "Contatos/Dia", target: "25", current: "18", period: "Diário" },
    { id: "3", type: "Conversão (%)", target: "15", current: "12", period: "Mensal" }
  ]);

  const [customFields, setCustomFields] = useState([
    { id: "1", name: "Setor", type: "Select", options: "Tecnologia, Saúde, Educação" },
    { id: "2", name: "Data de Início", type: "Data", options: "" },
    { id: "3", name: "CNPJ", type: "Texto", options: "" }
  ]);

  const handleSaveGoal = () => {
    toast.success("Metas atualizadas com sucesso!");
  };

  const handleAddField = () => {
    toast.success("Novo campo personalizado adicionado!");
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-black tracking-tighter uppercase italic">Configurações <span className="text-primary">Avançadas</span></h2>
          <p className="text-sm text-muted-foreground">Metas, alertas e campos personalizados do sistema</p>
        </div>
        <Button className="rounded-xl bg-primary hover:bg-primary/90 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20">
          <Save className="w-4 h-4 mr-2" /> Salvar Tudo
        </Button>
      </div>

      <Tabs defaultValue="goals" className="w-full">
        <TabsList className="bg-secondary/10 p-1 rounded-2xl border border-border/5 mb-8">
          <TabsTrigger value="goals" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest">
            <Target className="w-4 h-4 mr-2" /> Metas
          </TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest">
            <Bell className="w-4 h-4 mr-2" /> Alertas
          </TabsTrigger>
          <TabsTrigger value="custom_fields" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-lg font-bold text-xs uppercase tracking-widest">
            <Tag className="w-4 h-4 mr-2" /> Campos Personalizados
          </TabsTrigger>
        </TabsList>

        {/* Painel de Metas */}
        <TabsContent value="goals">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => (
              <Card key={goal.id} className="bg-background/50 border-border/30 shadow-xl overflow-hidden group">
                <CardHeader className="pb-4 border-b border-border/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{goal.type}</CardTitle>
                    <Badge variant="outline" className="font-bold border-primary/20 text-primary">{goal.period}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-end justify-between mb-4">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Progresso</p>
                      <h3 className="text-2xl font-black">{goal.current} <span className="text-sm text-muted-foreground">/ {goal.target}</span></h3>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-primary">{Math.round((Number(goal.current) / Number(goal.target)) * 100)}%</p>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-secondary/30 rounded-full overflow-hidden mb-6">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: `${(Number(goal.current) / Number(goal.target)) * 100}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Meta Alvo</Label>
                      <Input defaultValue={goal.target} className="bg-secondary/5 border-border/10 rounded-xl h-10 font-bold" />
                    </div>
                    <div className="space-y-1.5 flex flex-col justify-end">
                      <Button variant="outline" className="rounded-xl border-border/20 font-bold text-[10px] uppercase tracking-widest h-10 hover:bg-primary/10 hover:text-primary">Atualizar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            <Card className="bg-background/50 border-dashed border-2 border-border/30 shadow-none flex items-center justify-center p-8 hover:bg-secondary/5 transition-all cursor-pointer group">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Adicionar Meta</p>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* Painel de Alertas */}
        <TabsContent value="alerts">
          <Card className="bg-background/50 border-border/30 shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-black uppercase tracking-tight italic">Configuração de <span className="text-primary">Notificações</span></CardTitle>
              <CardDescription>Defina quando o sistema deve alertar você e sua equipe</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Lead Parado", desc: "Alertar quando um lead não tiver atividade por mais de 5 dias.", icon: Clock, color: "text-orange-500" },
                { label: "Tarefa Atrasada", desc: "Notificar imediatamente quando uma tarefa passar do prazo.", icon: AlertCircle, color: "text-red-500" },
                { label: "Novo Lead Capturado", desc: "Alerta em tempo real para novos leads via formulários/API.", icon: Zap, color: "text-blue-500" },
                { label: "Mudança de Estágio", desc: "Notificar o gestor quando um negócio for movido para 'Fechado'.", icon: CheckCircle2, color: "text-emerald-500" }
              ].map((alert, i) => (
                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-secondary/5 border border-border/5 hover:bg-secondary/10 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-background/50 flex items-center justify-center shadow-inner`}>
                      <alert.icon className={`w-6 h-6 ${alert.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight uppercase">{alert.label}</p>
                      <p className="text-xs text-muted-foreground font-medium">{alert.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500 text-white font-bold px-3 py-1 rounded-lg cursor-pointer">Ativo</Badge>
                    <Button variant="ghost" size="icon" className="rounded-full"><Settings className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Campos Personalizados */}
        <TabsContent value="custom_fields">
          <Card className="bg-background/50 border-border/30 shadow-xl">
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black uppercase tracking-tight italic">Campos <span className="text-primary">Dinâmicos</span></CardTitle>
                <CardDescription>Adicione informações específicas ao perfil dos seus leads</CardDescription>
              </div>
              <Button onClick={handleAddField} size="sm" className="rounded-xl bg-primary hover:bg-primary/90 font-bold text-xs uppercase tracking-widest">
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Novo Campo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {customFields.map((field) => (
                  <div key={field.id} className="p-4 rounded-2xl bg-secondary/5 border border-border/5 hover:bg-secondary/10 transition-all flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-background/50 flex items-center justify-center">
                        {field.type === "Texto" && <Type className="w-5 h-5 text-primary" />}
                        {field.type === "Select" && <List className="w-5 h-5 text-blue-500" />}
                        {field.type === "Data" && <CalendarDays className="w-5 h-5 text-emerald-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-black tracking-tight uppercase">{field.name}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{field.type} {field.options && `• ${field.options}`}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary"><Settings className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 p-6 rounded-3xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-black tracking-tight uppercase">Dica Pro</p>
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">Campos personalizados permitem segmentar seus leads com precisão. Use o tipo 'Select' para garantir que os dados sejam padronizados para relatórios.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedSettings;
