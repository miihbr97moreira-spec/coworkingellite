import { useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useReviews } from "@/hooks/useSupabaseQuery";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const AdminReviews = () => {
  const { data: reviews, isLoading } = useReviews();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", text: "", stars: 5 });

  const addReview = async () => {
    if (!form.name || !form.text) return toast.error("Preencha nome e depoimento");
    setAdding(true);
    const { error } = await supabase.from("reviews").insert({
      name: form.name,
      role: form.role,
      text: form.text,
      stars: form.stars,
      sort_order: (reviews?.length ?? 0) + 1,
    });
    setAdding(false);
    if (error) return toast.error("Erro ao adicionar");
    setForm({ name: "", role: "", text: "", stars: 5 });
    qc.invalidateQueries({ queryKey: ["reviews"] });
    toast.success("Depoimento adicionado!");
  };

  const deleteReview = async (id: string) => {
    await supabase.from("reviews").update({ active: false }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["reviews"] });
    toast.success("Removido!");
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div>
      <h2 className="font-display text-2xl font-bold mb-6">Gerenciar Avaliações</h2>

      <div className="glass p-6 mb-6 max-w-2xl">
        <h3 className="font-semibold mb-4">Novo Depoimento</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome" className={inputClass} />
          <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Profissão" className={inputClass} />
        </div>
        <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} placeholder="Depoimento..." className={inputClass} rows={2} />
        <button onClick={addReview} disabled={adding} className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Adicionar
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>
      ) : (
        <div className="space-y-3 max-w-2xl">
          {reviews?.map((r) => (
            <div key={r.id} className="glass p-4 flex items-start gap-3">
              <div className="flex-1">
                <p className="font-semibold text-sm">{r.name} <span className="text-muted-foreground font-normal">— {r.role}</span></p>
                <p className="text-sm text-foreground/70 mt-1">"{r.text}"</p>
              </div>
              <button onClick={() => deleteReview(r.id)} className="text-destructive hover:bg-destructive/10 p-2 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
