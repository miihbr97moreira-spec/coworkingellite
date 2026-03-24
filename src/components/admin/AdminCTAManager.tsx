import { useState } from "react";
import { Save, MessageCircle, Loader2, Plus, Trash2, GripVertical, ExternalLink, Smartphone, Mail, Phone, Anchor, X, LayoutGrid, Link2, MousePointer2, Palette, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";

// ---- Sortable CTA Item ----
const SortableCTA = ({ cta, onEdit, onRemove }: { cta: any; onEdit: (cta: any) => void; onRemove: (id: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: cta.id });
  
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 50 : 0,
  };

  const Icon = {
    whatsapp: MessageCircle,
    url: ExternalLink,
    email: Mail,
    phone: Phone,
    anchor: Anchor
  }[cta.type as 'whatsapp' | 'url' | 'email' | 'phone' | 'anchor'] || ExternalLink;

  return (
    <div ref={setNodeRef} style={style} className="bg-zinc-900/50 border border-zinc-800/50 p-5 mb-4 rounded-2xl group relative flex items-center gap-5 hover:border-primary/30 hover:bg-zinc-800/50 transition-all shadow-sm">
      <div {...listeners} className="cursor-grab p-2 hover:bg-zinc-700 rounded-xl transition-colors text-zinc-600 hover:text-zinc-300">
        <GripVertical className="w-4 h-4" />
      </div>
      
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border border-zinc-800 shadow-inner" style={{ backgroundColor: `${cta.color}10`, color: cta.color }}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <h4 className="font-bold text-sm text-zinc-200 truncate">{cta.label}</h4>
          {!cta.active && <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700/50">Inativo</span>}
        </div>
        <p className="text-[10px] text-zinc-500 truncate font-mono mt-1 tracking-tighter">{cta.destination}</p>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-zinc-400 hover:text-primary hover:bg-primary/10" onClick={() => onEdit(cta)}>
          <Plus className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10" onClick={() => onRemove(cta.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

// ---- Main CTA Manager ----
const AdminCTAManager = () => {
  const qc = useQueryClient();
  const [editingCTA, setEditingCTA] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: ctas, isLoading } = useQuery({
    queryKey: ["cta-buttons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cta_buttons").select("*").order("position");
      if (error) throw error;
      return data;
    },
  });

  const saveCTA = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.from("cta_buttons").upsert(editingCTA);
      if (error) throw error;
      toast.success("Redirecionamento salvo com sucesso!");
      setEditingCTA(null);
      qc.invalidateQueries({ queryKey: ["cta-buttons"] });
    } catch (error) {
      toast.error("Erro ao salvar redirecionamento.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeCTA = async (id: string) => {
    const { error } = await supabase.from("cta_buttons").delete().eq("id", id);
    if (error) return toast.error("Erro ao remover");
    qc.invalidateQueries({ queryKey: ["cta-buttons"] });
    toast.success("Redirecionamento removido!");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ctas?.findIndex(c => c.id === active.id);
    const newIndex = ctas?.findIndex(c => c.id === over.id);

    if (oldIndex !== undefined && newIndex !== undefined) {
      const newOrder = arrayMove(ctas!, oldIndex, newIndex);
      qc.setQueryData(["cta-buttons"], newOrder);
      
      for (let i = 0; i < newOrder.length; i++) {
        await supabase.from("cta_buttons").update({ position: i }).eq("id", newOrder[i].id);
      }
    }
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-96 text-zinc-500 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-[10px] font-bold uppercase tracking-widest">Sincronizando Links...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Link2 className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Redirect Engine</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Links de Redirecionamento</h2>
        </div>
        
        <Button 
          onClick={() => setEditingCTA({ label: "", type: "whatsapp", destination: "", color: "#FBBF24", active: true, position: ctas?.length || 0 })} 
          className="h-11 gap-2 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" /> Novo Link
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* CTA List */}
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <LayoutGrid className="w-4 h-4 text-zinc-500" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Estrutura de Navegação</h3>
          </div>
          
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <SortableContext items={ctas?.map(c => c.id) || []} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {ctas?.map((cta) => (
                  <SortableCTA key={cta.id} cta={cta} onEdit={setEditingCTA} onRemove={removeCTA} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {(!ctas || ctas.length === 0) && (
            <div className="py-20 border-2 border-dashed border-zinc-800/50 rounded-3xl text-center text-zinc-500 bg-zinc-900/20">
              Nenhum link configurado ainda.
            </div>
          )}
        </div>

        {/* Editor / Preview Sidebar */}
        <div className="relative">
          {editingCTA ? (
            <div className="bg-zinc-900/50 border border-zinc-800/50 p-8 rounded-3xl backdrop-blur-sm animate-in slide-in-from-right-8 duration-500 sticky top-28">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-lg text-zinc-100">{editingCTA.id ? 'Editar Link' : 'Novo Link'}</h3>
                </div>
                <button onClick={() => setEditingCTA(null)} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500 hover:text-zinc-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={saveCTA} className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Texto do Botão</label>
                    <input 
                      required
                      value={editingCTA.label}
                      onChange={(e) => setEditingCTA({ ...editingCTA, label: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                      placeholder="Ex: Falar com Vendas"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Tipo de Ação</label>
                    <select 
                      value={editingCTA.type}
                      onChange={(e) => setEditingCTA({ ...editingCTA, type: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 outline-none focus:ring-2 focus:ring-primary/30 transition-all appearance-none"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="url">Link Externo</option>
                      <option value="email">Email</option>
                      <option value="phone">Telefone</option>
                      <option value="anchor">Âncora (#)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Destino Final</label>
                  <input 
                    required
                    value={editingCTA.destination}
                    onChange={(e) => setEditingCTA({ ...editingCTA, destination: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 outline-none focus:ring-2 focus:ring-primary/30 transition-all font-mono"
                    placeholder={editingCTA.type === 'whatsapp' ? '5511999999999' : 'https://...'}
                  />
                </div>

                <div className="flex items-center justify-between p-5 bg-zinc-900/80 rounded-2xl border border-zinc-800">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl border-2 border-zinc-700 shadow-xl transition-transform hover:scale-110" style={{ backgroundColor: editingCTA.color }} />
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-100">Cor Visual</span>
                      <p className="text-[10px] text-zinc-500 font-mono">{editingCTA.color.toUpperCase()}</p>
                    </div>
                  </div>
                  <input 
                    type="color" 
                    value={editingCTA.color}
                    onChange={(e) => setEditingCTA({ ...editingCTA, color: e.target.value })}
                    className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none p-0"
                  />
                </div>

                <div className="flex items-center gap-3 p-1">
                  <button
                    type="button"
                    onClick={() => setEditingCTA({ ...editingCTA, active: !editingCTA.active })}
                    className={`w-10 h-5 rounded-full transition-all relative ${editingCTA.active ? 'bg-primary' : 'bg-zinc-700'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${editingCTA.active ? 'left-6' : 'left-1'}`} />
                  </button>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 cursor-pointer" onClick={() => setEditingCTA({ ...editingCTA, active: !editingCTA.active })}>
                    Status: {editingCTA.active ? 'Ativo' : 'Inativo'}
                  </label>
                </div>

                <div className="pt-6 border-t border-zinc-800 flex gap-4">
                  <Button type="button" variant="ghost" className="flex-1 rounded-xl text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800" onClick={() => setEditingCTA(null)}>Cancelar</Button>
                  <Button type="submit" disabled={isSaving} className="flex-1 rounded-xl font-bold bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Salvar Link
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-zinc-900/30 border border-zinc-800/50 p-12 rounded-3xl backdrop-blur-sm flex flex-col items-center justify-center text-center space-y-8 sticky top-28">
              <div className="w-24 h-24 bg-zinc-800/50 rounded-full flex items-center justify-center text-zinc-600 border border-zinc-800 shadow-inner">
                <MousePointer2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h4 className="font-bold text-lg text-zinc-200">Configurador de Links</h4>
                <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">Selecione um link existente ou crie um novo para gerenciar os redirecionamentos da sua Landing Page.</p>
              </div>
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 max-w-xs">
                <p className="text-[10px] text-primary font-bold uppercase tracking-widest mb-1">Dica de Conversão</p>
                <p className="text-[10px] text-zinc-500 leading-relaxed">Botões com cores contrastantes (como o Amarelo Ellite) tendem a ter 25% mais cliques.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCTAManager;
