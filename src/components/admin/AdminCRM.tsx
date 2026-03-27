import { useState, useMemo, useEffect } from "react";
import { Plus, Loader2, GripVertical, X, MessageSquare, DollarSign, Phone, Mail, MoreVertical, Search, LayoutGrid, List, Trash2, Pencil, Calendar as CalendarIcon, Tag } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useFunnels, useStages, useLeads, useLeadNotes } from "@/hooks/useSupabaseQuery";
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
import { format, isWithinInterval, startOfDay, endOfDay, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

/* ───────── Lead Card ───────── */
const LeadCard = ({ lead, onClick, onEdit, isOverlay = false }: { lead: any; onClick?: () => void; onEdit?: (e: React.MouseEvent) => void; isOverlay?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id, data: { type: "Lead", lead },
  });
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
  const initials = lead.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  return (
    <div ref={setNodeRef} style={style} {...attributes}
      className={`p-3 mb-2 rounded-lg border border-border/30 bg-background cursor-pointer hover:border-primary/30 transition-all group ${isOverlay ? "border-primary shadow-xl scale-[1.02]" : ""}`}
      onClick={onClick}>
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold shrink-0">{initials}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium truncate">{lead.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{lead.email || lead.phone || "—"}</p>
        </div>
        <div className="flex items-center gap-0.5">
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
      {/* Tags, date, value */}
      <div className="mt-2 pt-2 border-t border-border/20 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-primary">R$ {Number(lead.deal_value || 0).toLocaleString("pt-BR")}</span>
          <span className="text-[10px] text-muted-foreground">{format(new Date(lead.created_at), "dd/MM/yy")}</span>
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
const StageColumn = ({ stage, leads, onAddLead, onDeleteStage }: { stage: any; leads: any[]; onAddLead: () => void; onDeleteStage: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id, data: { type: "Stage", stage },
  });
  const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const totalValue = leads.reduce((acc, curr) => acc + Number(curr.deal_value || 0), 0);

  return (
    <div ref={setNodeRef} style={style} className="min-w-[280px] w-[280px] shrink-0 flex flex-col h-full max-h-[calc(100vh-320px)]">
      <div className="flex items-center justify-between mb-3 px-1 group">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div {...listeners} className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
          <h4 className="font-medium text-[13px] truncate">{stage.name}</h4>
          <span className="text-[10px] text-muted-foreground font-mono bg-secondary/50 px-1.5 py-0.5 rounded">{leads.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-medium text-muted-foreground">R$ {totalValue.toLocaleString("pt-BR")}</span>
          <button onClick={onDeleteStage} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all">
            <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 min-h-[120px] rounded-lg bg-secondary/20 p-2">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} onEdit={(e) => { e.stopPropagation(); openEditLead(lead); }} />)}
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
const LeadDetailDrawer = ({ lead, stages, onClose, onEdit }: { lead: any; stages: any[]; onClose: () => void; onEdit: () => void }) => {
  const { data: notes } = useLeadNotes(lead.id);
  const [note, setNote] = useState("");
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
            <button onClick={onEdit} className="p-1.5 hover:bg-secondary rounded-md transition-colors"><Pencil className="w-4 h-4 text-muted-foreground" /></button>
            <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-md transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
              {lead.name?.[0]?.toUpperCase() || "?"}
            </div>
            <div>
              <h2 className="text-base font-semibold">{lead.name}</h2>
              <p className="text-xs text-muted-foreground">{lead.company || "Sem empresa"} · {stageName}</p>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { icon: Mail, label: "Email", value: lead.email },
              { icon: Phone, label: "Telefone", value: lead.phone },
              { icon: DollarSign, label: "Valor", value: `R$ ${Number(lead.deal_value || 0).toLocaleString("pt-BR")}` },
              { icon: CalendarIcon, label: "Entrada", value: format(new Date(lead.created_at), "dd/MM/yyyy HH:mm") },
              { icon: Tag, label: "Origem", value: lead.source || "manual" },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className="text-xs truncate">{value || "—"}</p>
                </div>
              </div>
            ))}
          </div>

          {lead.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {lead.tags.map((t: string) => (
                <span key={t} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary">{t}</span>
              ))}
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold mb-3 flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
              <MessageSquare className="w-3 h-3" /> Notas
            </h4>
            <div className="flex gap-2 mb-3">
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Escreva uma nota..."
                className="flex-1 px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-xs outline-none focus:ring-1 focus:ring-primary/30"
                onKeyDown={(e) => e.key === "Enter" && addNote()} />
              <Button size="sm" onClick={addNote} className="h-8 text-xs">Salvar</Button>
            </div>
            <div className="space-y-2">
              {notes?.map((n) => (
                <div key={n.id} className="p-3 rounded-lg bg-secondary/20 border border-border/20">
                  <p className="text-xs">{n.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-1.5">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
                </div>
              ))}
              {(!notes || notes.length === 0) && <p className="text-center text-muted-foreground text-[11px] py-4">Nenhuma nota.</p>}
            </div>
          </div>
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
  const [newLeadForm, setNewLeadForm] = useState({ name: "", email: "", phone: "", company: "", deal_value: "", tags: "" });

  const [editLeadOpen, setEditLeadOpen] = useState(false);
  const [editLeadData, setEditLeadData] = useState<any>(null);
  const [editLeadForm, setEditLeadForm] = useState({ name: "", email: "", phone: "", company: "", deal_value: "", tags: "", stage_id: "" });

  const [newStageOpen, setNewStageOpen] = useState(false);
  const [newStageForm, setNewStageForm] = useState({ name: "", color: "#D97757" });

  const [newFunnelOpen, setNewFunnelOpen] = useState(false);
  const [newFunnelForm, setNewFunnelForm] = useState({ name: "", description: "" });

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
    // Date filter
    if (dateRange.from && dateRange.to) {
      result = result.filter(l => {
        const d = new Date(l.created_at);
        return isWithinInterval(d, { start: startOfDay(dateRange.from!), end: endOfDay(dateRange.to!) });
      });
    }
    return result.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [leads, searchQuery, dateRange]);

  /* ── CRUD: Create Funnel ── */
  const createFunnel = async () => {
    if (!newFunnelForm.name.trim()) return toast.error("Nome obrigatório");
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) return toast.error("Usuário não autenticado");
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Usuário não autenticado");
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Usuário não autenticado");
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Usuário não autenticado");
    const tags = newLeadForm.tags ? newLeadForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    const { error } = await supabase.from("leads").insert({
      name: newLeadForm.name, email: newLeadForm.email || null, phone: newLeadForm.phone || null,
      company: newLeadForm.company || null, deal_value: Number(newLeadForm.deal_value) || 0,
      funnel_id: selectedFunnel, stage_id: stageId, sort_order: (leads?.length || 0), tags,
    });
    if (error) return toast.error("Erro ao criar lead: " + error.message);
    qc.invalidateQueries({ queryKey: ["leads", selectedFunnel] });
    setNewLeadOpen(false);
    setNewLeadForm({ name: "", email: "", phone: "", company: "", deal_value: "", tags: "" });
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
    });
    setEditLeadOpen(true);
  };

  const updateLead = async () => {
    if (!editLeadData || !editLeadForm.name.trim()) return toast.error("Nome obrigatório");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Usuário não autenticado");
    const tags = editLeadForm.tags ? editLeadForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [];
    const { error } = await supabase.from("leads").update({
      name: editLeadForm.name, email: editLeadForm.email || null, phone: editLeadForm.phone || null,
      company: editLeadForm.company || null, deal_value: Number(editLeadForm.deal_value) || 0,
      tags, stage_id: editLeadForm.stage_id, updated_at: new Date().toISOString(),
    }).eq("id", editLeadData.id);
    if (error) return toast.error("Erro ao atualizar: " + error.message);
    qc.invalidateQueries({ queryKey: ["leads", selectedFunnel] });
    setEditLeadOpen(false);
    setEditLeadData(null);
    setSelectedLead(null);
    toast.success("Lead atualizado!");
  };

  const deleteLead = async (leadId: string) => {
    if (!confirm("Tem certeza que deseja excluir este lead?")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Usuário não autenticado");
    const { error } = await supabase.from("leads").delete().eq("id", leadId);
    if (error) return toast.error("Erro ao excluir lead: " + error.message);
    qc.invalidateQueries({ queryKey: ["leads", selectedFunnel] });
    setEditLeadOpen(false);
    setEditLeadData(null);
    setSelectedLead(null);
    toast.success("Lead excluído!");
  };

  /* ── CRUD: Delete Funnel ── */
  const deleteFunnel = async (funnelId: string) => {
    if (!confirm("Excluir pipeline e todos os dados?")) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Usuário não autenticado");
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
                  onDeleteStage={() => deleteStage(stage.id)} />
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

      {selectedLead && <LeadDetailDrawer lead={selectedLead} stages={stages || []} onClose={() => setSelectedLead(null)} onEdit={() => openEditLead(selectedLead)} />}

      {/* ── New Lead Modal ── */}
      <Dialog open={newLeadOpen} onOpenChange={setNewLeadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Lead</DialogTitle>
            <DialogDescription>Adicione um lead manualmente à pipeline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Nome *</label>
              <input value={newLeadForm.name} onChange={e => setNewLeadForm(p => ({ ...p, name: e.target.value }))} placeholder="Nome do lead" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Email</label>
                <input value={newLeadForm.email} onChange={e => setNewLeadForm(p => ({ ...p, email: e.target.value }))} placeholder="email@..." className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Telefone</label>
                <input value={newLeadForm.phone} onChange={e => setNewLeadForm(p => ({ ...p, phone: e.target.value }))} placeholder="(11) 99999..." className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Empresa</label>
                <input value={newLeadForm.company} onChange={e => setNewLeadForm(p => ({ ...p, company: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Valor (R$)</label>
                <input type="number" value={newLeadForm.deal_value} onChange={e => setNewLeadForm(p => ({ ...p, deal_value: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tags (separadas por vírgula)</label>
              <input value={newLeadForm.tags} onChange={e => setNewLeadForm(p => ({ ...p, tags: e.target.value }))} placeholder="vip, urgente, web" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Etapa</label>
              <select value={newLeadStageId || ""} onChange={e => setNewLeadStageId(e.target.value)} className={inputCls}>
                {stages?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <Button onClick={createLead} className="w-full">Criar Lead</Button>
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
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Nome *</label>
              <input value={editLeadForm.name} onChange={e => setEditLeadForm(p => ({ ...p, name: e.target.value }))} className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Email</label>
                <input value={editLeadForm.email} onChange={e => setEditLeadForm(p => ({ ...p, email: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Telefone</label>
                <input value={editLeadForm.phone} onChange={e => setEditLeadForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Empresa</label>
                <input value={editLeadForm.company} onChange={e => setEditLeadForm(p => ({ ...p, company: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Valor (R$)</label>
                <input type="number" value={editLeadForm.deal_value} onChange={e => setEditLeadForm(p => ({ ...p, deal_value: e.target.value }))} className={inputCls} />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Tags</label>
              <input value={editLeadForm.tags} onChange={e => setEditLeadForm(p => ({ ...p, tags: e.target.value }))} placeholder="vip, urgente" className={inputCls} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Etapa</label>
              <select value={editLeadForm.stage_id} onChange={e => setEditLeadForm(p => ({ ...p, stage_id: e.target.value }))} className={inputCls}>
                {stages?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="destructive" onClick={() => deleteLead(editLeadData.id)} className="flex-1">Excluir</Button>
              <Button onClick={updateLead} className="flex-[2]">Salvar Alterações</Button>
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
