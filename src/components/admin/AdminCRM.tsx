import { useState, useMemo, useEffect } from "react";
import { Plus, Loader2, GripVertical, X, MessageSquare, DollarSign, Phone, Mail, MoreVertical, Search, LayoutGrid, List, Trash2, Pencil, Calendar as CalendarIcon, Tag, Flame, Zap, Target, Brain, TrendingUp, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { getScoreGlowClass, getScoreLabel, getScoreColor } from "@/utils/leadScoring";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useFunnels, useStages, useLeads, useLeadNotes } from "@/hooks/useSupabaseQuery";
import DailyActions from "./DailyActions";
import ExecutionMode from "./ExecutionMode";
import RevenueEngine from "./RevenueEngine";
import IntelligencePanel from "./IntelligencePanel";
import LeadActivityTimeline from "./LeadActivityTimeline";
import {
  DndContext, closestCorners, PointerSensor, useSensor, useSensors,
  DragEndEvent, DragOverEvent, DragStartEvent, defaultDropAnimationSideEffects, DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isWithinInterval, startOfDay, endOfDay, subDays, isToday, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ───────── Lead Card ───────── */
const LeadCard = ({ lead, onClick, onEdit, isOverlay = false }: { lead: any; onClick?: () => void; onEdit?: (e: React.MouseEvent) => void; isOverlay?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id, data: { type: "Lead", lead },
  });
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
  const initials = lead.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  const score = lead.lead_score || 0;
  const scoreLabel = getScoreLabel(score);
  const glowClass = getScoreGlowClass(score);
  const scoreColor = getScoreColor(score);
  
  const priorityColors = {
    urgent: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-blue-500",
    low: "bg-slate-400"
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}
      className={`p-3 mb-2 rounded-lg border-l-4 bg-background cursor-pointer transition-all group relative ${isOverlay ? "border-primary shadow-xl scale-[1.02]" : "border-border/40 hover:border-primary/30"} ${
        score >= 80 ? glowClass : ""
      }`}
      style={{ borderLeftColor: priorityColors[lead.priority as keyof typeof priorityColors] || "transparent" }}
      onClick={onClick}>
      
      {/* Indicador sutil de probabilidade */}
      {lead.probability && (
        <div className="absolute top-0 right-0 h-1 bg-primary/10 rounded-tr-lg overflow-hidden w-12">
          <div className="h-full bg-primary/40" style={{ width: `${lead.probability}%` }} />
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">{initials}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-[13px] font-medium truncate">{lead.name}</p>
            {lead.priority === 'urgent' && <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{lead.email || lead.phone || "—"}</p>
        </div>
        <div className="flex items-center gap-0.5">
          {score >= 80 && <Flame className={`w-3.5 h-3.5 ${scoreColor}`} />}
          {onEdit && (
            <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-secondary rounded transition-all">
              <Pencil className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
          <div {...listeners} className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity p-1">
            <GripVertical className="w-3 h-3 text-muted-foreground" />
          </div>
        </div>
      </div>
      {/* Score Badge, Tags, date, value */}
      <div className="mt-2 pt-2 border-t border-border/20 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-primary">R$ {Number(lead.deal_value || 0).toLocaleString("pt-BR")}</span>
          <div className="flex items-center gap-2">
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${score >= 80 ? "bg-red-500/20 text-red-500" : score >= 40 ? "bg-amber-500/20 text-amber-500" : "bg-blue-500/20 text-blue-500"}`}>
              {scoreLabel}
            </span>
            <span className="text-[10px] text-muted-foreground">{format(new Date(lead.created_at), "dd/MM/yy")}</span>
          </div>
        </div>
        {lead.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {lead.tags.slice(0, 3).map((t: string) => (
              <span key={t} className="px-1.5 py-0.5 text-[9px] font-medium rounded-full bg-primary/10 text-primary">{t}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ───────── Stage Column ───────── */
const StageColumn = ({ stage, leads, onAddLead, onDeleteStage, onSelectLead, onEditLead }: { stage: any; leads: any[]; onAddLead: () => void; onDeleteStage: () => void; onSelectLead: (lead: any) => void; onEditLead: (lead: any) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id, data: { type: "Stage", stage },
  });
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const totalValue = leads.reduce((acc, curr) => acc + Number(curr.deal_value || 0), 0);
  const weightedValue = leads.reduce((acc, curr) => acc + (Number(curr.deal_value || 0) * (Number(curr.probability || 50) / 100)), 0);
  // Ordenar leads por score decrescente (Hot leads no topo)
  const sortedLeads = [...leads].sort((a, b) => (b.lead_score || 0) - (a.lead_score || 0));

  return (
    <div ref={setNodeRef} style={style} className="min-w-[300px] w-[300px] shrink-0 flex flex-col h-full max-h-[calc(100vh-320px)] group/stage">
      <div className="flex flex-col mb-4 px-2">
        <div className="flex items-center justify-between group">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div {...listeners} className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity p-0.5">
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
            </div>
            <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" style={{ backgroundColor: stage.color }} />
            <h4 className="font-bold text-[14px] tracking-tight truncate">{stage.name}</h4>
            <span className="text-[10px] font-bold text-muted-foreground bg-secondary/40 px-2 py-0.5 rounded-md">{leads.length}</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover/stage:opacity-100 transition-opacity">
            <button onClick={onAddLead} className="p-1.5 hover:bg-secondary rounded-lg transition-all"><Plus className="w-4 h-4 text-muted-foreground" /></button>
            <button onClick={onDeleteStage} className="p-1.5 hover:bg-destructive/10 rounded-lg transition-all group/del">
              <Trash2 className="w-4 h-4 text-muted-foreground group-hover/del:text-destructive" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-between mt-2 px-1">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest">Bruto</span>
            <span className="text-[11px] font-bold tracking-tight">R$ {totalValue.toLocaleString("pt-BR")}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-widest">Previsão</span>
            <span className="text-[11px] font-bold text-emerald-500 tracking-tight">R$ {weightedValue.toLocaleString("pt-BR")}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 min-h-[120px] rounded-lg bg-secondary/20 p-2">
        <SortableContext items={sortedLeads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {sortedLeads.map((lead) => <LeadCard key={lead.id} lead={lead} onClick={() => onSelectLead(lead)} onEdit={(e) => { e.stopPropagation(); onEditLead(lead); }} />)}
        </SortableContext>
        <button onClick={onAddLead}
          className="w-full py-2.5 text-[11px] font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all rounded-md border border-dashed border-border/40 hover:border-primary/30 flex items-center justify-center gap-1.5 mt-1">
          <Plus className="w-3 h-3" /> Adicionar
        </button>
      </div>
    </div>
  );
};

/* ───────── Lead Detail Drawer ───────── */
const LeadDetailDrawer = ({ lead, stages, onClose, onEdit, onDelete }: { lead: any; stages: any[]; onClose: () => void; onEdit: () => void; onDelete?: () => void }) => {
  const { data: notes } = useLeadNotes(lead.id);
  const [note, setNote] = useState("");
  const [activeTab, setActiveTab] = useState<"details" | "timeline" | "tasks">("details");
  const qc = useQueryClient();

  const addNote = async () => {
    if (!note.trim()) return;
    await supabase.from("lead_notes").insert({ lead_id: lead.id, content: note });
    setNote("");
    qc.invalidateQueries({ queryKey: ["lead-notes", lead.id] });
    toast.success("Nota adicionada");
  };

  const stageName = stages?.find((s: any) => s.id === lead.stage_id)?.name || "—";

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-background border-l border-border flex flex-col h-full animate-in slide-in-from-right duration-200">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold">Detalhes do Lead</h3>
          <div className="flex items-center gap-1">
            <button onClick={onEdit} className="p-1.5 hover:bg-secondary rounded-md transition-colors" title="Editar"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
            {onDelete && <button onClick={onDelete} className="p-1.5 hover:bg-destructive/10 rounded-md transition-colors" title="Excluir"><Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" /></button>}
            <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-md transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="px-5 py-2 border-b border-border bg-background flex items-center gap-6">
          <button onClick={() => setActiveTab("details")} className={`text-[11px] font-bold uppercase tracking-tight py-3 border-b-2 transition-all ${activeTab === "details" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Resumo</button>
          <button onClick={() => setActiveTab("timeline")} className={`text-[11px] font-bold uppercase tracking-tight py-3 border-b-2 transition-all ${activeTab === "timeline" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Histórico</button>
          <button onClick={() => setActiveTab("tasks")} className={`text-[11px] font-bold uppercase tracking-tight py-3 border-b-2 transition-all ${activeTab === "tasks" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>Ações</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {activeTab === "details" && (
            <>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                  {lead.name?.[0]?.toUpperCase() || "?"}
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">{lead.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{stageName}</span>
                    <span className="text-[11px] text-muted-foreground">{lead.company || "Sem empresa"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: DollarSign, label: "Valor", value: `R$ ${Number(lead.deal_value || 0).toLocaleString("pt-BR")}`, color: "text-emerald-500" },
                  { icon: Target, label: "Conversão", value: `${lead.probability || 50}%`, color: "text-blue-500" },
                  { icon: AlertCircle, label: "Prioridade", value: lead.priority || "Média", color: lead.priority === 'urgent' ? 'text-red-500' : 'text-orange-500' },
                  { icon: Tag, label: "Origem", value: lead.source || "Direto", color: "text-purple-500" },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="p-3 rounded-xl bg-secondary/20 border border-border/10">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-3 h-3 ${color}`} />
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{label}</span>
                    </div>
                    <p className="text-xs font-bold">{value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Contato</h4>
                <div className="space-y-2">
                  {[
                    { icon: Mail, label: "Email", value: lead.email },
                    { icon: Phone, label: "Telefone", value: lead.phone },
                    { icon: CalendarIcon, label: "Entrada", value: format(new Date(lead.created_at), "dd MMM yyyy", { locale: ptBR }) },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 text-muted-foreground/60" />
                        <span className="text-xs text-muted-foreground">{label}</span>
                      </div>
                      <span className="text-xs font-medium">{value || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {lead.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {lead.tags.map((t: string) => (
                    <span key={t} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary">{t}</span>
                  ))}
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Últimas Notas</h4>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] uppercase font-bold text-primary" onClick={() => setActiveTab("timeline")}>Ver Todas</Button>
                </div>
                <div className="relative">
                  <div className="flex gap-2 p-1 bg-secondary/20 rounded-xl border border-border/10 focus-within:border-primary/30 transition-all">
                    <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nova nota rápida..."
                      className="flex-1 bg-transparent px-3 py-2 text-xs outline-none"
                      onKeyDown={(e) => e.key === "Enter" && addNote()} />
                    <Button size="sm" onClick={addNote} className="h-8 w-8 p-0 rounded-lg"><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div className="space-y-3">
                  {notes?.slice(0, 3).map((n) => (
                    <div key={n.id} className="group relative pl-4 border-l-2 border-border/20 hover:border-primary/40 transition-colors">
                      <p className="text-xs leading-relaxed">{n.content}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-medium">{format(new Date(n.created_at), "dd MMM, HH:mm", { locale: ptBR })}</p>
                    </div>
                  ))}
                  {(!notes || notes.length === 0) && <p className="text-center text-muted-foreground text-[11px] py-4 bg-secondary/10 rounded-lg border border-dashed border-border/20">Nenhuma nota registrada.</p>}
                </div>
              </div>
            </>
          )}

          {activeTab === "timeline" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Histórico Completo</h4>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-6 text-[9px] uppercase font-bold px-2">Notas</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[9px] uppercase font-bold px-2">Sistema</Button>
                </div>
              </div>
              <LeadActivityTimeline leadId={lead.id} />
            </div>
          )}

          {activeTab === "tasks" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Próximas Ações</h4>
                <Button size="sm" variant="outline" className="h-7 text-[10px] uppercase font-bold">Nova Tarefa</Button>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-lg border border-border/40 bg-secondary/10 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center"><Phone className="w-4 h-4 text-blue-500" /></div>
                  <div className="flex-1">
                    <p className="text-xs font-bold">Ligar para alinhar proposta</p>
                    <p className="text-[10px] text-muted-foreground">Hoje, 14:30</p>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════ Main CRM ═══════ */
const AdminCRM = () => {
  const { data: funnels, isLoading: funnelsLoading } = useFunnels();
  const [selectedFunnel, setSelectedFunnel] = useState<string | null>(null);
  const { data: stages } = useStages(selectedFunnel);
  const { data: leads } = useLeads(selectedFunnel);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<"Lead" | "Stage" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "table">("kanban");
  const [selectedLead, setSelectedLead] = useState<any>(null);

  /* ── Date Range Filter ── */
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined, to: undefined,
  });

  /* ── Modal states ── */
  const [newLeadOpen, setNewLeadOpen] = useState(false);
  const [newLeadStageId, setNewLeadStageId] = useState<string | null>(null);
  const [newLeadForm, setNewLeadForm] = useState({ name: "", email: "", phone: "", company: "", deal_value: "", tags: "", probability: "50", priority: "medium", status: "active" });

  const [editLeadOpen, setEditLeadOpen] = useState(false);
  const [editLeadData, setEditLeadData] = useState<any>(null);
  const [editLeadForm, setEditLeadForm] = useState({ name: "", email: "", phone: "", company: "", deal_value: "", tags: "", stage_id: "", probability: "50", priority: "medium", status: "active" });

  const [newStageOpen, setNewStageOpen] = useState(false);
  const [newStageForm, setNewStageForm] = useState({ name: "", color: "#D97757" });

  const [newFunnelOpen, setNewFunnelOpen] = useState(false);
  const [newFunnelForm, setNewFunnelForm] = useState({ name: "", description: "" });

  const [showDailyActions, setShowDailyActions] = useState(false);
  const [showExecutionMode, setShowExecutionMode] = useState(false);
  const [showRevenueEngine, setShowRevenueEngine] = useState(false);
  const [showIntelligence, setShowIntelligence] = useState(false);
  const [smartFilter, setSmartFilter] = useState<"all" | "today" | "forgotten" | "hot">("all");

  const qc = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    if (funnels?.length && !selectedFunnel) setSelectedFunnel(funnels[0].id);
  }, [funnels, selectedFunnel]);

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    let result = leads.filter(l =>
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    // Smart Filters (Ações do Dia Integradas)
    const now = new Date();
    if (smartFilter === "today") {
      result = result.filter(l => {
        const lastAct = l.last_activity_at ? new Date(l.last_activity_at) : new Date(l.created_at);
        return l.status === 'active' && (isToday(lastAct) || differenceInDays(now, lastAct) <= 1);
      });
    } else if (smartFilter === "forgotten") {
      result = result.filter(l => {
        const lastAct = l.last_activity_at ? new Date(l.last_activity_at) : new Date(l.created_at);
        return l.status === 'active' && differenceInDays(now, lastAct) >= 3;
      });
    } else if (smartFilter === "hot") {
      result = result.filter(l => l.status === 'active' && (l.priority === 'high' || l.priority === 'urgent' || (l.lead_score || 0) >= 80));
    }

    // Date filter
    if (dateRange.from && dateRange.to) {
      result = result.filter(l => {
        const d = new Date(l.created_at);
        return isWithinInterval(d, { start: startOfDay(dateRange.from!), end: endOfDay(dateRange.to!) });
      });
    }
    return result.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [leads, searchQuery, dateRange, smartFilter]);

  /* ── CRUD: Create Funnel ── */
  const createFunnel = async () => {
    if (!newFunnelForm.name.trim()) return toast.error("Nome obrigatório");
    const { data: user } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("funnels").insert({
      name: newFunnelForm.name, description: newFunnelForm.description || null, created_by: user?.user?.id,
    }).select().single();
    if (error) return toast.error("Erro ao criar pipeline: " + error.message);
    const defaults = [
      { name: "Novo", color: "#3B82F6", sort_order: 0 },
      { name: "Qualificado", color: "#F59E0B", sort_order: 1 },
      { name: "Proposta", color: "#8B5CF6", sort_order: 2 },
      { name: "Fechado", color: "#10B981", sort_order: 3 },
    ];
    for (const s of defaults) {
      await supabase.from("stages").insert({ ...s, funnel_id: data.id });
    }
    qc.invalidateQueries({ queryKey: ["funnels"] });
    qc.invalidateQueries({ queryKey: ["stages", data.id] });
    setSelectedFunnel(data.id);
    setNewFunnelOpen(false);
    setNewFunnelForm({ name: "", description: "" });
    toast.success("Pipeline criada!");
  };

  /* ── CRUD: Create Stage ── */
  const createStage = async () => {
    if (!newStageForm.name.trim() || !selectedFunnel) return toast.error("Nome obrigatório");
    const sortOrder = stages?.length || 0;
    const { error } = await supabase.from("stages").insert({
      name: newStageForm.name, color: newStageForm.color, funnel_id: selectedFunnel, sort_order: sortOrder,
    });
    if (error) return toast.error("Erro ao criar etapa: " + error.message);
    qc.invalidateQueries({ queryKey: ["stages", selectedFunnel] });
    setNewStageOpen(false);
    setNewStageForm({ name: "", color: "#D97757" });
    toast.success("Etapa criada!");
  };

  /* ── CRUD: Delete Stage ── */
  const deleteStage = async (stageId: string) => {
    if (!confirm("Excluir esta etapa e todos os leads nela?")) return;
    await supabase.from("leads").delete().eq("stage_id", stageId);
    await supabase.from("stages").delete().eq("id", stageId);
    qc.invalidateQueries({ queryKey: ["stages", selectedFunnel] });
    qc.invalidateQueries({ queryKey: ["leads", selectedFunnel] });
    toast.success("Etapa excluída");
  };

  /* ── CRUD: Create Lead ── */
  const createLead = async () => {
    if (!newLeadForm.name.trim()) return toast.error("Nome obrigatório");
    const stageId = newLeadStageId || stages?.[0]?.id;
    if (!stageId || !selectedFunnel) return toast.error("Selecione uma etapa");
    const tags = newLeadForm.tags ? newLeadForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    const { error } = await supabase.from("leads").insert({
      name: newLeadForm.name, email: newLeadForm.email || null, phone: newLeadForm.phone || null,
      company: newLeadForm.company || null, deal_value: Number(newLeadForm.deal_value) || 0,
      deal_value: Number(newLeadForm.deal_value) || 0,
      // Usando deal_value como principal até sincronização total
      probability: Number(newLeadForm.probability) || 50,
      priority: newLeadForm.priority,
      status: newLeadForm.status,
      funnel_id: selectedFunnel, stage_id: stageId, sort_order: (leads?.length || 0), tags,
    });
    if (error) return toast.error("Erro ao criar lead: " + error.message);
    qc.invalidateQueries({ queryKey: ["leads", selectedFunnel] });
    setNewLeadOpen(false);
    setNewLeadForm({ name: "", email: "", phone: "", company: "", deal_value: "", tags: "", probability: "50", priority: "medium", status: "active" });
    setNewLeadStageId(null);
    toast.success("Lead adicionado!");
  };

  /* ── CRUD: Edit Lead ── */
  const openEditLead = (lead: any) => {
    setEditLeadData(lead);
    setEditLeadForm({
      name: lead.name, email: lead.email || "", phone: lead.phone || "",
      company: lead.company || "", deal_value: String(lead.deal_value || ""),
      tags: (lead.tags || []).join(", "), stage_id: lead.stage_id,
      probability: String(lead.probability || "50"),
      priority: lead.priority || "medium",
      status: lead.status || "active",
    });
    setEditLeadOpen(true);
  };

  const updateLead = async () => {
    if (!editLeadData || !editLeadForm.name.trim()) return toast.error("Nome obrigatório");
    
    const tags = editLeadForm.tags ? editLeadForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    const { error } = await supabase.from("leads").update({
      name: editLeadForm.name, 
      email: editLeadForm.email || null, 
      phone: editLeadForm.phone || null,
      company: editLeadForm.company || null, 
      deal_value: Number(editLeadForm.deal_value) || 0,
      probability: Number(editLeadForm.probability) || 50,
      priority: editLeadForm.priority,
      status: editLeadForm.status,
      tags, 
      stage_id: editLeadForm.stage_id, 
      updated_at: new Date().toISOString(),
    }).eq("id", editLeadData.id);

    if (error) {
      console.error("Update error:", error);
      return toast.error("Erro ao atualizar: " + error.message);
    }

    await qc.invalidateQueries({ queryKey: ["leads", selectedFunnel] });
    setEditLeadOpen(false);
    setEditLeadData(null);
    setSelectedLead(null);
    toast.success("Lead atualizado!");
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm("Tem certeza que deseja excluir este lead?")) return;
    
    const { error } = await supabase.from("leads").delete().eq("id", leadId);
    
    if (error) {
      console.error("Delete error:", error);
      return toast.error("Erro ao excluir lead: " + error.message);
    }

    await qc.invalidateQueries({ queryKey: ["leads", selectedFunnel] });
    setEditLeadOpen(false);
    setEditLeadData(null);
    setSelectedLead(null);
    toast.success("Lead excluído!");
  };

  /* ── CRUD: Delete Funnel ── */
  const deleteFunnel = async (funnelId: string) => {
    if (!confirm("Excluir pipeline e todos os dados?")) return;
    const fStages = stages?.filter(s => s.funnel_id === funnelId) || [];
    for (const s of fStages) {
      await supabase.from("leads").delete().eq("stage_id", s.id);
    }
    await supabase.from("stages").delete().eq("funnel_id", funnelId);
    await supabase.from("funnels").delete().eq("id", funnelId);
    qc.invalidateQueries({ queryKey: ["funnels"] });
    qc.invalidateQueries({ queryKey: ["stages"] });
    qc.invalidateQueries({ queryKey: ["leads"] });
    if (selectedFunnel === funnelId) setSelectedFunnel(null);
    toast.success("Pipeline excluída");
  };

  /* ── Drag & Drop ── */
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setActiveType(event.active.data.current?.type);
  };
  const handleDragOver = (_event: DragOverEvent) => {};
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);
    if (!over) return;

    if (activeType === "Lead") {
      const activeLeadId = active.id as string;
      const overId = over.id as string;
      
      // Encontrar a etapa de destino
      const overLead = leads?.find(l => l.id === overId);
      const overStage = stages?.find(s => s.id === overId);
      const targetStageId = overLead ? overLead.stage_id : (overStage ? overStage.id : null);
      
      if (targetStageId) {
        const { error } = await supabase.from("leads").update({ 
          stage_id: targetStageId, 
          updated_at: new Date().toISOString() 
        }).eq("id", activeLeadId);
        
        if (error) {
          toast.error("Erro ao mover lead: " + error.message);
        } else {
          qc.invalidateQueries({ queryKey: ["leads", selectedFunnel] });
          toast.success("Lead movido!");
        }
      }
    } else if (activeType === "Stage") {
      const oldIndex = stages?.findIndex(s => s.id === active.id);
      const newIndex = stages?.findIndex(s => s.id === over.id);
      
      if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
        const newStages = arrayMove([...(stages || [])], oldIndex, newIndex);
        
        // Atualização otimista no cache seria ideal, mas vamos atualizar no banco
        const updates = newStages.map((s, i) => 
          supabase.from("stages").update({ sort_order: i }).eq("id", s.id)
        );
        
        await Promise.all(updates);
        qc.invalidateQueries({ queryKey: ["stages", selectedFunnel] });
        toast.success("Etapas reordenadas!");
      }
    }
  };

  if (funnelsLoading) return (
    <div className="flex items-center justify-center h-64 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
    </div>
  );

  const totalLeads = filteredLeads.length;
  const totalValue = filteredLeads.reduce((a, l) => a + Number(l.deal_value || 0), 0);

  const inputCls = "w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Pipeline</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{totalLeads} leads · R$ {totalValue.toLocaleString("pt-BR")}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filtros Inteligentes (Ações do Dia Integradas) */}
          <div className="flex items-center bg-secondary/30 p-0.5 rounded-md border border-border/30 mr-2">
            {[
              { id: "all", label: "Todos", icon: List },
              { id: "today", label: "Hoje", icon: Zap, color: "text-blue-500" },
              { id: "hot", label: "Quentes", icon: Flame, color: "text-orange-500" },
              { id: "forgotten", label: "Esquecidos", icon: Clock, color: "text-slate-400" }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSmartFilter(f.id as any)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${smartFilter === f.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <f.icon className={`w-3 h-3 ${smartFilter === f.id ? f.color : ""}`} />
                <span className="hidden sm:inline">{f.label}</span>
              </button>
            ))}
          </div>

          <div className="h-6 w-[1px] bg-border/30 mx-1" />

          {/* Ferramentas Avançadas (Sutis) */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowRevenueEngine(!showRevenueEngine)}
              className={`p-1.5 rounded transition-all ${showRevenueEngine ? "text-emerald-500 bg-emerald-500/10" : "text-muted-foreground hover:text-emerald-500"}`}
              title="Previsão de Receita"
            >
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowIntelligence(!showIntelligence)}
              className={`p-1.5 rounded transition-all ${showIntelligence ? "text-purple-500 bg-purple-500/10" : "text-muted-foreground hover:text-purple-500"}`}
              title="Análise de Saúde"
            >
              <Brain className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setShowExecutionMode(true)}
              className="p-1.5 rounded transition-all text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10"
              title="Focar em Vendas"
            >
              <Target className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar..."
              className="pl-8 pr-3 py-1.5 rounded-md bg-secondary/50 border border-border/30 text-xs w-40 focus:ring-1 focus:ring-primary/30 outline-none" />
          </div>

          {/* Date Range Filter */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                <CalendarIcon className="w-3 h-3" />
                {dateRange.from && dateRange.to
                  ? `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}`
                  : "Período"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">De</p>
                    <Calendar mode="single" selected={dateRange.from} onSelect={(d) => setDateRange(p => ({ ...p, from: d }))} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Até</p>
                    <Calendar mode="single" selected={dateRange.to} onSelect={(d) => setDateRange(p => ({ ...p, to: d }))} />
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="flex-1 text-[10px] h-6" onClick={() => setDateRange({ from: subDays(new Date(), 7), to: new Date() })}>7d</Button>
                  <Button variant="ghost" size="sm" className="flex-1 text-[10px] h-6" onClick={() => setDateRange({ from: subDays(new Date(), 30), to: new Date() })}>30d</Button>
                  <Button variant="outline" size="sm" className="flex-1 text-[10px] h-6" onClick={() => setDateRange({ from: undefined, to: undefined })}>Limpar</Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <div className="flex bg-secondary/50 p-0.5 rounded-md border border-border/30">
            <button onClick={() => setViewMode("kanban")} className={`p-1.5 rounded transition-all ${viewMode === "kanban" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}>
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setViewMode("table")} className={`p-1.5 rounded transition-all ${viewMode === "table" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
          <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={() => { setNewStageOpen(true); }}>
            <Plus className="w-3 h-3" /> Etapa
          </Button>
          <Button size="sm" className="gap-1.5 h-7 text-xs" onClick={() => { setNewLeadStageId(stages?.[0]?.id || null); setNewLeadOpen(true); }}>
            <Plus className="w-3 h-3" /> Lead
          </Button>
        </div>
      </div>

      {/* Seções de Expansão (Condicionais - Refinadas) */}
      {(showRevenueEngine || showIntelligence) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
          {showRevenueEngine && <RevenueEngine />}
          {showIntelligence && <IntelligencePanel />}
        </div>
      )}

      {/* Funnel tabs */}
      <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
        {funnels?.map((f) => (
          <div key={f.id} className="relative group flex items-center">
            <button onClick={() => setSelectedFunnel(f.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                selectedFunnel === f.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              }`}>
              {f.name}
            </button>
            <button onClick={() => deleteFunnel(f.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 transition-all ml-0.5">
              <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        ))}
        <button onClick={() => setNewFunnelOpen(true)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Modo Execução Overlay */}
      {showExecutionMode && <ExecutionMode onClose={() => setShowExecutionMode(false)} />}

      {/* Board */}
      {!selectedFunnel ? (
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <p className="text-sm">Crie uma pipeline para começar</p>
        </div>
      ) : viewMode === "kanban" ? (
        <DndContext sensors={sensors} collisionDetection={closestCorners}
          onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-6 h-full min-h-[400px] items-start">
            <SortableContext items={stages?.map(s => s.id) || []} strategy={horizontalListSortingStrategy}>
              {stages?.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)).map((stage) => (
                <StageColumn key={stage.id} stage={stage}
                  leads={filteredLeads.filter(l => l.stage_id === stage.id)}
                  onAddLead={() => { setNewLeadStageId(stage.id); setNewLeadOpen(true); }}
                  onDeleteStage={() => deleteStage(stage.id)}
                  onSelectLead={setSelectedLead}
                  onEditLead={openEditLead} />
              ))}
            </SortableContext>
            <button onClick={() => setNewStageOpen(true)}
              className="min-w-[160px] h-[100px] rounded-lg border border-dashed border-border/30 hover:border-primary/30 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
              <Plus className="w-4 h-4" />
              <span className="text-[10px] font-medium">Nova Etapa</span>
            </button>
          </div>
          <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: "0.5" } } }) }}>
            {activeId && activeType === "Lead" ? (
              <LeadCard lead={leads?.find(l => l.id === activeId) || { id: activeId, name: "?" }} isOverlay />
            ) : activeId && activeType === "Stage" ? (
              <div className="min-w-[280px] w-[280px] p-3 rounded-lg border border-primary bg-background shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stages?.find(s => s.id === activeId)?.color }} />
                  <h4 className="font-medium text-[13px]">{stages?.find(s => s.id === activeId)?.name}</h4>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="rounded-lg border border-border/30 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/20 bg-secondary/20">
                <th className="p-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Lead</th>
                <th className="p-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Etapa</th>
                <th className="p-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                <th className="p-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                <th className="p-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Tags</th>
                <th className="p-3 text-[10px] font-medium text-muted-foreground uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => (
                <tr key={lead.id} className="border-b border-border/10 hover:bg-secondary/10 transition-colors cursor-pointer" onClick={() => setSelectedLead(lead)}>
                  <td className="p-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold">{lead.name?.[0]}</div>
                      <div>
                        <p className="text-xs font-medium">{lead.name}</p>
                        <p className="text-[10px] text-muted-foreground">{lead.email || lead.phone || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-medium"
                      style={{ backgroundColor: `${stages?.find(s => s.id === lead.stage_id)?.color}15`, color: stages?.find(s => s.id === lead.stage_id)?.color }}>
                      {stages?.find(s => s.id === lead.stage_id)?.name}
                    </span>
                  </td>
                  <td className="p-3 text-xs font-mono">R$ {Number(lead.deal_value || 0).toLocaleString("pt-BR")}</td>
                  <td className="p-3 text-[11px] text-muted-foreground">{format(new Date(lead.created_at), "dd/MM/yy")}</td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      {lead.tags?.slice(0, 2).map((t: string) => (
                        <span key={t} className="px-1.5 py-0.5 rounded-full bg-primary/10 text-[9px] text-primary font-medium">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <button onClick={(e) => { e.stopPropagation(); openEditLead(lead); }}
                      className="p-1.5 hover:bg-secondary rounded-md transition-colors">
                      <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedLead && <LeadDetailDrawer lead={selectedLead} stages={stages || []} onClose={() => setSelectedLead(null)} onEdit={() => openEditLead(selectedLead)} onDelete={() => { deleteLead(selectedLead.id); setSelectedLead(null); }} />}

      {/* ── New Lead Modal ── */}
      <Dialog open={newLeadOpen} onOpenChange={setNewLeadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
            <DialogDescription>Adicione um lead manualmente à pipeline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/10 pb-1">Identificação</h4>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">Nome Completo</label>
                <input value={newLeadForm.name} onChange={e => setNewLeadForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: João Silva" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">Email</label>
                  <input value={newLeadForm.email} onChange={e => setNewLeadForm(p => ({ ...p, email: e.target.value }))} placeholder="email@exemplo.com" className={inputCls} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">Telefone</label>
                  <input value={newLeadForm.phone} onChange={e => setNewLeadForm(p => ({ ...p, phone: e.target.value }))} placeholder="(00) 00000-0000" className={inputCls} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/10 pb-1">Negócio & Prioridade</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">Valor do Deal (R$)</label>
                  <input type="number" value={newLeadForm.deal_value} onChange={e => setNewLeadForm(p => ({ ...p, deal_value: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">Probabilidade (%)</label>
                  <input type="number" value={newLeadForm.probability} onChange={e => setNewLeadForm(p => ({ ...p, probability: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">Prioridade</label>
                  <select value={newLeadForm.priority} onChange={e => setNewLeadForm(p => ({ ...p, priority: e.target.value }))} className={inputCls}>
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">Etapa Inicial</label>
                  <select value={newLeadStageId || ""} onChange={e => setNewLeadStageId(e.target.value)} className={inputCls}>
                    {stages?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <Button onClick={createLead} className="w-full h-10 font-bold uppercase tracking-tight">Criar Lead</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Lead Modal ── */}
      <Dialog open={editLeadOpen} onOpenChange={setEditLeadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Lead</DialogTitle>
            <DialogDescription>Atualize as informações do lead.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/10 pb-1">Identificação</h4>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">Nome Completo</label>
                <input value={editLeadForm.name} onChange={e => setEditLeadForm(p => ({ ...p, name: e.target.value }))} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">Email</label>
                  <input value={editLeadForm.email} onChange={e => setEditLeadForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">Telefone</label>
                  <input value={editLeadForm.phone} onChange={e => setEditLeadForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/10 pb-1">Negócio & Status</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">Valor (R$)</label>
                  <input type="number" value={editLeadForm.deal_value} onChange={e => setEditLeadForm(p => ({ ...p, deal_value: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">Probabilidade (%)</label>
                  <input type="number" value={editLeadForm.probability} onChange={e => setEditLeadForm(p => ({ ...p, probability: e.target.value }))} className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">Prioridade</label>
                  <select value={editLeadForm.priority} onChange={e => setEditLeadForm(p => ({ ...p, priority: e.target.value }))} className={inputCls}>
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1.5">Status</label>
                  <select value={editLeadForm.status} onChange={e => setEditLeadForm(p => ({ ...p, status: e.target.value }))} className={inputCls}>
                    <option value="active">Ativo</option>
                    <option value="won">Ganhos</option>
                    <option value="lost">Perdido</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => deleteLead(editLeadData.id)} className="flex-1 text-destructive hover:bg-destructive/5 hover:text-destructive border-destructive/20 h-10 font-bold uppercase tracking-tight">Excluir</Button>
              <Button onClick={updateLead} className="flex-[2] h-10 font-bold uppercase tracking-tight">Salvar Alterações</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── New Stage Modal ── */}
      <Dialog open={newStageOpen} onOpenChange={setNewStageOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Etapa</DialogTitle>
            <DialogDescription>Adicione uma coluna ao Kanban.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Nome *</label>
              <input value={newStageForm.name} onChange={e => setNewStageForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Qualificação" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Cor</label>
              <input type="color" value={newStageForm.color} onChange={e => setNewStageForm(p => ({ ...p, color: e.target.value }))} className="w-full h-10 rounded-lg cursor-pointer bg-transparent" />
            </div>
            <Button onClick={createStage} className="w-full">Criar Etapa</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── New Pipeline Modal ── */}
      <Dialog open={newFunnelOpen} onOpenChange={setNewFunnelOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nova Pipeline</DialogTitle>
            <DialogDescription>Crie uma nova pipeline de vendas.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Nome *</label>
              <input value={newFunnelForm.name} onChange={e => setNewFunnelForm(p => ({ ...p, name: e.target.value }))} placeholder="Ex: Vendas B2B" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Descrição</label>
              <textarea value={newFunnelForm.description} onChange={e => setNewFunnelForm(p => ({ ...p, description: e.target.value }))} rows={2} className={inputCls + " resize-none"} />
            </div>
            <Button onClick={createFunnel} className="w-full">Criar Pipeline</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCRM;
