import { useState, useMemo } from "react";
import { Plus, Loader2, GripVertical, X, MessageSquare, DollarSign, Phone, Mail, MoreVertical, Calendar, Search, Filter, LayoutGrid, List, Trash2, Edit2, Kanban as KanbanIcon, Target, TrendingUp, UserPlus } from "lucide-react";
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
  DragOverlay,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
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
      className={`bg-zinc-900/80 border border-zinc-800/50 p-4 mb-3 rounded-2xl cursor-pointer hover:border-primary/40 hover:bg-zinc-800/50 transition-all group relative shadow-sm ${isOverlay ? 'border-primary shadow-2xl shadow-primary/10 rotate-2 z-50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-800 text-zinc-400 flex items-center justify-center text-xs font-bold shrink-0 border border-zinc-700/50 group-hover:text-primary group-hover:border-primary/30 transition-colors">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-sm text-zinc-200 truncate pr-4 group-hover:text-zinc-100 transition-colors">{lead.name}</p>
            <div {...listeners} className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-zinc-700 rounded">
              <GripVertical className="w-3 h-3 text-zinc-500" />
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              <div className="p-1 rounded bg-emerald-500/10">
                <DollarSign className="w-2.5 h-2.5 text-emerald-400" />
              </div>
              <span className="text-xs font-bold text-zinc-300">
                {Number(lead.deal_value || 0).toLocaleString("pt-BR")}
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5" /> {timeInStage}
            </span>
          </div>

          {lead.tags?.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {lead.tags.map((t: string) => (
                <span key={t} className="px-2 py-0.5 text-[9px] font-bold rounded-md bg-zinc-800 text-zinc-400 uppercase tracking-widest border border-zinc-700/50">{t}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---- Stage Column ----
const StageColumn = ({ stage, leads, onAddLead }: { stage: any; leads: any[]; onAddLead: () => void }) => {
  const { setNodeRef } = useSortable({
    id: stage.id,
    data: { type: 'Stage', stage }
  });

  const totalValue = leads.reduce((acc, curr) => acc + Number(curr.deal_value || 0), 0);

  return (
    <div ref={setNodeRef} className="min-w-[320px] w-[320px] shrink-0 flex flex-col h-full max-h-[calc(100vh-280px)]">
      <div className="flex items-center justify-between mb-5 px-2 group">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(255,255,255,0.2)]" style={{ backgroundColor: stage.color }} />
          <h4 className="font-bold text-xs uppercase tracking-[0.15em] text-zinc-400 truncate">{stage.name}</h4>
          <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-500 font-bold border border-zinc-700/50">{leads.length}</span>
        </div>
        <div className="text-right ml-2">
          <p className="text-[10px] font-black text-zinc-300 tracking-tighter">R$ {totalValue.toLocaleString("pt-BR")}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[200px] rounded-3xl bg-zinc-900/30 p-3 border border-zinc-800/50 backdrop-blur-sm">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={() => {}} />
          ))}
        </SortableContext>
        
        <button
          onClick={onAddLead}
          className="w-full py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-primary hover:bg-primary/5 transition-all rounded-2xl border border-dashed border-zinc-800 hover:border-primary/30 flex items-center justify-center gap-2 mt-2 group"
        >
          <Plus className="w-3 h-3 transition-transform group-hover:rotate-90" /> Adicionar Lead
        </button>
      </div>
    </div>
  );
};

// ---- Main CRM Component ----
const AdminCRM = () => {
  const qc = useQueryClient();
  const { data: funnels, isLoading: loadingFunnels } = useFunnels();
  const [activeFunnelId, setActiveFunnelId] = useState<string | null>(null);
  const { data: stages, isLoading: loadingStages } = useStages(activeFunnelId || undefined);
  const { data: leads, isLoading: loadingLeads } = useLeads(activeFunnelId || undefined);
  
  const [activeLead, setActiveLead] = useState<any>(null);
  const [showAddLead, setShowAddLead] = useState(false);
  const [showAddStage, setShowAddStage] = useState(false);
  const [showAddFunnel, setShowAddFunnel] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useMemo(() => {
    if (funnels?.length && !activeFunnelId) {
      setActiveFunnelId(funnels[0].id);
    }
  }, [funnels]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === 'Lead') {
      const leadId = active.id as string;
      const newStageId = overData?.type === 'Stage' ? over.id as string : (overData?.lead?.stage_id as string);
      
      if (newStageId && activeData.lead.stage_id !== newStageId) {
        // Update in Supabase
        await supabase.from("leads").update({ stage_id: newStageId, updated_at: new Date().toISOString() }).eq("id", leadId);
        qc.invalidateQueries({ queryKey: ["leads"] });
        toast.success("Lead movido com sucesso");
      }
    }
  };

  if (loadingFunnels || loadingStages || loadingLeads) return (
    <div className="flex flex-col items-center justify-center h-96 text-zinc-500 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-[10px] font-bold uppercase tracking-widest">Sincronizando Pipeline...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <KanbanIcon className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Sales Pipeline</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Gestão de Leads</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 mr-2">
            {funnels?.map(f => (
              <button
                key={f.id}
                onClick={() => setActiveFunnelId(f.id)}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeFunnelId === f.id ? 'bg-zinc-800 text-primary shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {f.name}
              </button>
            ))}
            <button onClick={() => setShowAddFunnel(true)} className="p-2 text-zinc-500 hover:text-primary transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <Button onClick={() => setShowAddLead(true)} className="h-11 gap-2 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
            <UserPlus className="w-4 h-4" /> Novo Lead
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="relative">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar min-h-[600px]">
            {stages?.map((stage) => (
              <StageColumn 
                key={stage.id} 
                stage={stage} 
                leads={leads?.filter(l => l.stage_id === stage.id) || []} 
                onAddLead={() => setShowAddLead(true)}
              />
            ))}
            
            <button 
              onClick={() => setShowAddStage(true)}
              className="min-w-[320px] w-[320px] h-[calc(100vh-280px)] rounded-3xl border-2 border-dashed border-zinc-800/50 hover:border-primary/20 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-3 text-zinc-500 group"
            >
              <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Nova Etapa</span>
            </button>
          </div>
        </DndContext>
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/50 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Total de Leads</p>
            <p className="text-xl font-bold text-zinc-100">{leads?.length || 0}</p>
          </div>
        </div>
        <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/50 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Valor em Pipeline</p>
            <p className="text-xl font-bold text-zinc-100">R$ {leads?.reduce((acc, curr) => acc + Number(curr.deal_value || 0), 0).toLocaleString("pt-BR")}</p>
          </div>
        </div>
        <div className="p-6 rounded-3xl bg-zinc-900/30 border border-zinc-800/50 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Ticket Médio</p>
            <p className="text-xl font-bold text-zinc-100">R$ {(leads?.length ? leads.reduce((acc, curr) => acc + Number(curr.deal_value || 0), 0) / leads.length : 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}</p>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default AdminCRM;
