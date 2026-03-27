import React, { useState, useEffect } from "react";
import { Globe2, Plus, Copy, Check, ExternalLink, AlertTriangle, Info, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const AdminDomains = React.forwardRef<HTMLDivElement>((_, ref) => {
  const [addOpen, setAddOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [contentType, setContentType] = useState("main_lp");
  const [contentId, setContentId] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [domainsRes, pagesRes, quizzesRes] = await Promise.all([
        supabase.from("custom_domains").select("*").order("created_at", { ascending: false }),
        supabase.from("generated_pages").select("id, title, slug").eq("status", "published"),
        supabase.from("quizzes").select("id, title, slug").eq("status", "published")
      ]);

      if (domainsRes.data) setDomains(domainsRes.data);
      if (pagesRes.data) setPages(pagesRes.data);
      if (quizzesRes.data) setQuizzes(quizzesRes.data);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast.error("Erro ao carregar domínios");
    } finally {
      setLoading(false);
    }
  };

  const handleAddDomain = async () => {
    if (!domain.trim()) return toast.error("Informe o domínio");
    
    try {
      const { error } = await supabase.from("custom_domains").insert({
        domain: domain.toLowerCase().trim(),
        content_type: contentType,
        content_id: contentType === "main_lp" ? null : contentId,
        is_active: true
      });

      if (error) throw error;

      toast.success("Domínio adicionado com sucesso!");
      setAddOpen(false);
      setDomain("");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar domínio");
    }
  };

  const handleDeleteDomain = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este domínio?")) return;
    try {
      await supabase.from("custom_domains").delete().eq("id", id);
      toast.success("Domínio removido");
      loadData();
    } catch (err) {
      toast.error("Erro ao remover domínio");
    }
  };

  const copyValue = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopied(val);
    setTimeout(() => setCopied(null), 2000);
    toast.success("Copiado!");
  };

  const publishedUrl = window.location.origin;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div ref={ref}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Hospedagem Nativa e Domínios</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Gerencie seus domínios e aponte para suas páginas nativamente</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
          <Plus className="w-3.5 h-3.5" /> Conectar Domínio
        </Button>
      </div>

      {/* Domínios Cadastrados */}
      <div className="space-y-4 mb-8">
        {domains.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-xl bg-secondary/10">
            <Globe2 className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-20" />
            <p className="text-sm text-muted-foreground">Nenhum domínio customizado conectado.</p>
          </div>
        ) : (
          domains.map((d) => (
            <div key={d.id} className="rounded-xl border border-border/40 p-5 bg-background hover:border-primary/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10"><Globe2 className="w-4 h-4 text-primary" /></div>
                  <div>
                    <p className="text-sm font-semibold">{d.domain}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Apontando para: {d.content_type === 'main_lp' ? 'Landing Page Principal' : d.content_type === 'quiz' ? 'Quiz' : 'Página Gerada'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {d.is_active ? 'ATIVO' : 'INATIVO'}
                  </span>
                  <button onClick={() => handleDeleteDomain(d.id)} className="p-1.5 hover:bg-destructive/10 rounded transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/30 border border-border/20">
                <code className="text-[11px] flex-1 font-mono text-foreground/70 truncate">https://{d.domain}</code>
                <a href={`https://${d.domain}`} target="_blank" rel="noopener" className="p-1.5 rounded hover:bg-secondary transition-colors">
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Instruções DNS */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 max-w-3xl">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-primary/20 mt-0.5"><Info className="w-5 h-5 text-primary" /></div>
          <div>
            <p className="text-sm font-bold mb-3">Como configurar a Hospedagem Nativa</p>
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Para que seu domínio funcione nativamente neste projeto, você deve configurar os registros DNS no seu provedor (Cloudflare, Hostinger, etc.):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-background border border-border/40">
                  <p className="text-[10px] font-bold text-primary uppercase mb-2">Opção 1: Registro A (Recomendado)</p>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between"><span>Tipo:</span> <span className="font-bold">A</span></div>
                    <div className="flex justify-between"><span>Nome:</span> <span className="font-bold">@</span></div>
                    <div className="flex justify-between"><span>Valor:</span> <span className="font-bold text-primary">76.76.21.21</span></div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-background border border-border/40">
                  <p className="text-[10px] font-bold text-primary uppercase mb-2">Opção 2: Registro CNAME</p>
                  <div className="space-y-1 font-mono text-[11px]">
                    <div className="flex justify-between"><span>Tipo:</span> <span className="font-bold">CNAME</span></div>
                    <div className="flex justify-between"><span>Nome:</span> <span className="font-bold">www</span></div>
                    <div className="flex justify-between"><span>Valor:</span> <span className="font-bold text-primary">cname.vercel-dns.com</span></div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                * O valor do IP pode variar dependendo de onde seu projeto está hospedado (Vercel, Netlify, etc.). Use o IP fornecido pela sua plataforma de deploy.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Adicionar Domínio */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Globe2 className="w-4 h-4 text-primary" /> Conectar Novo Domínio</DialogTitle>
            <DialogDescription>Vincule um domínio próprio a um conteúdo específico do seu projeto.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs font-semibold block mb-1.5">Domínio</label>
              <input value={domain} onChange={e => setDomain(e.target.value)}
                placeholder="ex: promocao.meusite.com.br" className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30" />
            </div>

            <div>
              <label className="text-xs font-semibold block mb-1.5">O que este domínio deve exibir?</label>
              <select 
                value={contentType} 
                onChange={e => setContentType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="main_lp">Landing Page Principal (Home)</option>
                <option value="page">Uma Página Gerada específica</option>
                <option value="quiz">Um Quiz específico</option>
              </select>
            </div>

            {contentType !== "main_lp" && (
              <div>
                <label className="text-xs font-semibold block mb-1.5">Selecione o conteúdo</label>
                <select 
                  value={contentId} 
                  onChange={e => setContentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30"
                >
                  <option value="">Selecione...</option>
                  {contentType === "page" ? (
                    pages.map(p => <option key={p.id} value={p.id}>{p.title} ({p.slug})</option>)
                  ) : (
                    quizzes.map(q => <option key={q.id} value={q.id}>{q.title} ({q.slug})</option>)
                  )}
                </select>
              </div>
            )}

            <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <p className="text-[10px] text-muted-foreground">
                Lembre-se de configurar o DNS no seu provedor antes de tentar acessar o domínio.
              </p>
            </div>

            <Button onClick={handleAddDomain} className="w-full">
              Salvar e Conectar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

AdminDomains.displayName = "AdminDomains";

export default AdminDomains;
