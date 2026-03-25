import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Save, MessageCircle, Loader2, Plus, Trash2, GripVertical, ExternalLink,
  Mail, Phone, Anchor, Check, X, Palette, LayoutGrid, Link2, Copy, Eye,
  Settings, AlertCircle, CheckCircle2
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CTA {
  id: string;
  label: string;
  type: "whatsapp" | "url" | "email" | "phone" | "anchor";
  destination: string;
  color: string;
  active: boolean;
  position: number;
  whatsapp_message?: string;
  plan_specific?: boolean;
  plan_messages?: Record<string, string>;
}

// ---- Sortable Link Item ----
const SortableLinkItem = ({ cta, onEdit, onRemove }: { cta: CTA; onEdit: (cta: CTA) => void; onRemove: (id: string) => void }) => {
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
    anchor: Anchor,
  }[cta.type] || ExternalLink;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass p-4 mb-4 group relative flex items-center gap-4 border border-border/40 hover:border-primary/40 transition-all rounded-xl"
    >
      <div {...listeners} className="cursor-grab p-2 hover:bg-secondary rounded-lg transition-colors">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      <div className="p-3 rounded-xl shrink-0" style={{ backgroundColor: `${cta.color}20`, color: cta.color }}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-sm truncate">{cta.label}</h4>
          {!cta.active && (
            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
              Inativo
            </span>
          )}
          {cta.plan_specific && (
            <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/20 text-primary">
              Por Plano
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
          {cta.type === "whatsapp" ? `📱 ${cta.destination}` : cta.destination}
        </p>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(cta)}
        >
          <Settings className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onRemove(cta.id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
};

// ---- Link Editor Dialog ----
const LinkEditorDialog = ({
  cta,
  onSave,
  onClose,
  isLoading,
}: {
  cta: CTA | null;
  onSave: (cta: CTA) => void;
  onClose: () => void;
  isLoading: boolean;
}) => {
  const [formData, setFormData] = useState<CTA>(
    cta || {
      id: "",
      label: "",
      type: "whatsapp",
      destination: "",
      color: "#FBBF24",
      active: true,
      position: 0,
      whatsapp_message: "",
      plan_specific: false,
      plan_messages: {},
    }
  );

  const plans = ["Estação", "Sala Reunião", "Coworking Full"];

  return (
    <Dialog open={!!cta} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Link de Redirecionamento</DialogTitle>
          <DialogDescription>
            Configure o comportamento e mensagens para este botão de CTA
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-wider">Informações Básicas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">
                  Rótulo do Botão
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full p-2 rounded-lg bg-secondary border border-border text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                  placeholder="Ex: Começar Agora"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full p-2 rounded-lg bg-secondary border border-border text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                >
                  <option value="whatsapp">WhatsApp</option>
                  <option value="url">Link Externo</option>
                  <option value="email">Email</option>
                  <option value="phone">Telefone</option>
                  <option value="anchor">Âncora (Seção)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">
                Destino
              </label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                className="w-full p-2 rounded-lg bg-secondary border border-border text-sm focus:ring-2 focus:ring-primary/30 outline-none"
                placeholder={
                  formData.type === "whatsapp"
                    ? "Ex: 5511999999999"
                    : formData.type === "url"
                    ? "Ex: https://exemplo.com"
                    : "Ex: contato@exemplo.com"
                }
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold uppercase text-muted-foreground">Cor</label>
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-xs font-bold uppercase text-muted-foreground">Ativo</span>
              </label>
            </div>
          </div>

          {/* WhatsApp Específico */}
          {formData.type === "whatsapp" && (
            <div className="space-y-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-sm uppercase tracking-wider">Configuração WhatsApp</h3>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.plan_specific}
                  onChange={(e) => setFormData({ ...formData, plan_specific: e.target.checked })}
                  className="w-4 h-4 rounded"
                />
                <span className="text-xs font-bold uppercase text-muted-foreground">
                  Mensagens Diferentes por Plano
                </span>
              </label>

              {!formData.plan_specific ? (
                <div>
                  <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">
                    Mensagem Padrão
                  </label>
                  <textarea
                    value={formData.whatsapp_message || ""}
                    onChange={(e) => setFormData({ ...formData, whatsapp_message: e.target.value })}
                    className="w-full p-3 rounded-lg bg-secondary border border-border text-sm focus:ring-2 focus:ring-primary/30 outline-none min-h-[100px]"
                    placeholder="Ex: Olá! Gostaria de conhecer mais sobre os planos de coworking..."
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {plans.map((plan) => (
                    <div key={plan}>
                      <label className="text-xs font-bold uppercase text-muted-foreground mb-2 block">
                        Mensagem para {plan}
                      </label>
                      <textarea
                        value={formData.plan_messages?.[plan] || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            plan_messages: {
                              ...formData.plan_messages,
                              [plan]: e.target.value,
                            },
                          })
                        }
                        className="w-full p-3 rounded-lg bg-secondary border border-border text-sm focus:ring-2 focus:ring-primary/30 outline-none min-h-[80px]"
                        placeholder={`Mensagem personalizada para ${plan}...`}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={() => onSave(formData)}
            disabled={isLoading}
            className="gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ---- Main Component ----
const AdminLinkRedirecionamento = () => {
  const qc = useQueryClient();
  const [editingCTA, setEditingCTA] = useState<CTA | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: ctas, isLoading } = useQuery({
    queryKey: ["cta-buttons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cta_buttons" as any).select("*").order("position");
      if (error) throw error;
      return data as unknown as CTA[];
    },
  });

  const activeCTAs = useMemo(() => ctas?.filter((c) => c.active) || [], [ctas]);
  const inactiveCTAs = useMemo(() => ctas?.filter((c) => !c.active) || [], [ctas]);

  const saveCTA = async (cta: CTA) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from("cta_buttons" as any).upsert(cta as any);
      if (error) throw error;
      toast.success("Link salvo com sucesso!");
      setEditingCTA(null);
      qc.invalidateQueries({ queryKey: ["cta-buttons"] });
    } catch (error) {
      toast.error("Erro ao salvar link.");
    } finally {
      setIsSaving(false);
    }
  };

  const removeCTA = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este link?")) return;
    const { error } = await supabase.from("cta_buttons" as any).delete().eq("id", id);
    if (error) return toast.error("Erro ao remover");
    qc.invalidateQueries({ queryKey: ["cta-buttons"] });
    toast.success("Link removido!");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !ctas) return;

    const oldIndex = ctas.findIndex((c) => c.id === active.id);
    const newIndex = ctas.findIndex((c) => c.id === over.id);

    const newOrder = arrayMove(ctas, oldIndex, newIndex);
    const updates = newOrder.map((c, i) => ({ ...c, position: i }));

    for (const cta of updates) {
      await supabase.from("cta_buttons" as any).update({ position: cta.position } as any).eq("id", cta.id);
    }

    qc.invalidateQueries({ queryKey: ["cta-buttons"] });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando Links...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Links de Redirecionamento</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie todos os botões de CTA da sua Landing Page
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode("list")}
          >
            <GripVertical className="w-4 h-4" />
          </Button>
          <Button
            onClick={() =>
              setEditingCTA({
                id: `cta-${Date.now()}`,
                label: "",
                type: "whatsapp",
                destination: "",
                color: "#FBBF24",
                active: true,
                position: (ctas?.length || 0) + 1,
              })
            }
            className="gap-2"
          >
            <Plus className="w-4 h-4" /> Novo Link
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-secondary/30 border border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Total de Links</p>
              <p className="text-2xl font-bold mt-2">{ctas?.length || 0}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-primary/40" />
          </div>
        </div>
        <div className="p-4 rounded-xl bg-secondary/30 border border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Ativos</p>
              <p className="text-2xl font-bold mt-2">{activeCTAs.length}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
          </div>
        </div>
        <div className="p-4 rounded-xl bg-secondary/30 border border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground">Inativos</p>
              <p className="text-2xl font-bold mt-2">{inactiveCTAs.length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-muted-foreground/40" />
          </div>
        </div>
      </div>

      {/* Links List */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <SortableContext items={ctas?.map((c) => c.id) || []} strategy={verticalListSortingStrategy}>
          <div className="space-y-8">
            {/* Ativos */}
            {activeCTAs.length > 0 && (
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-emerald-500">
                  Links Ativos
                </h3>
                <div className="space-y-2">
                  {activeCTAs.map((cta) => (
                    <SortableLinkItem
                      key={cta.id}
                      cta={cta}
                      onEdit={setEditingCTA}
                      onRemove={removeCTA}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Inativos */}
            {inactiveCTAs.length > 0 && (
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider mb-4 text-muted-foreground">
                  Links Inativos
                </h3>
                <div className="space-y-2 opacity-60">
                  {inactiveCTAs.map((cta) => (
                    <SortableLinkItem
                      key={cta.id}
                      cta={cta}
                      onEdit={setEditingCTA}
                      onRemove={removeCTA}
                    />
                  ))}
                </div>
              </div>
            )}

            {!ctas || ctas.length === 0 && (
              <div className="text-center py-12 px-4 border-2 border-dashed border-border/40 rounded-2xl">
                <Link2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-sm text-muted-foreground font-medium">
                  Nenhum link configurado. Crie um novo para começar!
                </p>
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Editor Dialog */}
      <LinkEditorDialog
        cta={editingCTA}
        onSave={saveCTA}
        onClose={() => setEditingCTA(null)}
        isLoading={isSaving}
      />
    </div>
  );
};

export default AdminLinkRedirecionamento;
