import { useState, useEffect, useMemo } from "react";
import { Save, Loader2, Monitor, Tablet, Smartphone, Type, Layout, Palette, MousePointer2, ChevronRight, ChevronLeft, Undo2, Redo2, Eye } from "lucide-react";
import { toast } from "sonner";
import { useLPConfig, useUpdateLPConfig } from "@/hooks/useSupabaseQuery";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Index from "@/pages/Index";

const AdminContentEditor = () => {
  const { data: config, isLoading } = useLPConfig();
  const updateConfig = useUpdateLPConfig();

  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [localConfig, setLocalConfig] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  const handleUpdate = (key: string, value: any) => {
    setLocalConfig((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const saveAll = async () => {
    setIsSaving(true);
    try {
      for (const key of Object.keys(localConfig)) {
        await updateConfig.mutateAsync({ key, value: localConfig[key] });
      }
      toast.success("Landing Page publicada com sucesso!");
    } catch (error) {
      toast.error("Erro ao publicar alterações.");
    } finally {
      setIsSaving(false);
    }
  };

  const fonts = ["Inter", "Poppins", "Playfair Display", "Montserrat", "Space Grotesk"];
  const weights = [300, 400, 500, 600, 700, 800];

  if (isLoading) return <div className="flex items-center justify-center h-64 text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Carregando Editor...</div>;

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col -m-6">
      {/* Barra de Ferramentas Superior */}
      <div className="h-16 border-b border-border bg-background flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/40">
            <button onClick={() => setViewport('desktop')} className={`p-2 rounded-lg transition-all ${viewport === 'desktop' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}><Monitor className="w-4 h-4" /></button>
            <button onClick={() => setViewport('tablet')} className={`p-2 rounded-lg transition-all ${viewport === 'tablet' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}><Tablet className="w-4 h-4" /></button>
            <button onClick={() => setViewport('mobile')} className={`p-2 rounded-lg transition-all ${viewport === 'mobile' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}><Smartphone className="w-4 h-4" /></button>
          </div>
          <div className="h-6 w-px bg-border mx-2" />
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8"><Undo2 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8"><Redo2 className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2 rounded-xl"><Eye className="w-4 h-4" /> Preview</Button>
          <Button onClick={saveAll} disabled={isSaving} className="gap-2 rounded-xl font-bold min-w-[120px]">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Publicar
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Painel de Propriedades (Esquerda) */}
        <div className="w-80 border-r border-border bg-background overflow-y-auto p-6 custom-scrollbar shrink-0">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-primary/10 rounded-lg text-primary"><Layout className="w-4 h-4" /></div>
            <h3 className="font-bold text-sm uppercase tracking-wider">Propriedades</h3>
          </div>

          {!selectedElement ? (
            <div className="text-center py-12 px-4 border-2 border-dashed border-border/40 rounded-2xl">
              <MousePointer2 className="w-8 h-8 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-xs text-muted-foreground font-medium">Selecione um elemento no canvas para editar suas propriedades.</p>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              {/* Exemplo de edição para o Hero */}
              {selectedElement === 'hero' && (
                <>
                  <section>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-4 block tracking-widest">Texto Principal</label>
                    <textarea 
                      value={localConfig.hero?.headline || ""} 
                      onChange={(e) => handleUpdate('hero', { ...localConfig.hero, headline: e.target.value })}
                      className="w-full p-3 rounded-xl bg-secondary/50 border border-border/40 text-sm focus:ring-2 focus:ring-primary/30 outline-none min-h-[100px]"
                    />
                  </section>
                  <section>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-4 block tracking-widest">Subheadline</label>
                    <textarea 
                      value={localConfig.hero?.subheadline || ""} 
                      onChange={(e) => handleUpdate('hero', { ...localConfig.hero, subheadline: e.target.value })}
                      className="w-full p-3 rounded-xl bg-secondary/50 border border-border/40 text-sm focus:ring-2 focus:ring-primary/30 outline-none min-h-[80px]"
                    />
                  </section>
                  <section>
                    <label className="text-[10px] font-bold uppercase text-muted-foreground mb-4 block tracking-widest">Tipografia</label>
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs mb-2 font-medium">Fonte</p>
                        <select 
                          className="w-full p-2 rounded-lg bg-secondary border border-border text-sm"
                          value={localConfig.theme?.fontFamily || "Space Grotesk"}
                          onChange={(e) => handleUpdate('theme', { ...localConfig.theme, fontFamily: e.target.value })}
                        >
                          {fonts.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {selectedElement === 'theme' && (
                <section>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground mb-4 block tracking-widest">Cores do Sistema</label>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs mb-2 font-medium">Cor Primária</p>
                      <div className="flex gap-2 flex-wrap">
                        {["45 100% 56%", "220 100% 50%", "142 70% 45%", "0 84% 60%"].map(c => (
                          <button 
                            key={c} 
                            onClick={() => handleUpdate('theme', { ...localConfig.theme, primary: c })}
                            className={`w-8 h-8 rounded-full border-2 ${localConfig.theme?.primary === c ? 'border-white shadow-lg' : 'border-transparent'}`}
                            style={{ backgroundColor: `hsl(${c})` }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>

        {/* Canvas (Direita) */}
        <div className="flex-1 bg-secondary/20 overflow-hidden flex flex-col items-center p-8 relative">
          <div className="absolute top-4 left-4 flex gap-2">
            <Button variant={selectedElement === 'hero' ? 'default' : 'outline'} size="sm" className="rounded-full text-[10px] font-bold uppercase" onClick={() => setSelectedElement('hero')}>Hero</Button>
            <Button variant={selectedElement === 'theme' ? 'default' : 'outline'} size="sm" className="rounded-full text-[10px] font-bold uppercase" onClick={() => setSelectedElement('theme')}>Tema</Button>
          </div>

          <div 
            className={`bg-background shadow-2xl transition-all duration-500 overflow-y-auto overflow-x-hidden relative group border border-border/40 rounded-lg h-full ${
              viewport === 'desktop' ? 'w-full max-w-[1440px]' : 
              viewport === 'tablet' ? 'w-[768px]' : 'w-[375px]'
            }`}
          >
            {/* Overlay para interceptar cliques e selecionar elementos */}
            <div className="absolute inset-0 z-50 pointer-events-none">
              <div className={`absolute top-0 left-0 w-full h-[600px] border-2 transition-all ${selectedElement === 'hero' ? 'border-primary opacity-100' : 'border-transparent opacity-0'}`} />
            </div>
            
            {/* Preview Real da Landing Page */}
            <div className="pointer-events-auto origin-top scale-100">
              <Index />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContentEditor;
