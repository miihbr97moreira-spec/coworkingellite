import { useState, useRef } from "react";
import { Upload, Trash2, Loader2, Image as ImageIcon, GripVertical, RefreshCw, Plus, X, Check, Camera, Sparkles } from "lucide-react";
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
import { SortableContext, rectSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";

// ---- Sortable Image Card ----
const SortableImage = ({ file, onRemove, onReplace }: { file: any; onRemove: (name: string) => void; onReplace: (name: string) => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: file.name });
  const [confirmDelete, setConfirmDelete] = useState(false);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.3 : 1,
  };

  const { data } = supabase.storage.from("gallery").getPublicUrl(file.name);
  const publicUrl = data.publicUrl;

  return (
    <div ref={setNodeRef} style={style} className="bg-zinc-900/50 border border-zinc-800/50 p-2 group relative aspect-[4/3] overflow-hidden rounded-3xl hover:border-primary/30 transition-all shadow-sm">
      <img src={publicUrl} alt={file.name} className="w-full h-full object-cover rounded-2xl" loading="lazy" />
      
      {/* Overlay on Hover */}
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-center gap-4 p-6">
        <div {...listeners} className="cursor-grab p-3 bg-zinc-800 text-zinc-400 rounded-2xl hover:text-primary hover:bg-zinc-700 transition-all">
          <GripVertical className="w-5 h-5" />
        </div>
        
        <div className="flex gap-2 w-full">
          <Button variant="secondary" size="sm" className="flex-1 h-10 text-[10px] font-bold uppercase tracking-widest rounded-xl bg-zinc-800 text-zinc-200 hover:bg-zinc-700 border-none" onClick={() => onReplace(file.name)}>Trocar</Button>
          
          {!confirmDelete ? (
            <Button variant="destructive" size="sm" className="h-10 px-3 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border-none" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          ) : (
            <div className="flex items-center gap-1 animate-in zoom-in-95 duration-200">
              <Button variant="destructive" size="sm" className="h-10 px-3 rounded-xl bg-rose-500 text-white" onClick={() => onRemove(file.name)}><Check className="w-4 h-4" /></Button>
              <Button variant="secondary" size="sm" className="h-10 px-3 rounded-xl bg-zinc-700 text-zinc-200" onClick={() => setConfirmDelete(false)}><X className="w-4 h-4" /></Button>
            </div>
          )}
        </div>
      </div>

      {isDragging && <div className="absolute inset-0 bg-primary/10 border-2 border-primary rounded-3xl" />}
    </div>
  );
};

// ---- Main Gallery ----
const AdminGallery = () => {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const { data: files, isLoading } = useQuery({
    queryKey: ["gallery-files"],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("gallery").list("", { limit: 50, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      return data?.filter((f) => f.name !== ".emptyFolderPlaceholder") ?? [];
    },
  });

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = replaceRef.current || `${Date.now()}.${ext}`;
    
    const { error } = await supabase.storage.from("gallery").upload(path, file, { upsert: true });
    
    setUploading(false);
    replaceRef.current = null;
    
    if (error) return toast.error("Erro no upload: " + error.message);
    
    qc.invalidateQueries({ queryKey: ["gallery-files"] });
    setShowAddModal(false);
    toast.success("Galeria atualizada com sucesso!");
  };

  const remove = async (name: string) => {
    const { error } = await supabase.storage.from("gallery").remove([name]);
    if (error) return toast.error("Erro ao remover");
    qc.invalidateQueries({ queryKey: ["gallery-files"] });
    toast.success("Imagem removida!");
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    toast.info("Reordenação visual aplicada (Sync pendente)");
  };

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-96 text-zinc-500 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-[10px] font-bold uppercase tracking-widest">Carregando Assets...</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-primary">
            <Camera className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Visual Assets</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-zinc-100">Galeria de Fotos</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 gap-2 rounded-xl border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300" onClick={() => qc.invalidateQueries({ queryKey: ["gallery-files"] })}>
            <RefreshCw className="w-4 h-4" /> Sincronizar
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="h-11 gap-2 rounded-xl font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> Adicionar Foto
          </Button>
        </div>
      </div>

      {/* Gallery Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          <SortableContext items={files?.map(f => f.name) || []} strategy={rectSortingStrategy}>
            {files?.map((f) => (
              <SortableImage 
                key={f.name} 
                file={f} 
                onRemove={remove} 
                onReplace={(name) => { replaceRef.current = name; fileRef.current?.click(); }} 
              />
            ))}
          </SortableContext>

          {(!files || files.length === 0) && (
            <div className="col-span-full py-32 border-2 border-dashed border-zinc-800/50 rounded-[40px] flex flex-col items-center justify-center text-zinc-500 bg-zinc-900/20">
              <div className="w-20 h-20 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6 border border-zinc-800 shadow-inner">
                <ImageIcon className="w-10 h-10 opacity-20" />
              </div>
              <p className="text-sm font-bold text-zinc-400">Sua galeria está vazia</p>
              <p className="text-xs text-zinc-600 mt-1 mb-6">Comece fazendo o upload das fotos do seu espaço.</p>
              <Button variant="outline" onClick={() => setShowAddModal(true)} className="rounded-xl border-primary/30 text-primary hover:bg-primary/10 font-bold text-[10px] uppercase tracking-widest">Fazer primeiro upload</Button>
            </div>
          )}
        </div>
      </DndContext>

      <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden" />

      {/* Modal Adicionar Imagem */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 p-10 rounded-[40px] shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Upload className="w-4 h-4" />
                </div>
                <h3 className="text-xl font-bold text-zinc-100">Novo Asset</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-zinc-500 hover:text-zinc-100 transition-colors"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-8">
              <div 
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 rounded-[32px] p-12 flex flex-col items-center justify-center gap-4 hover:bg-zinc-800/50 hover:border-primary/30 cursor-pointer transition-all group"
              >
                <div className="p-5 bg-zinc-800 text-zinc-400 rounded-3xl group-hover:scale-110 group-hover:text-primary group-hover:bg-primary/10 transition-all shadow-inner">
                  {uploading ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-zinc-200">Selecionar Arquivo</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mt-2">PNG, JPG até 5MB</p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-primary/5 border border-primary/10 flex items-start gap-4">
                <Sparkles className="w-5 h-5 text-primary shrink-0" />
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  <strong>Dica:</strong> Use imagens em alta resolução (mínimo 1920px) para garantir a melhor experiência visual na sua Landing Page.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
