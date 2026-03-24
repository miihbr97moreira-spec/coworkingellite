import { useState, useEffect } from "react";
import { Save, Loader2, Monitor, Tablet, Smartphone, Layout, MousePointer2, Undo2, Redo2, Eye, Type, Palette, Sparkles, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useLPConfig, useUpdateLPConfig } from "@/hooks/useSupabaseQuery";
import { Button } from "@/components/ui/button";
import Index from "@/pages/Index";

const AdminContentEditor = () => {
  const { data: config, isLoading } = useLPConfig();
  const updateConfig = useUpdateLPConfig();

  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedElement, setSelectedElement] = useState<string | null>('hero');
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

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-96 text-zinc-500 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <p className="text-xs font-bold uppercase tracking-widest">Iniciando Builder...</p>
    </div>
  );

  return (
    <div className="h-[calc(100vh-180px)] flex flex-col -m-8 bg-[#09090b]">
      {/* Toolbar */}
      <div className="h-16 border-b border-zinc-800/30 bg-[#09090b] flex items-center justify-between px-8 shrink-0 z-10">
        <div className="flex items-center gap-6">
          <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button 
              onClick={() => setViewport('desktop')} 
              className={`p-2 rounded-lg transition-all ${viewport === 'desktop' ? 'bg-zinc-800 text-primary shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewport('tablet')} 
              className={`p-2 rounded-lg transition-all ${viewport === 'tablet' ? 'bg-zinc-800 text-primary shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewport('mobile')} 
              className={`p-2 rounded-lg transition-all ${viewport === 'mobile' ? 'bg-zinc-800 text-primary shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          
          <div className="h-6 w-px bg-zinc-800" />
          
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800"><Undo2 className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800"><Redo2 className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20 text-emerald-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Modo Edição Ativo</span>
          </div>
          <Button onClick={saveAll} disabled={isSaving} className="gap-2 rounded-xl font-bold px-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Publicar Site
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Properties */}
        <aside className="w-80 border-r border-zinc-800/30 bg-[#09090b] overflow-y-auto p-6 custom-scrollbar shrink-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg text-primary"><Layout className="w-4 h-4" /></div>
              <h3 className="font-bold text-xs uppercase tracking-widest text-zinc-100">Editor Visual</h3>
            </div>
          </div>

          <div className="space-y-8">
            {/* Navigation Tabs for Editor */}
            <div className="flex p-1 bg-zinc-900 rounded-xl border border-zinc-800">
              <button 
                onClick={() => setSelectedElement('hero')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${selectedElement === 'hero' ? 'bg-zinc-800 text-primary shadow-sm' : 'text-zinc-500'}`}
              >
                Conteúdo
              </button>
              <button 
                onClick={() => setSelectedElement('theme')}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${selectedElement === 'theme' ? 'bg-zinc-800 text-primary shadow-sm' : 'text-zinc-500'}`}
              >
                Estilo
              </button>
            </div>

            {selectedElement === 'hero' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Type className="w-3 h-3 text-primary" />
                    <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Headline Principal</label>
                  </div>
                  <textarea 
                    value={localConfig.hero?.headline || ""} 
                    onChange={(e) => handleUpdate('hero', { ...localConfig.hero, headline: e.target.value })}
                    className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:ring-2 focus:ring-primary/30 outline-none min-h-[120px] transition-all"
                    placeholder="Digite o título principal..."
                  />
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Type className="w-3 h-3 text-primary" />
                    <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Subheadline</label>
                  </div>
                  <textarea 
                    value={localConfig.hero?.subheadline || ""} 
                    onChange={(e) => handleUpdate('hero', { ...localConfig.hero, subheadline: e.target.value })}
                    className="w-full p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 focus:ring-2 focus:ring-primary/30 outline-none min-h-[100px] transition-all"
                    placeholder="Digite o subtítulo..."
                  />
                </section>
              </div>
            )}

            {selectedElement === 'theme' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                <section className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Palette className="w-3 h-3 text-primary" />
                    <label className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">Identidade Visual</label>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] mb-3 font-bold text-zinc-400 uppercase tracking-tighter">Cor de Destaque</p>
                      <div className="flex gap-3 flex-wrap">
                        {["45 100% 56%", "220 100% 50%", "142 70% 45%", "0 84% 60%", "280 80% 60%"].map(c => (
                          <button 
                            key={c} 
                            onClick={() => handleUpdate('theme', { ...localConfig.theme, primary: c })}
                            className={`w-10 h-10 rounded-xl border-2 transition-all hover:scale-110 ${localConfig.theme?.primary === c ? 'border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'border-transparent'}`}
                            style={{ backgroundColor: `hsl(${c})` }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-zinc-800/50">
                      <p className="text-[10px] mb-3 font-bold text-zinc-400 uppercase tracking-tighter">Tipografia</p>
                      <select 
                        className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 outline-none focus:ring-2 focus:ring-primary/30"
                        value={localConfig.theme?.fontFamily || "Space Grotesk"}
                        onChange={(e) => handleUpdate('theme', { ...localConfig.theme, fontFamily: e.target.value })}
                      >
                        {fonts.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                  </div>
                </section>
              </div>
            )}
          </div>

          <div className="mt-12 p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Dica do Builder</span>
            </div>
            <p className="text-[10px] text-zinc-500 leading-relaxed">
              As alterações feitas aqui são refletidas em tempo real no canvas ao lado, mas só estarão disponíveis para o público após clicar em <strong>Publicar Site</strong>.
            </p>
          </div>
        </aside>

        {/* Canvas Area */}
        <main className="flex-1 bg-[#0c0c0e] overflow-hidden flex flex-col items-center p-12 relative">
          {/* Canvas Container */}
          <div 
            className={`bg-white shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all duration-700 ease-[0.23,1,0.32,1] overflow-y-auto overflow-x-hidden relative border border-zinc-800 rounded-2xl h-full ${
              viewport === 'desktop' ? 'w-full max-w-[1440px]' : 
              viewport === 'tablet' ? 'w-[768px]' : 'w-[375px]'
            }`}
          >
            {/* Index Preview */}
            <div className="pointer-events-auto origin-top scale-100 h-full">
              <Index />
            </div>
          </div>

          {/* Viewport Info Overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-4 py-2 bg-zinc-900/80 backdrop-blur-md rounded-full border border-zinc-800 text-zinc-500 shadow-2xl">
            <div className="flex items-center gap-2">
              <Monitor className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-widest">
                {viewport === 'desktop' ? '1440px' : viewport === 'tablet' ? '768px' : '375px'}
              </span>
            </div>
            <div className="h-3 w-px bg-zinc-800" />
            <span className="text-[10px] font-bold uppercase tracking-widest">100% Zoom</span>
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default AdminContentEditor;
