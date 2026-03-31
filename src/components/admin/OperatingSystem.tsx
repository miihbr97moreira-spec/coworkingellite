import React, { useState } from "react";
import { 
  LayoutDashboard, 
  Zap, 
  DollarSign, 
  Brain, 
  Users, 
  Settings, 
  Layers, 
  X, 
  Maximize2, 
  Minimize2, 
  Bell, 
  Search,
  Activity,
  Calendar,
  Briefcase,
  History,
  FileText,
  Target,
  Menu,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Plus,
  ArrowUpRight,
  Star,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  User,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Power
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

// Importar os módulos criados
import DailyActions from "./DailyActions";
import ExecutionMode from "./ExecutionMode";
import RevenueEngine from "./RevenueEngine";
import IntelligencePanel from "./IntelligencePanel";
import TeamManagement from "./TeamManagement";
import LeadActivityTimeline from "./LeadActivityTimeline";
import AdvancedSettings from "./AdvancedSettings";
import ModularCRM from "./ModularCRM";

const OperatingSystem = () => {
  const [activeModule, setActiveModule] = useState("daily");
  const [isExecutionMode, setIsExecutionMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const menuItems = [
    { id: "daily", label: "Ações do Dia", icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "crm", label: "CRM Operacional", icon: Layers, color: "text-primary", bg: "bg-primary/10" },
    { id: "revenue", label: "Motor de Receita", icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { id: "intelligence", label: "Inteligência", icon: Brain, color: "text-purple-500", bg: "bg-purple-500/10" },
    { id: "team", label: "Gestão de Equipe", icon: Users, color: "text-orange-500", bg: "bg-orange-500/10" },
    { id: "settings", label: "Configurações", icon: Settings, color: "text-slate-500", bg: "bg-slate-500/10" }
  ];

  return (
    <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
      
      {/* Sidebar de Navegação OS */}
      <aside className={`relative flex flex-col bg-[#0A0A0A] border-r border-border/10 transition-all duration-500 ease-in-out ${sidebarCollapsed ? 'w-20' : 'w-72'} shadow-2xl z-40`}>
        {/* Logo OS */}
        <div className="p-8 mb-4">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20 group cursor-pointer hover:rotate-12 transition-transform duration-300">
              <Zap className="w-6 h-6 text-white fill-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                <h1 className="text-xl font-black tracking-tighter uppercase italic leading-none">Omni <span className="text-primary">OS</span></h1>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1">Vendas & Gestão</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Principal */}
        <nav className="flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <TooltipProvider key={item.id} delayDuration={0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setActiveModule(item.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${activeModule === item.id ? 'bg-secondary/10 text-white shadow-inner' : 'text-muted-foreground hover:bg-secondary/5 hover:text-white'}`}
                  >
                    {activeModule === item.id && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-full" />}
                    <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    {!sidebarCollapsed && <span className="text-xs font-black uppercase tracking-widest animate-in fade-in duration-500">{item.label}</span>}
                  </button>
                </TooltipTrigger>
                {sidebarCollapsed && <TooltipContent side="right" className="bg-black border-border/20 text-[10px] font-bold uppercase tracking-widest">{item.label}</TooltipContent>}
              </Tooltip>
            </TooltipProvider>
          ))}
        </nav>

        {/* Botão Modo Execução (CTA Principal) */}
        <div className="p-4 mt-auto">
          <Button 
            onClick={() => setIsExecutionMode(true)}
            className={`w-full h-16 rounded-2xl bg-gradient-to-r from-primary to-orange-600 hover:from-primary/90 hover:to-orange-700 font-black text-xs uppercase tracking-[0.15em] shadow-xl shadow-primary/20 transition-all duration-300 group overflow-hidden ${sidebarCollapsed ? 'px-0' : 'px-6'}`}
          >
            <Zap className={`w-5 h-5 fill-white group-hover:animate-bounce ${sidebarCollapsed ? '' : 'mr-3'}`} />
            {!sidebarCollapsed && <span className="animate-in fade-in duration-500">Modo Execução</span>}
          </Button>
        </div>

        {/* Toggle Sidebar */}
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-border/20 border border-border/10 backdrop-blur-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all z-50 shadow-lg"
        >
          {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Área de Trabalho OS */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#050505] relative overflow-hidden">
        
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        {/* Header OS */}
        <header className="h-24 border-b border-border/5 px-8 flex items-center justify-between backdrop-blur-md bg-black/20 z-30">
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 bg-secondary/10 px-4 py-2 rounded-xl border border-border/10">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input type="text" placeholder="Comando rápido (Alt+K)..." className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-widest w-48 placeholder:text-muted-foreground/50" />
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3 py-1 font-black text-[9px] uppercase tracking-widest">
                <ShieldCheck className="w-3 h-3 mr-1.5" /> Sistema Seguro
              </Badge>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-3 py-1 font-black text-[9px] uppercase tracking-widest animate-pulse">
                Live Pipeline
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-border/10 pr-6">
              <button className="relative p-2 rounded-xl hover:bg-secondary/10 transition-all group">
                <Bell className="w-5 h-5 text-muted-foreground group-hover:text-white" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-black" />
              </button>
              <button className="p-2 rounded-xl hover:bg-secondary/10 transition-all group">
                <Calendar className="w-5 h-5 text-muted-foreground group-hover:text-white" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[10px] font-black uppercase tracking-widest text-white">Gabriel Oliveira</p>
                <p className="text-[9px] font-bold uppercase tracking-widest text-primary">Admin Global</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-secondary/20 border border-border/10 p-0.5 shadow-xl">
                <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center font-black text-sm">GO</div>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo do Módulo Ativo */}
        <ScrollArea className="flex-1 z-20">
          <div className="max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {activeModule === "daily" && <DailyActions onSelectLead={(l) => { setActiveModule("crm"); toast.info(`Lead ${l.name} selecionado`); }} />}
            {activeModule === "crm" && <ModularCRM />}
            {activeModule === "revenue" && <RevenueEngine />}
            {activeModule === "intelligence" && <IntelligencePanel />}
            {activeModule === "team" && <TeamManagement />}
            {activeModule === "settings" && <AdvancedSettings />}
          </div>
        </ScrollArea>

        {/* Barra de Status OS */}
        <footer className="h-10 border-t border-border/5 px-8 flex items-center justify-between bg-black/40 backdrop-blur-xl z-30">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Servidores Online</span>
            </div>
            <div className="h-4 w-[1px] bg-border/10" />
            <div className="flex items-center gap-2">
              <Activity className="w-3 h-3 text-primary" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Sync Supabase: 0.4ms</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">Omni OS v4.2.0-PRO</span>
            <button className="text-muted-foreground hover:text-red-500 transition-colors">
              <Power className="w-3.5 h-3.5" />
            </button>
          </div>
        </footer>
      </main>

      {/* Modo Execução (Full Screen Overlay) */}
      {isExecutionMode && <ExecutionMode onClose={() => setIsExecutionMode(false)} />}
    </div>
  );
};

export default OperatingSystem;
