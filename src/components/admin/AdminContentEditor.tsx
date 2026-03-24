import { useState, useEffect } from "react";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLPConfig, useUpdateLPConfig } from "@/hooks/useSupabaseQuery";

const AdminContentEditor = () => {
  const { data: config, isLoading } = useLPConfig();
  const updateConfig = useUpdateLPConfig();

  const hero = config?.hero as any;
  const plansConfig = config?.plans as any;
  const theme = config?.theme as any;

  const [headline, setHeadline] = useState("");
  const [subheadline, setSubheadline] = useState("");
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    if (hero) {
      setHeadline(hero.headline || "");
      setSubheadline(hero.subheadline || "");
    }
    if (plansConfig?.plans) setPlans(plansConfig.plans);
  }, [config]);

  const save = async () => {
    try {
      await updateConfig.mutateAsync({ key: "hero", value: { headline, subheadline } });
      await updateConfig.mutateAsync({ key: "plans", value: { plans } });
      toast.success("Conteúdo salvo com sucesso!");
    } catch {
      toast.error("Erro ao salvar");
    }
  };

  const updatePlan = (i: number, field: string, value: any) => {
    const updated = [...plans];
    updated[i] = { ...updated[i], [field]: value };
    setPlans(updated);
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  if (isLoading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">Editor de Conteúdo</h2>
        <button onClick={save} disabled={updateConfig.isPending} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
          {updateConfig.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Tudo
        </button>
      </div>

      <div className="glass p-6 mb-6">
        <h3 className="font-semibold mb-4">Hero Section</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Headline</label>
            <textarea value={headline} onChange={(e) => setHeadline(e.target.value)} className={inputClass} rows={2} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Subheadline</label>
            <textarea value={subheadline} onChange={(e) => setSubheadline(e.target.value)} className={inputClass} rows={2} />
          </div>
        </div>
      </div>

      <div className="glass p-6">
        <h3 className="font-semibold mb-4">Planos</h3>
        <div className="space-y-4">
          {plans.map((plan: any, i: number) => (
            <div key={plan.id} className="p-4 rounded-lg bg-secondary/50 space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nome</label>
                  <input value={plan.name} onChange={(e) => updatePlan(i, "name", e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Preço</label>
                  <input value={plan.price} onChange={(e) => updatePlan(i, "price", e.target.value)} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Features (separadas por vírgula)</label>
                <input
                  value={plan.features?.join(", ")}
                  onChange={(e) => updatePlan(i, "features", e.target.value.split(",").map((s: string) => s.trim()))}
                  className={inputClass}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminContentEditor;
