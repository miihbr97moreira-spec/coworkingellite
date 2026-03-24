import { useState, useRef } from "react";
import { Upload, Trash2, Loader2, Image } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const AdminGallery = () => {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: files, isLoading } = useQuery({
    queryKey: ["gallery-files"],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from("gallery").list("", { limit: 50, sortBy: { column: "created_at", order: "desc" } });
      if (error) throw error;
      return data?.filter((f) => f.name !== ".emptyFolderPlaceholder") ?? [];
    },
  });

  const getPublicUrl = (name: string) => {
    const { data } = supabase.storage.from("gallery").getPublicUrl(name);
    return data.publicUrl;
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("gallery").upload(path, file);
    setUploading(false);
    if (error) return toast.error("Erro no upload: " + error.message);
    qc.invalidateQueries({ queryKey: ["gallery-files"] });
    toast.success("Imagem enviada!");
  };

  const remove = async (name: string) => {
    await supabase.storage.from("gallery").remove([name]);
    qc.invalidateQueries({ queryKey: ["gallery-files"] });
    toast.success("Imagem removida!");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">Galeria do Espaço</h2>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden" />
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {files?.map((f) => (
            <div key={f.name} className="glass p-2 group relative">
              <img src={getPublicUrl(f.name)} alt={f.name} className="w-full aspect-[4/3] object-cover rounded-lg" loading="lazy" />
              <button
                onClick={() => remove(f.name)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {(!files || files.length === 0) && (
            <div className="glass p-8 col-span-full flex flex-col items-center gap-3 text-muted-foreground">
              <Image className="w-10 h-10" />
              <p className="text-sm">Nenhuma imagem ainda. Faça upload para começar.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminGallery;
