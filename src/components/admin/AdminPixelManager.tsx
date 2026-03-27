import { useState, useEffect } from "react";
import { Save, Info, Loader2, Globe, ListChecks } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLPConfig, useUpdateLPConfig } from "@/hooks/useSupabaseQuery";
import { Button } from "@/components/ui/button";

interface PageItem {
  id: string;
  slug: string;
  title: string;
  type: "page" | "quiz";
  meta_pixel_id: string;
  ga_id: string;
}

const AdminPixelManager = () => {
  const { data: config, isLoading: configLoading } = useLPConfig();
  const updateConfig = useUpdateLPConfig();

  const pixels = config?.pixels as any;
  const [metaPixel, setMetaPixel] = useState("");
  const [gaId, setGaId] = useState("");

  const [pages, setPages] = useState<PageItem[]>([]);
  const [loadingPages, setLoadingPages] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (pixels) {
      setMetaPixel(pixels.metaPixelId || "");
      setGaId(pixels.googleAnalyticsId || "");
    }
  }, [config]);

  useEffect(() => { loadAllPages(); }, []);

  const loadAllPages = async () => {
    setLoadingPages(true);
    const [{ data: gp }, { data: qz }] = await Promise.all([
      supabase.from("generated_pages").select("id, slug, title, meta_pixel_id, ga_id").order("created_at", { ascending: false }),
      supabase.from("quizzes").select("id, slug, title, meta_pixel_id, ga_id").order("created_at", { ascending: false }),
    ]);
    const items: PageItem[] = [
      ...(gp || []).map(p => ({ ...p, type: "page" as const, meta_pixel_id: p.meta_pixel_id || "", ga_id: p.ga_id || "" })),
      ...(qz || []).map(q => ({ ...q, type: "quiz" as const, meta_pixel_id: q.meta_pixel_id || "", ga_id: q.ga_id || "" })),
    ];
    setPages(items);
    setLoadingPages(false);
  };

  const saveGlobal = async () => {
    try {
      await updateConfig.mutateAsync({ key: "pixels", value: { metaPixelId: metaPixel, googleAnalyticsId: gaId } });
      toast.success("Pixels globais salvos!");
    } catch {
      toast.error("Erro ao salvar");
    }
  };

  const savePagePixels = async (item: PageItem) => {
    setSaving(item.id);
    const table = item.type === "page" ? "generated_pages" : "quizzes";
    const { error } = await supabase.from(table).update({
      meta_pixel_id: item.meta_pixel_id,
      ga_id: item.ga_id,
    }).eq("id", item.id);
    setSaving(null);
    if (error) return toast.error("Erro ao salvar");
    toast.success(`Pixels de "${item.title}" salvos!`);
  };

  const updatePageField = (id: string, field: "meta_pixel_id" | "ga_id", value: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const inputClass = "w-full px-3 py-2 rounded-lg bg-secondary/50 border border-border/40 text-sm focus:outline-none focus:ring-1 focus:ring-primary/30";

  if (configLoading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Carregando...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Gerenciador de Pixels</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Configure pixels globais ou por página/quiz individual</p>
        </div>
      </div>

      {/* Global Pixels */}
      <div className="rounded-xl border border-border/40 p-5 mb-6 max-w-3xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold">Pixels Globais (LP Principal)</h3>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={saveGlobal} disabled={updateConfig.isPending}>
            {updateConfig.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
          </Button>
        </div>
        <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-4">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            Estes pixels são injetados na Landing Page principal. Para páginas e quizzes individuais, configure abaixo.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Meta Pixel ID</label>
            <input value={metaPixel} onChange={e => setMetaPixel(e.target.value)} className={inputClass} placeholder="123456789012345" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Google Analytics ID</label>
            <input value={gaId} onChange={e => setGaId(e.target.value)} className={inputClass} placeholder="G-XXXXXXXXXX" />
          </div>
        </div>
      </div>

      {/* Per-page Pixels */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 mb-4">
          <ListChecks className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">Pixels por Página / Quiz</h3>
        </div>

        {loadingPages ? (
          <div className="flex items-center gap-2 text-muted-foreground py-8 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
          </div>
        ) : pages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Nenhuma página ou quiz criado ainda.</p>
            <p className="text-xs mt-1">Crie páginas no Builder ou quizzes no Quiz Builder.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pages.map(item => (
              <div key={item.id} className="rounded-xl border border-border/40 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.type === "quiz" ? "bg-purple-500/10 text-purple-500" : "bg-blue-500/10 text-blue-500"}`}>
                      {item.type === "quiz" ? "QUIZ" : "PÁGINA"}
                    </span>
                    <span className="text-sm font-medium">{item.title}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">/{item.type === "quiz" ? "quiz" : "p"}/{item.slug}</span>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                    onClick={() => savePagePixels(item)} disabled={saving === item.id}>
                    {saving === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />} Salvar
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Meta Pixel ID</label>
                    <input value={item.meta_pixel_id} onChange={e => updatePageField(item.id, "meta_pixel_id", e.target.value)}
                      className={inputClass} placeholder="123456789012345" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Google Analytics ID</label>
                    <input value={item.ga_id} onChange={e => updatePageField(item.id, "ga_id", e.target.value)}
                      className={inputClass} placeholder="G-XXXXXXXXXX" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPixelManager;
