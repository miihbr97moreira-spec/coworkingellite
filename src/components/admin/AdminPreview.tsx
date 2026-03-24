import { useState } from "react";
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, Eye, Layout, SmartphoneIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminPreview = () => {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [key, setKey] = useState(0);

  const refresh = () => setKey(prev => prev + 1);

  const viewportStyles = {
    desktop: "w-full max-w-[1440px]",
    tablet: "w-[768px]",
    mobile: "w-[375px]"
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight">Preview</h2>
          <p className="text-muted-foreground text-sm">Visualize como sua landing page aparece em diferentes dispositivos.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-secondary/50 p-1 rounded-xl border border-border/40">
            <button 
              onClick={() => setViewport('desktop')} 
              className={`p-2 rounded-lg transition-all ${viewport === 'desktop' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
              title="Desktop"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewport('tablet')} 
              className={`p-2 rounded-lg transition-all ${viewport === 'tablet' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
              title="Tablet"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewport('mobile')} 
              className={`p-2 rounded-lg transition-all ${viewport === 'mobile' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground'}`}
              title="Mobile"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
          
          <div className="h-6 w-px bg-border mx-2" />
          
          <Button variant="outline" size="icon" onClick={refresh} className="rounded-xl" title="Recarregar Preview">
            <RefreshCw className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" className="gap-2 rounded-xl" onClick={() => window.open('/', '_blank')}>
            <ExternalLink className="w-4 h-4" /> Abrir em Nova Aba
          </Button>
        </div>
      </div>

      <div className="flex-1 bg-secondary/20 rounded-3xl border border-border/40 overflow-hidden flex flex-col items-center p-8 relative">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 bg-background/50 backdrop-blur-sm rounded-full border border-border/40 z-10">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live Preview</span>
        </div>

        <div 
          className={`bg-background shadow-2xl transition-all duration-500 overflow-hidden relative group border border-border/40 rounded-2xl h-full ${viewportStyles[viewport]}`}
        >
          <iframe
            key={key}
            src="/"
            className="w-full h-full border-none"
            title="Preview da Landing Page"
          />
        </div>
        
        <div className="mt-6 flex items-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Layout className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {viewport === 'desktop' ? '1440 x 900' : viewport === 'tablet' ? '768 x 1024' : '375 x 812'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3">
        <Eye className="w-4 h-4 text-primary" />
        <p className="text-xs text-muted-foreground">
          <strong>Dica:</strong> Salve suas alterações nos outros módulos antes de recarregar o preview para visualizar as mudanças aplicadas.
        </p>
      </div>
    </div>
  );
};

export default AdminPreview;
