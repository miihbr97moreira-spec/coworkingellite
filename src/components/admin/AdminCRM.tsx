import { useState } from "react";
import { Plus, Loader2, GripVertical, X, MessageSquare, DollarSign, Phone, Mail } from "lucide-react";
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
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ---- Lead Card ----
const LeadCard = ({ lead, onClick }: { lead: any; onClick: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: lead.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="glass p-3 mb-2 cursor-pointer hover:border-primary/30 transition-colors" onClick={onClick}>
      <div className="flex items-start gap-2">
        <div {...listeners} className="pt-1 cursor-grab"><GripVertical className="w-3 h-3 text-muted-foreground" /></div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{lead.name}</p>
          {lead.company && <p className="text-xs text-muted-foreground">{lead.company}</p>}
          <div className="flex items-center gap-3 mt-1.5">
            {lead.deal_value > 0 && (
              <span className="text-xs text-primary flex items-center gap-1"><DollarSign className="w-3 h-3" />R$ {Number(lead.deal_value).toLocaleString("pt-BR")}</span>
            )}
            {lead.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</span>}
          </div>
          {lead.tags?.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {lead.tags.map((t: string) => (
                <span key={t} className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-primary/10 text-primary">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---- Lead Detail Modal ----
const LeadDetail = ({ lead, onClose }: { lead: any; onClose: () => void }) => {
  const { data: notes } = useLeadNotes(lead.id);
  const [note, setNote] = useState("");
  const qc = useQueryClient();

  const addNote = async () => {
    if (!note.trim()) return;
    await supabase.from("lead_notes").insert({ lead_id: lead.id, content: note });
    setNote("");
    qc.invalidateQueries({ queryKey: ["lead-notes", lead.id] });
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="glass p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-display text-xl font-bold">{lead.name}</h3>
            {lead.company && <p className="text-sm text-muted-foreground">{lead.company}</p>}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
          {lead.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" />{lead.email}</div>}
          {lead.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" />{lead.phone}</div>}
          {lead.deal_value > 0 && <div className="flex items-center gap-2 text-primary"><DollarSign className="w-4 h-4" />R$ {Number(lead.deal_value).toLocaleString("pt-BR")}</div>}
        </div>

        <div className="border-t border-border pt-4">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Histórico</h4>
          <div className="flex gap-2 mb-3">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Adicionar anotação..." className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground" onKeyDown={(e) => e.key === "Enter" && addNote()} />
            <button onClick={addNote} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Enviar</button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {notes?.map((n) => (
              <div key={n.id} className="p-3 rounded-lg bg-secondary/50 text-sm">
                <p>{n.content}</p>
                <p className="text-xs text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
              </div>
            ))}
          </div>
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
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [showNewLead, setShowNewLead] = useState(false);
  const [newFunnel, setNewFunnel] = useState("");
  const [newStage, setNewStage] = useState("");
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", company: "", deal_value: 0, tags: "" });
  const [addingToStage, setAddingToStage] = useState<string | null>(null);
  const qc = useQueryClient();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  // Auto-select first funnel
  if (funnels?.length && !selectedFunnel) setSelectedFunnel(funnels[0].id);

  const createFunnel = async () => {
    if (!newFunnel.trim()) return;
    const { data, error } = await supabase.from("funnels").insert({ name: newFunnel }).select().single();
    if (error) return toast.error(error.message);
    setNewFunnel("");
    setSelectedFunnel(data.id);
    qc.invalidateQueries({ queryKey: ["funnels"] });
    toast.success("Funil criado!");
  };

  const createStage = async () => {
    if (!newStage.trim() || !selectedFunnel) return;
    await supabase.from("stages").insert({ funnel_id: selectedFunnel, name: newStage, sort_order: (stages?.length ?? 0) });
    setNewStage("");
    qc.invalidateQueries({ queryKey: ["stages", selectedFunnel] });
    toast.success("Etapa criada!");
  };

  const createLead = async () => {
    if (!newLead.name.trim() || !addingToStage || !selectedFunnel) return;
    await supabase.from("leads").insert({
      funnel_id: selectedFunnel,
      stage_id: addingToStage,
      name: newLead.name,
      email: newLead.email || null,
      phone: newLead.phone || null,
      company: newLead.company || null,
      deal_value: newLead.deal_value || 0,
      tags: newLead.tags ? newLead.tags.split(",").map((t) => t.trim()) : [],
    });
    setNewLead({ name: "", email: "", phone: "", company: "", deal_value: 0, tags: "" });
    setShowNewLead(false);
    setAddingToStage(null);
    qc.invalidateQueries({ queryKey: ["leads", selectedFunnel] });
    toast.success("Lead criado!");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Check if dropped on a stage column
    const targetStageId = over.id as string;
    const isStage = stages?.some((s) => s.id === targetStageId);
    if (isStage) {
      await supabase.from("leads").update({ stage_id: targetStageId }).eq("id", active.id as string);
      qc.invalidateQueries({ queryKey: ["leads", selectedFunnel] });
    }
  };

  const inputClass = "w-full px-3 py-2 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  if (funnelsLoading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">CRM — Funis de Vendas</h2>
      </div>

      {/* Funnel selector */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {funnels?.map((f) => (
          <button
            key={f.id}
            onClick={() => setSelectedFunnel(f.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedFunnel === f.id ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            {f.name}
          </button>
        ))}
        <div className="flex gap-2">
          <input value={newFunnel} onChange={(e) => setNewFunnel(e.target.value)} placeholder="Novo funil..." className={`${inputClass} w-40`} onKeyDown={(e) => e.key === "Enter" && createFunnel()} />
          <button onClick={createFunnel} className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm"><Plus className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Add stage */}
      {selectedFunnel && (
        <div className="flex gap-2 mb-6">
          <input value={newStage} onChange={(e) => setNewStage(e.target.value)} placeholder="Nova etapa..." className={`${inputClass} w-48`} onKeyDown={(e) => e.key === "Enter" && createStage()} />
          <button onClick={createStage} className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium">+ Etapa</button>
        </div>
      )}

      {/* Kanban board */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages?.map((stage) => {
            const stageLeads = leads?.filter((l) => l.stage_id === stage.id) ?? [];
            return (
              <div key={stage.id} className="min-w-[280px] w-[280px] shrink-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                  <h4 className="font-semibold text-sm">{stage.name}</h4>
                  <span className="text-xs text-muted-foreground ml-auto">{stageLeads.length}</span>
                </div>
                <SortableContext items={stageLeads.map((l) => l.id)} strategy={verticalListSortingStrategy} id={stage.id}>
                  <div className="min-h-[100px] rounded-xl bg-secondary/20 p-2" id={stage.id}>
                    {stageLeads.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
                    ))}
                    <button
                      onClick={() => { setAddingToStage(stage.id); setShowNewLead(true); }}
                      className="w-full py-2 text-xs text-muted-foreground hover:text-primary transition-colors rounded-lg border border-dashed border-border hover:border-primary/30"
                    >
                      + Novo Lead
                    </button>
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>
      </DndContext>

      {/* New lead modal */}
      {showNewLead && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowNewLead(false)}>
          <div className="glass p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-lg font-bold mb-4">Novo Lead</h3>
            <div className="space-y-3">
              <input value={newLead.name} onChange={(e) => setNewLead({ ...newLead, name: e.target.value })} placeholder="Nome *" className={inputClass} />
              <div className="grid grid-cols-2 gap-3">
                <input value={newLead.email} onChange={(e) => setNewLead({ ...newLead, email: e.target.value })} placeholder="Email" className={inputClass} />
                <input value={newLead.phone} onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })} placeholder="Telefone" className={inputClass} />
              </div>
              <input value={newLead.company} onChange={(e) => setNewLead({ ...newLead, company: e.target.value })} placeholder="Empresa" className={inputClass} />
              <input type="number" value={newLead.deal_value || ""} onChange={(e) => setNewLead({ ...newLead, deal_value: Number(e.target.value) })} placeholder="Valor do negócio (R$)" className={inputClass} />
              <input value={newLead.tags} onChange={(e) => setNewLead({ ...newLead, tags: e.target.value })} placeholder="Tags (separadas por vírgula)" className={inputClass} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setShowNewLead(false)} className="flex-1 py-2 rounded-lg border border-border text-sm">Cancelar</button>
              <button onClick={createLead} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Criar Lead</button>
            </div>
          </div>
        </div>
      )}

      {/* Lead detail */}
      {selectedLead && <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} />}
    </div>
  );
};

export default AdminCRM;
