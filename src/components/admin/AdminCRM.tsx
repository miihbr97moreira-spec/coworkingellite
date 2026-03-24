import { useState, useMemo } from "react";
import { Plus, Loader2, GripVertical, X, MessageSquare, DollarSign, Phone, Mail, MoreVertical, Calendar, Search, Filter, LayoutGrid, List, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useFunnels, useStages, useLeads, useLeadNotes } from "@/hooks/useSupabaseQuery";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  defaultDropAnimationSideEffects,
  DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

// ---- Lead Card ----
const LeadCard = ({ lead, onClick, isOverlay = false }: { lead: any; onClick?: () => void; isOverlay?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: lead.id,
    data: { type: 'Lead', lead }
  });
  
  const style = { 
    transform: CSS.Translate.toString(transform), 
    transition,
    opacity: isDragging ? 0.3 : 1
  };

  const timeInStage = formatDistanceToNow(new Date(lead.updated_at || lead.created_at), { addSuffix: true, locale: ptBR });
  const initials = lead.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      className={`glass p-3 mb-3 cursor-pointer hover:border-primary/40 transition-all group relative ${isOverlay ? 'border-primary shadow-xl rotate-2' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-sm truncate pr-4">{lead.name}</p>
            <div {...listeners} className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs font-bold text-primary">
              R$ {Number(lead.deal_value || 0).toLocaleString("pt-BR")}
            </span>
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" /> {timeInStage}
            </span>
          </div>

          {lead.tags?.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {lead.tags.map((t: string) => (
                <span key={t} className="px-2 py-0.5 text-[9px] font-bold rounded-full bg-primary/10 text-primary uppercase tracking-wider border border-primary/20">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <button className="absolute top-2 right-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-secondary rounded transition-all">
        <MoreVertical className="w-3 h-3 text-muted-foreground" />
      </button>
    </div>
  );
};

// ---- Stage Column ----
const StageColumn = ({ stage, leads, onAddLead }: { stage: any; leads: any[]; onAddLead: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stage.id,
    data: { type: 'Stage', stage }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const totalValue = leads.reduce((acc, curr) => acc + Number(curr.deal_value || 0), 0);

  return (
    <div ref={setNodeRef} style={style} className="min-w-[300px] w-[300px] shrink-0 flex flex-col h-full max-h-[calc(100vh-250px)]">
      <div className="flex items-center justify-between mb-4 px-2 group">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div {...listeners} className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
          <h4 className="font-bold text-sm truncate uppercase tracking-tight">{stage.name}</h4>
          <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded-md text-muted-foreground font-mono">{leads.length}</span>
        </div>
        <div className="text-right ml-2">
          <p className="text-[10px] font-bold text-primary/80">R$ {totalValue.toLocaleString("pt-BR")}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar min-h-[150px] rounded-xl bg-secondary/10 p-2 border border-border/40">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => {}} />
          ))}
        </SortableContext>
        
        <button
          onClick={onAddLead}
          className="w-full py-3 text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all rounded-lg border border-dashed border-border/60 hover:border-primary/40 flex items-center justify-center gap-2 mt-2"
        >
          <Plus className="w-3 h-3" /> Adicionar Lead
        </button>
      </div>
    </div>
  );
};

// ---- Lead Detail Drawer (Lateral) ----
const LeadDetailDrawer = ({ lead, onClose }: { lead: any; onClose: () => void }) => {
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

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-background border-l border-border shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="font-display text-xl font-bold">Detalhes do Lead</h3>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <section>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold">
                {lead.name[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{lead.name}</h2>
                <p className="text-muted-foreground">{lead.company || 'Sem empresa'}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="glass p-4 flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-lg"><Mail className="w-4 h-4 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Email</p>
                  <p className="text-sm truncate">{lead.email || '—'}</p>
                </div>
              </div>
              <div className="glass p-4 flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-lg"><Phone className="w-4 h-4 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Telefone</p>
                  <p className="text-sm truncate">{lead.phone || '—'}</p>
                </div>
              </div>
              <div className="glass p-4 flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-lg"><DollarSign className="w-4 h-4 text-primary" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Valor do Negócio</p>
                  <p className="text-sm font-bold">R$ {Number(lead.deal_value || 0).toLocaleString("pt-BR")}</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-wider"><MessageSquare className="w-4 h-4 text-primary" /> Notas e Histórico</h4>
            <div className="flex gap-2 mb-6">
              <input 
                value={note} 
                onChange={(e) => setNote(e.target.value)} 
                placeholder="Escreva uma nota..." 
                className="flex-1 px-4 py-2 rounded-xl bg-secondary border border-border text-sm focus:ring-2 focus:ring-primary/30 outline-none" 
                onKeyDown={(e) => e.key === "Enter" && addNote()} 
              />
              <button onClick={addNote} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity">Salvar</button>
            </div>
            <div className="space-y-4">
              {notes?.map((n) => (
                <div key={n.id} className="p-4 rounded-2xl bg-secondary/30 border border-border/40 relative group">
                  <p className="text-sm leading-relaxed">{n.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-2 font-mono">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
                </div>
              ))}
              {(!notes || notes.length === 0) && <p className="text-center text-muted-foreground text-sm py-8 italic">Nenhuma nota registrada.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// ---- Main CRM ----
const AdminCRM = () => {
  const { data: funnels, isLoading: funnelsLoading } = useFunnels();
  const [selectedFunnel, setSelectedFunnel] = useState<string | null>(null);
  const { data: stages } = useStages(selectedFunnel);
  const { data: leads } = useLeads(selectedFunnel);
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'Lead' | 'Stage' | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  
  // Modais
  const [showNewLead, setShowNewLead] = useState(false);
  const [showNewStage, setShowNewStage] = useState(false);
  const [showNewFunnel, setShowNewFunnel] = useState(false);
  const [addingToStage, setAddingToStage] = useState<string | null>(null);
  
  // Form states
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", company: "", deal_value: 0, tags: "" });
  const [newStage, setNewStage] = useState({ name: "", color: "#3B82F6" });
  const [newFunnel, setNewFunnel] = useState({ name: "", description: "" });
  
  const qc = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // Auto-select first funnel
  if (funnels?.length && !selectedFunnel) setSelectedFunnel(funnels[0].id);

  const filteredLeads = useMemo(() => {
    if (!leads) return [];
    return leads.filter(l => 
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      l.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()))
    ).sort((a, b) => (a.position || 0) - (b.position || 0));
  }, [leads, searchQuery]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    setActiveType(active.data.current?.type);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || activeType !== 'Lead') return;
    // Lógica de DragOver para feedback visual imediato (opcional)
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over) return;

    if (activeType === 'Lead') {
      const activeId = active.id as string;
      const overId = over.id as string;
      
      const overLead = leads?.find(l => l.id === overId);
      const overStage = stages?.find(s => s.id === overId);
      
      const targetStageId = overLead ? overLead.stage_id : (overStage ? overStage.id : null);
      
      if (targetStageId) {
        const { error } = await supabase.from("leads").update({ 
          stage_id: targetStageId,
          updated_at: new Date().toISOString()
        }).eq("id", activeId);
        
        if (error) toast.error("Erro ao mover lead");
        qc.invalidateQueries({ queryKey: ["leads", selectedFunnel] });
      }
    } else if (activeType === 'Stage') {
      const oldIndex = stages?.findIndex(s => s.id === active.id);
      const newIndex = stages?.findIndex(s => s.id === over.id);
      
      if (oldIndex !== undefined && newIndex !== undefined && oldIndex !== newIndex) {
        const newStages = arrayMove(stages!, oldIndex, newIndex);
        for (let i = 0; i < newStages.length; i++) {
          await supabase.from("stages").update({ position: i }).eq("id", newStages[i].id);
        }
        qc.invalidateQueries({ queryKey: ["stages", selectedFunnel] });
      }
    }
  };

  const createLead = async () => {
    if (!newLead.name.trim() || !addingToStage || !selectedFunnel) return;
    const { error } = await supabase.from("leads").insert({
      funnel_id: selectedFunnel,
      stage_id: addingToStage,
      name: newLead.name,
      email: newLead.email || null,
      phone: newLead.phone || null,
      company: newLead.company || null,
      deal_value: newLead.deal_value || 0,
      tags: newLead.tags ? newLead.tags.split(",").map((t) => t.trim()) : [],
      position: (filteredLeads.filter(l => l.stage_id === addingToStage).length)
    });
    if (error) return toast.error(error.message);
    setNewLead({ name: "", email: "", phone: "", company: "", deal_value: 0, tags: "" });
    setShowNewLead(false);
    setAddingToStage(null);
    qc.invalidateQueries({ queryKey: ["leads", selectedFunnel] });
    toast.success("Lead criado!");
  };

  const createStage = async () => {
    if (!newStage.name.trim() || !selectedFunnel) return;
    const { error } = await supabase.from("stages").insert({
      funnel_id: selectedFunnel,
      name: newStage.name,
      color: newStage.color,
      position: (stages?.length ?? 0)
    });
    if (error) return toast.error(error.message);
    setNewStage({ name: "", color: "#3B82F6" });
    setShowNewStage(false);
    qc.invalidateQueries({ queryKey: ["stages", selectedFunnel] });
    toast.success("Etapa criada!");
  };

  const createFunnel = async () => {
    if (!newFunnel.name.trim()) return;
    const { data, error } = await supabase.from("funnels").insert({
      name: newFunnel.name,
      description: newFunnel.description
    }).select().single();
    if (error) return toast.error(error.message);
    setNewFunnel({ name: "", description: "" });
    setShowNewFunnel(false);
    setSelectedFunnel(data.id);
    qc.invalidateQueries({ queryKey: ["funnels"] });
    toast.success("Funil criado!");
  };

  const inputClass = "w-full px-4 py-2 rounded-xl bg-secondary/50 border border-border/40 text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all";

  if (funnelsLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando CRM...</div>;

  return (
    <div className="h-full flex flex-col">
      {/* Barra Superior do CRM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <h2 className="font-display text-3xl font-bold tracking-tight">Pipeline</h2>
          <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/40">
            <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}><List className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-1 max-w-2xl justify-end">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar leads, tags..." 
              className={inputClass + " pl-10"}
            />
          </div>
          <Button variant="outline" className="gap-2 rounded-xl"><Filter className="w-4 h-4" /> Filtros</Button>
          <Button onClick={() => { setAddingToStage(stages?.[0]?.id || null); setShowNewLead(true); }} className="gap-2 rounded-xl font-bold"><Plus className="w-4 h-4" /> Novo Lead</Button>
        </div>
      </div>

      {/* Funnel Selector */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
        {funnels?.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFunnel(f.id)}
            className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${
              selectedFunnel === f.id ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" : "bg-secondary/40 text-muted-foreground border-border/40 hover:border-primary/30"
            }`}
          >
            {f.name}
          </button>
        ))}
        <button onClick={() => setShowNewFunnel(true)} className="p-2 rounded-full border border-dashed border-border hover:border-primary/40 text-muted-foreground transition-all"><Plus className="w-4 h-4" /></button>
      </div>

      {/* Kanban Board */}
      {viewMode === 'kanban' ? (
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCorners} 
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6 overflow-x-auto pb-8 h-full min-h-[500px] custom-scrollbar items-start">
            <SortableContext items={stages?.map(s => s.id) || []} strategy={horizontalListSortingStrategy}>
              {stages?.sort((a, b) => (a.position || 0) - (b.position || 0)).map((stage) => (
                <StageColumn 
                  key={stage.id} 
                  stage={stage} 
                  leads={filteredLeads.filter(l => l.stage_id === stage.id)}
                  onAddLead={() => { setAddingToStage(stage.id); setShowNewLead(true); }}
                />
              ))}
            </SortableContext>
            
            <button onClick={() => setShowNewStage(true)} className="min-w-[200px] h-[150px] rounded-2xl border-2 border-dashed border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground group">
              <div className="p-3 bg-secondary rounded-full group-hover:bg-primary/10 group-hover:text-primary transition-all"><Plus className="w-5 h-5" /></div>
              <span className="text-xs font-bold uppercase tracking-widest">Nova Etapa</span>
            </button>
          </div>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: { active: { opacity: '0.5' } }
            })
          }}>
            {activeId ? (
              activeType === 'Lead' ? (
                <LeadCard lead={leads?.find(l => l.id === activeId)} isOverlay />
              ) : (
                <div className="min-w-[300px] w-[300px] glass p-4 border-primary shadow-2xl rotate-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: stages?.find(s => s.id === activeId)?.color }} />
                    <h4 className="font-bold text-sm uppercase">{stages?.find(s => s.id === activeId)?.name}</h4>
                  </div>
                </div>
              )
            ) : null}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="glass overflow-hidden rounded-2xl border-border/40">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-secondary/30 border-b border-border/40">
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Lead</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Etapa</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Valor</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tags</th>
                <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map(lead => (
                <tr key={lead.id} className="border-b border-border/20 hover:bg-primary/5 transition-colors cursor-pointer" onClick={() => setSelectedLead(lead)}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{lead.name[0]}</div>
                      <div>
                        <p className="text-sm font-bold">{lead.name}</p>
                        <p className="text-[10px] text-muted-foreground">{lead.email || lead.phone || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter" style={{ backgroundColor: `${stages?.find(s => s.id === lead.stage_id)?.color}20`, color: stages?.find(s => s.id === lead.stage_id)?.color }}>
                      {stages?.find(s => s.id === lead.stage_id)?.name}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-mono font-bold">R$ {Number(lead.deal_value || 0).toLocaleString("pt-BR")}</td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {lead.tags?.slice(0, 2).map((t: string) => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-secondary text-[9px] font-bold text-muted-foreground">{t}</span>
                      ))}
                      {lead.tags?.length > 2 && <span className="text-[9px] text-muted-foreground">+{lead.tags.length - 2}</span>}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-2 hover:bg-secondary rounded-lg transition-colors"><MoreVertical className="w-4 h-4 text-muted-foreground" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modais de Criação */}
      {showNewLead && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowNewLead(false)} />
          <div className="relative w-full max-w-md glass p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-6">Novo Lead</h3>
            <div className="space-y-4">
              <input value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} placeholder="Nome *" className={inputClass} />
              <input value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} placeholder="Email" className={inputClass} />
              <input value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} placeholder="Telefone" className={inputClass} />
              <input value={newLead.company} onChange={(e) => setNewLead({ ...newLead, company: e.target.value })} placeholder="Empresa" className={inputClass} />
              <input type="number" value={newLead.deal_value || ""} onChange={(e) => setNewLead({ ...newLead, deal_value: Number(e.target.value) })} placeholder="Valor (R$)" className={inputClass} />
              <input value={newLead.tags} onChange={(e) => setNewLead({ ...newLead, tags: e.target.value })} placeholder="Tags (separadas por vírgula)" className={inputClass} />
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowNewLead(false)}>Cancelar</Button>
                <Button className="flex-1 rounded-xl font-bold" onClick={createLead}>Criar Lead</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewStage && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowNewStage(false)} />
          <div className="relative w-full max-w-md glass p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-6">Nova Etapa</h3>
            <div className="space-y-4">
              <input value={newStage.name} onChange={(e) => setNewStage({ ...newStage, name: e.target.value })} placeholder="Nome da Etapa *" className={inputClass} />
              <div className="flex items-center gap-3 p-4 bg-secondary/30 rounded-2xl border border-border/40">
                <span className="text-xs font-bold uppercase tracking-widest">Cor da Etapa</span>
                <input type="color" value={newStage.color} onChange={(e) => setNewStage({ ...newStage, color: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none" />
              </div>
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowNewStage(false)}>Cancelar</Button>
                <Button className="flex-1 rounded-xl font-bold" onClick={createStage}>Criar Etapa</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showNewFunnel && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowNewFunnel(false)} />
          <div className="relative w-full max-w-md glass p-8 animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-6">Novo Funil</h3>
            <div className="space-y-4">
              <input value={newFunnel.name} onChange={(e) => setNewFunnel({ ...newFunnel, name: e.target.value })} placeholder="Nome do Funil *" className={inputClass} />
              <textarea value={newFunnel.description} onChange={(e) => setNewFunnel({ ...newFunnel, description: e.target.value })} placeholder="Descrição" className={inputClass + " min-h-[100px]"} />
              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowNewFunnel(false)}>Cancelar</Button>
                <Button className="flex-1 rounded-xl font-bold" onClick={createFunnel}>Criar Funil</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lead Detail Drawer */}
      {selectedLead && <LeadDetailDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />}
    </div>
  );
};

export default AdminCRM;
