import { useState } from "react";
import { useSiteContent } from "@/context/SiteContext";
import { Save, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const AdminCTAManager = () => {
  const { content, updateContent } = useSiteContent();
  const [whatsapp, setWhatsapp] = useState(content.whatsappNumber);
  const [plans, setPlans] = useState(content.plans);

  const save = () => {
    updateContent({ whatsappNumber: whatsapp, plans });
    toast.success("CTAs atualizados com sucesso!");
  };

  const updateMessage = (i: number, msg: string) => {
    const updated = [...plans];
    updated[i] = { ...updated[i], whatsappMessage: msg };
    setPlans(updated);
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">CTAs WhatsApp</h2>
        <button onClick={save} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
          <Save className="w-4 h-4" /> Salvar
        </button>
      </div>

      <div className="glass p-6 mb-6 max-w-2xl">
        <label className="text-sm font-medium mb-2 block">Número WhatsApp (com DDI)</label>
        <input value={whatsapp} onChange={e => setWhatsapp(e.target.value)} className={inputClass} placeholder="5511976790653" />
        <p className="text-xs text-muted-foreground mt-1">Formato: 55 + DDD + Número (sem espaços ou traços)</p>
      </div>

      <div className="space-y-4 max-w-2xl">
        {plans.map((plan, i) => (
          <div key={plan.id} className="glass p-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Plano {plan.name} — {plan.price}</h3>
            </div>
            <label className="text-xs text-muted-foreground mb-1 block">Mensagem automática</label>
            <textarea
              value={plan.whatsappMessage}
              onChange={e => updateMessage(i, e.target.value)}
              className={inputClass}
              rows={2}
            />
            <a
              href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(plan.whatsappMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs text-primary hover:underline"
            >
              Testar link →
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCTAManager;
