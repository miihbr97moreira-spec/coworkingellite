import { useState } from "react";
import { Globe2, Plus, Copy, Check, ExternalLink, AlertTriangle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const AdminDomains = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const copyValue = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(val);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copiado!");
  };

  const publishedUrl = window.location.origin;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Domínios Customizados</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Conecte seu domínio próprio aos seus artefatos</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="w-3.5 h-3.5" /> Adicionar Domínio
        </Button>
      </div>

      {/* Current domain */}
      <div className="rounded-xl border border-border/40 p-5 mb-6 max-w-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-primary/10"><Globe2 className="w-4 h-4 text-primary" /></div>
          <div>
            <p className="text-sm font-semibold">Domínio Padrão</p>
            <p className="text-xs text-muted-foreground">Ativo automaticamente</p>
          </div>
          <span className="ml-auto px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500">ATIVO</span>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/30">
          <code className="text-xs flex-1 font-mono text-foreground/80">{publishedUrl}</code>
          <button onClick={() => copyValue(publishedUrl)} className="p-1.5 rounded hover:bg-secondary transition-colors">
            {copied === publishedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
          <a href={publishedUrl} target="_blank" rel="noopener" className="p-1.5 rounded hover:bg-secondary transition-colors">
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Info box */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 max-w-2xl">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold mb-2">Como conectar seu domínio</p>
            <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
              <li>Acesse o painel de DNS do seu provedor de domínio (GoDaddy, Hostinger, Cloudflare, etc.)</li>
              <li>Adicione um registro <strong>CNAME</strong> apontando para <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground/80">cname.lovable.app</code></li>
              <li>Ou adicione um registro <strong>A</strong> apontando para <code className="bg-secondary px-1.5 py-0.5 rounded text-foreground/80">185.158.133.1</code></li>
              <li>Aguarde a propagação do DNS (até 72h) e ative o SSL automático</li>
            </ol>
            <p className="text-xs text-muted-foreground mt-3">
              Para conectar um domínio customizado, acesse <strong>Settings → Domains</strong> no painel do projeto Lovable.
            </p>
          </div>
        </div>
      </div>

      {/* Add Domain Modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Globe2 className="w-4 h-4 text-primary" /> Adicionar Domínio</DialogTitle>
            <DialogDescription>Digite o domínio que deseja conectar ao seu projeto.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Domínio</label>
              <input value={domain} onChange={e => setDomain(e.target.value)}
                placeholder="meusite.com.br" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm" />
            </div>

            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">Configuração DNS necessária</p>
                <p>Antes de ativar, configure no DNS do seu provedor:</p>
                <div className="mt-2 space-y-1.5 bg-secondary/50 p-2 rounded">
                  <div className="flex gap-2">
                    <span className="font-mono font-bold text-foreground/80">A</span>
                    <span className="font-mono">@ → 185.158.133.1</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-mono font-bold text-foreground/80">CNAME</span>
                    <span className="font-mono">www → cname.lovable.app</span>
                  </div>
                </div>
              </div>
            </div>

            <Button onClick={() => { setAddOpen(false); toast.info("Para conectar domínios, acesse Settings → Domains no painel do projeto."); }} className="w-full">
              Configurar nas Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDomains;
