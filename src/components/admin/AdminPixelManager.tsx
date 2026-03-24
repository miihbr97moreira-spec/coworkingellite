import { useState, useEffect } from "react";
import { Save, Info, Loader2, Megaphone, ShieldCheck, Globe, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useLPConfig, useUpdateLPConfig } from "@/hooks/useSupabaseQuery";
import { Button } from "@/components/ui/button";

const AdminPixelManager = () => {
  const { data: config, isLoading } = useLPConfig();
  const updateConfig = useUpdateLPConfig();

  const pixels = config?.pixels as any;
  const [metaPixel, setMetaPixel] = useState("");
  const [gaId, setGaId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (pixels) {
      setMetaPixel(pixels.metaPixelId || "");
      setGaId(pixels.googleAnalyticsId || "");
    }
  }, [config]);

  const save = async () => {
    setIsSaving(true);
    try {
      await updateConfig.mutateAsync({ 
        key: "pixels", 
        value: { metaPixelId: metaPixel, googleAnalyticsId: gaId } 
      });
      toast.success("Configurações de rastreamento publicadas!");
    } catch (error) {
      toast.error("Erro ao salvar pixels.");
    } finally {
      setIsSaving(false);
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl bg-secondary/50 border border-border/40 text-sm focus:ring-2 focus:ring-primary/30 outline-none transition-all font-mono";

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando Pixels...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Rastreamento</h2>
          <p className="text-muted-foreground text-sm">Gerencie scripts de marketing e análise de dados.</p>
        </div>
        
        <Button onClick={save} disabled={isSaving} className="gap-2 rounded-xl font-bold min-w-[120px]">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar Alterações
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-8 space-y-8">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/20">
              <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold uppercase tracking-widest mb-1">Injeção Automática</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Os IDs informados abaixo são injetados automaticamente no cabeçalho da sua Landing Page. Não é necessário mexer no código-fonte.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-primary" />
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Meta Pixel ID</label>
                </div>
                <input 
                  value={metaPixel} 
                  onChange={(e) => setMetaPixel(e.target.value)} 
                  className={inputClass} 
                  placeholder="Ex: 123456789012345" 
                />
                <p className="text-[10px] text-muted-foreground italic">Usado para campanhas de Facebook e Instagram Ads.</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Google Analytics ID (GA4)</label>
                </div>
                <input 
                  value={gaId} 
                  onChange={(e) => setGaId(e.target.value)} 
                  className={inputClass} 
                  placeholder="Ex: G-XXXXXXXXXX" 
                />
                <p className="text-[10px] text-muted-foreground italic">Usado para monitorar tráfego e comportamento dos usuários.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass p-6 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" /> Status do Site
            </h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/20">
                <span className="text-xs font-medium">Meta Pixel</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${metaPixel ? 'bg-emerald-500/10 text-emerald-500' : 'bg-secondary text-muted-foreground'}`}>
                  {metaPixel ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/20">
                <span className="text-xs font-medium">Google Analytics</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${gaId ? 'bg-emerald-500/10 text-emerald-500' : 'bg-secondary text-muted-foreground'}`}>
                  {gaId ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>

          <div className="glass p-6 bg-primary/5 border-primary/20">
            <h4 className="font-bold text-xs uppercase tracking-widest mb-3">Dica de Performance</h4>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Evite usar muitos scripts de terceiros. Cada ID adicionado aumenta levemente o tempo de carregamento da página. Use apenas o necessário para sua estratégia de marketing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPixelManager;
