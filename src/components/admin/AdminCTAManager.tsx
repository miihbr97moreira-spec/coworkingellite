import { useState, useEffect, useMemo } from "react";
import { Save, MessageCircle, Loader2, Plus, Trash2, GripVertical, ExternalLink, Smartphone, Mail, Phone, Anchor, Check, X, Palette, LayoutGrid } from "lucide-react";
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
    opacity: isDragging ? 0.5 : 1,
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
    <div ref={setNodeRef} style={style} className="glass p-4 mb-4 group relative flex items-center gap-4 border border-border/40 hover:border-primary/40 transition-all">
      <div {...listeners} className="cursor-grab p-2 hover:bg-secondary rounded-lg transition-colors">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className={`p-3 rounded-xl shrink-0`} style={{ backgroundColor: `${cta.color}20`, color: cta.color }}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-sm truncate">{cta.label}</h4>
          {!cta.active && <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">Inativo</span>}
        </div>
        <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">{cta.destination}</p>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(cta)}><Plus className="w-4 h-4" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onRemove(cta.id)}><Trash2 className="w-4 h-4" /></Button>
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
      toast.success("CTA salvo com sucesso!");
      setEditingCTA(null);
      qc.invalidateQueries({ queryKey: ["cta-buttons"] });
    } catch (error) {
      toast.error("Erro ao salvar CTA.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeCTA = async (id: string) => {
    const { error } = await supabase.from("cta_buttons").delete().eq("id", id);
    if (error) return toast.error("Erro ao remover");
    qc.invalidateQueries({ queryKey: ["cta-buttons"] });
    toast.success("CTA removido!");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ctas?.findIndex(c => c.id === active.id);
    const newIndex = ctas?.findIndex(c => c.id === over.id);

    if (oldIndex !== undefined && newIndex !== undefined) {
      const newOrder = arrayMove(ctas!, oldIndex, newIndex);
      // Optimistic update
      qc.setQueryData(["cta-buttons"], newOrder);
      
      // Sync with DB
      for (let i = 0; i < newOrder.length; i++) {
        await supabase.from("cta_buttons").update({ position: i }).eq("id", newOrder[i].id);
      }
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando CTAs...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Central de CTAs</h2>
          <p className="text-muted-foreground text-sm">Gerencie os botões de ação e destinos da landing page.</p>
        </div>
        
        <Button onClick={() => setEditingCTA({ label: "", type: "whatsapp", destination: "", color: "#25D366", active: true, position: ctas?.length || 0 })} className="gap-2 rounded-xl font-bold">
          <Plus className="w-4 h-4" /> Novo Botão
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Lista de CTAs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <LayoutGrid className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Ordem de Exibição</h3>
          </div>
          
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <SortableContext items={ctas?.map(c => c.id) || []} strategy={verticalListSortingStrategy}>
              {ctas?.map((cta) => (
                <SortableCTA key={cta.id} cta={cta} onEdit={setEditingCTA} onRemove={removeCTA} />
              ))}
            </SortableContext>
          </DndContext>

          {(!ctas || ctas.length === 0) && (
            <div className="py-12 border-2 border-dashed border-border/40 rounded-2xl text-center text-muted-foreground">
              Nenhum CTA configurado.
            </div>
          )}
        </div>

        {/* Editor / Preview */}
        <div className="space-y-8">
          {editingCTA ? (
            <div className="glass p-8 animate-in slide-in-from-right-4 duration-300 sticky top-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-lg">{editingCTA.id ? 'Editar CTA' : 'Novo CTA'}</h3>
                <button onClick={() => setEditingCTA(null)} className="p-2 hover:bg-secondary rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={saveCTA} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Label do Botão</label>
                    <input 
                      required
                      value={editingCTA.label}
                      onChange={(e) => setEditingCTA({ ...editingCTA, label: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/40 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Ex: Falar com Vendas"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Tipo</label>
                    <select 
                      value={editingCTA.type}
                      onChange={(e) => setEditingCTA({ ...editingCTA, type: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/40 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="url">Link Externo</option>
                      <option value="email">Email</option>
                      <option value="phone">Telefone</option>
                      <option value="anchor">Âncora (#)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Destino</label>
                  <input 
                    required
                    value={editingCTA.destination}
                    onChange={(e) => setEditingCTA({ ...editingCTA, destination: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/40 text-sm outline-none focus:ring-2 focus:ring-primary/30 font-mono"
                    placeholder={editingCTA.type === 'whatsapp' ? '5511999999999' : 'https://...'}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-2xl border border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: editingCTA.color }} />
                    <span className="text-xs font-bold uppercase tracking-widest">Cor do Botão</span>
                  </div>
                  <input 
                    type="color" 
                    value={editingCTA.color}
                    onChange={(e) => setEditingCTA({ ...editingCTA, color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="active"
                    checked={editingCTA.active}
                    onChange={(e) => setEditingCTA({ ...editingCTA, active: e.target.checked })}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="active" className="text-xs font-bold uppercase tracking-widest cursor-pointer">Botão Ativo</label>
                </div>

                <div className="pt-4 border-t border-border flex gap-3">
                  <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setEditingCTA(null)}>Cancelar</Button>
                  <Button type="submit" disabled={isSaving} className="flex-1 rounded-xl font-bold">
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar CTA
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="glass p-12 flex flex-col items-center justify-center text-center space-y-6 sticky top-8">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                <Smartphone className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-bold text-lg">Preview do Botão</h4>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">Selecione ou crie um CTA para ver como ele aparecerá na sua landing page.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCTAManager;
