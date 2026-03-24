import { useState, useEffect } from "react";
import { Save, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useLPConfig, useUpdateLPConfig } from "@/hooks/useSupabaseQuery";

const AdminCTAManager = () => {
  const { data: config, isLoading } = useLPConfig();
  const updateConfig = useUpdateLPConfig();

  const whatsappConfig = config?.whatsapp as any;
  const plansConfig = config?.plans as any;

  const [whatsapp, setWhatsapp] = useState("");
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    if (whatsappConfig) setWhatsapp(whatsappConfig.number || "");
    if (plansConfig?.plans) setPlans(plansConfig.plans);
  }, [config]);

  const save = async () => {
    try {
      await updateConfig.mutateAsync({ key: "whatsapp", value: { number: whatsapp } });
      await updateConfig.mutateAsync({ key: "plans", value: { plans } });
      toast.success("CTAs atualizados!");
    } catch {
      toast.error("Erro ao salvar");
    }
  };

  const updateMessage = (i: number, msg: string) => {
    const updated = [...plans];
    updated[i] = { ...updated[i], whatsappMessage: msg };
    setPlans(updated);
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  if (isLoading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">CTAs WhatsApp</h2>
        <button onClick={save} disabled={updateConfig.isPending} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
          {updateConfig.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar
        </button>
      </div>

      <div className="glass p-6 mb-6 max-w-2xl">
        <label className="text-sm font-medium mb-2 block">Número WhatsApp (com DDI)</label>
        <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputClass} placeholder="5511976790653" />
      </div>

      <div className="space-y-4 max-w-2xl">
        {plans.map((plan: any, i: number) => (
          <div key={plan.id} className="glass p-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Plano {plan.name} — {plan.price}</h3>
            </div>
            <textarea
              value={plan.whatsappMessage}
              onChange={(e) => updateMessage(i, e.target.value)}
              className={inputClass}
              rows={2}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCTAManager;
