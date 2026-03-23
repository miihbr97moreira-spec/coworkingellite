import { useState } from "react";
import { useSiteContent } from "@/context/SiteContext";
import { Save, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const AdminContentEditor = () => {
  const { content, updateContent } = useSiteContent();
  const [headline, setHeadline] = useState(content.heroHeadline);
  const [subheadline, setSubheadline] = useState(content.heroSubheadline);
  const [testimonials, setTestimonials] = useState(content.testimonials);
  const [plans, setPlans] = useState(content.plans);

  const save = () => {
    updateContent({
      heroHeadline: headline,
      heroSubheadline: subheadline,
      testimonials,
      plans,
    });
    toast.success("Conteúdo salvo com sucesso!");
  };

  const updateTestimonial = (index: number, field: string, value: string) => {
    const updated = [...testimonials];
    (updated[index] as any)[field] = value;
    setTestimonials(updated);
  };

  const removeTestimonial = (index: number) => {
    setTestimonials(testimonials.filter((_, i) => i !== index));
  };

  const addTestimonial = () => {
    setTestimonials([
      ...testimonials,
      { id: Date.now().toString(), name: "", role: "", text: "", stars: 5 },
    ]);
  };

  const updatePlan = (index: number, field: string, value: any) => {
    const updated = [...plans];
    (updated[index] as any)[field] = value;
    setPlans(updated);
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">Editor de Conteúdo</h2>
        <button onClick={save} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
          <Save className="w-4 h-4" /> Salvar Tudo
        </button>
      </div>

      {/* Hero */}
      <div className="glass p-6 mb-6">
        <h3 className="font-semibold mb-4">Hero Section</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Headline</label>
            <textarea value={headline} onChange={e => setHeadline(e.target.value)} className={inputClass} rows={2} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Subheadline</label>
            <textarea value={subheadline} onChange={e => setSubheadline(e.target.value)} className={inputClass} rows={2} />
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="glass p-6 mb-6">
        <h3 className="font-semibold mb-4">Planos</h3>
        <div className="space-y-4">
          {plans.map((plan, i) => (
            <div key={plan.id} className="p-4 rounded-lg bg-secondary/50 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
                  <input value={plan.name} onChange={e => updatePlan(i, "name", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Preço</label>
                  <input value={plan.price} onChange={e => updatePlan(i, "price", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Features (separadas por vírgula)</label>
                <input value={plan.features.join(", ")} onChange={e => updatePlan(i, "features", e.target.value.split(",").map(s => s.trim()))} className={inputClass} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Depoimentos</h3>
          <button onClick={addTestimonial} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm">
            <Plus className="w-4 h-4" /> Adicionar
          </button>
        </div>
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {testimonials.map((t, i) => (
            <div key={t.id} className="p-3 rounded-lg bg-secondary/50 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input placeholder="Nome" value={t.name} onChange={e => updateTestimonial(i, "name", e.target.value)} className={inputClass} />
                <input placeholder="Cargo" value={t.role} onChange={e => updateTestimonial(i, "role", e.target.value)} className={inputClass} />
              </div>
              <div className="flex gap-2">
                <input placeholder="Depoimento" value={t.text} onChange={e => updateTestimonial(i, "text", e.target.value)} className={`${inputClass} flex-1`} />
                <button onClick={() => removeTestimonial(i)} className="px-2 text-destructive hover:bg-destructive/10 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminContentEditor;
