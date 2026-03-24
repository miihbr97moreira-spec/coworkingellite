import { useState } from "react";
import { Plus, Trash2, Loader2, Star, Quote, User, Briefcase, MessageSquare, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useReviews } from "@/hooks/useSupabaseQuery";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const AdminReviews = () => {
  const { data: reviews, isLoading } = useReviews();
  const qc = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", role: "", text: "", stars: 5 });

  const addReview = async () => {
    if (!form.name.trim() || !form.text.trim()) return toast.error("Preencha o nome e o depoimento.");
    setIsAdding(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        name: form.name,
        role: form.role,
        text: form.text,
        stars: form.stars,
        sort_order: (reviews?.length ?? 0) + 1,
        active: true
      });
      if (error) throw error;
      
      toast.success("Depoimento publicado com sucesso!");
      setForm({ name: "", role: "", text: "", stars: 5 });
      setShowForm(false);
      qc.invalidateQueries({ queryKey: ["reviews"] });
    } catch (error) {
      toast.error("Erro ao adicionar depoimento.");
    } finally {
      setIsAdding(false);
    }
  };

  const deleteReview = async (id: string) => {
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
      toast.success("Depoimento removido.");
      qc.invalidateQueries({ queryKey: ["reviews"] });
    } catch (error) {
      toast.error("Erro ao remover depoimento.");
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/40 text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all";

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando Avaliações...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Depoimentos</h2>
          <p className="text-muted-foreground text-sm">Gerencie a prova social exibida na landing page.</p>
        </div>
        
        <Button onClick={() => setShowForm(true)} className="gap-2 rounded-xl font-bold">
          <Plus className="w-4 h-4" /> Novo Depoimento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista de Depoimentos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-6">
            <Quote className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm uppercase tracking-wider">Publicados</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {reviews?.filter(r => r.active !== false).map((r) => (
              <div key={r.id} className="glass p-6 group relative border border-border/40 hover:border-primary/40 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {r.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">{r.name}</h4>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">{r.role || 'Cliente'}</p>
                    </div>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3 h-3 ${i < r.stars ? 'text-primary fill-primary' : 'text-muted-foreground/20'}`} />
                    ))}
                  </div>
                </div>
                
                <p className="mt-4 text-sm text-foreground/80 leading-relaxed italic">"{r.text}"</p>
                
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => deleteReview(r.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {(!reviews || reviews.length === 0) && (
              <div className="py-20 border-2 border-dashed border-border/40 rounded-3xl flex flex-col items-center justify-center text-muted-foreground bg-secondary/10">
                <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">Nenhum depoimento cadastrado.</p>
                <Button variant="link" onClick={() => setShowForm(true)} className="text-primary font-bold">Adicionar primeiro depoimento</Button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar / Form */}
        <div className="space-y-6">
          {showForm ? (
            <div className="glass p-8 animate-in slide-in-from-right-4 duration-300 sticky top-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-bold text-lg">Novo Depoimento</h3>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-secondary rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-primary" />
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Nome do Cliente</label>
                  </div>
                  <input 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    className={inputClass} 
                    placeholder="Ex: João Silva" 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3 h-3 text-primary" />
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Cargo / Empresa</label>
                  </div>
                  <input 
                    value={form.role} 
                    onChange={(e) => setForm({ ...form, role: e.target.value })} 
                    className={inputClass} 
                    placeholder="Ex: CEO na TechFlow" 
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3 h-3 text-primary" />
                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Depoimento</label>
                  </div>
                  <textarea 
                    value={form.text} 
                    onChange={(e) => setForm({ ...form, text: e.target.value })} 
                    className={inputClass + " min-h-[120px]"} 
                    placeholder="O que o cliente disse sobre o espaço?" 
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest block mb-3">Avaliação</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button 
                        key={s} 
                        onClick={() => setForm({ ...form, stars: s })}
                        className={`p-2 rounded-lg transition-all ${form.stars >= s ? 'bg-primary/10 text-primary' : 'bg-secondary text-muted-foreground/40'}`}
                      >
                        <Star className={`w-5 h-5 ${form.stars >= s ? 'fill-primary' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowForm(false)}>Cancelar</Button>
                  <Button onClick={addReview} disabled={isAdding} className="flex-1 rounded-xl font-bold">
                    {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Publicar
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass p-8 bg-primary/5 border-primary/20 sticky top-8">
              <h4 className="font-bold text-xs uppercase tracking-widest mb-4">Por que usar depoimentos?</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
                Depoimentos reais aumentam a confiança dos visitantes em até 70%. Certifique-se de incluir o cargo ou empresa para dar mais credibilidade à prova social.
              </p>
              <div className="p-4 rounded-xl bg-background/50 border border-border/40">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-3 h-3 text-primary fill-primary" />
                  <span className="text-[10px] font-bold uppercase">Dica de Ouro</span>
                </div>
                <p className="text-[10px] text-muted-foreground">Depoimentos curtos e diretos (2-3 linhas) funcionam melhor em dispositivos móveis.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminReviews;
