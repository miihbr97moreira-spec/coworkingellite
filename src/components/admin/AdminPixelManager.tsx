import { useState } from "react";
import { useSiteContent } from "@/context/SiteContext";
import { Save, Info } from "lucide-react";
import { toast } from "sonner";

const AdminPixelManager = () => {
  const { content, updateContent } = useSiteContent();
  const [metaPixel, setMetaPixel] = useState(content.metaPixelId);
  const [gaId, setGaId] = useState(content.googleAnalyticsId);

  const save = () => {
    updateContent({ metaPixelId: metaPixel, googleAnalyticsId: gaId });
    toast.success("Pixels salvos! Recarregue a Landing Page para ativá-los.");
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg bg-secondary border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl font-bold">Gerenciador de Pixels</h2>
        <button onClick={save} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm">
          <Save className="w-4 h-4" /> Salvar
        </button>
      </div>

      <div className="glass p-6 space-y-6 max-w-2xl">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-foreground/70">
            Cole o ID do seu Pixel da Meta e/ou Google Analytics. O sistema injeta automaticamente os scripts no &lt;head&gt; da Landing Page.
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Meta Pixel ID</label>
          <input value={metaPixel} onChange={e => setMetaPixel(e.target.value)} className={inputClass} placeholder="Ex: 123456789012345" />
          <p className="text-xs text-muted-foreground mt-1">Encontre em: Meta Business Suite → Eventos → Configurações do Pixel</p>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Google Analytics ID</label>
          <input value={gaId} onChange={e => setGaId(e.target.value)} className={inputClass} placeholder="Ex: G-XXXXXXXXXX" />
          <p className="text-xs text-muted-foreground mt-1">Encontre em: Google Analytics → Admin → Fluxos de dados</p>
        </div>
      </div>
    </div>
  );
};

export default AdminPixelManager;
