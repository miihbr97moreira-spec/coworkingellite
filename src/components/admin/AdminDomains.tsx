import React, { useState, useEffect } from "react";
import { Globe2, Plus, Copy, Check, ExternalLink, AlertTriangle, Info, Trash2, Loader2, Search, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDNSResolver } from "@/hooks/useDNSResolver";
import DNSValidationGuide from "./DNSValidationGuide";

const AdminDomains = React.forwardRef<HTMLDivElement>((_, ref) => {
  const [addOpen, setAddOpen] = useState(false);
  const [domain, setDomain] = useState("");
  const [slug, setSlug] = useState("");
  const [isNative, setIsNative] = useState(false);
  const [contentType, setContentType] = useState("main_lp");
  const [contentId, setContentId] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [domains, setDomains] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  
  // DNS Resolution
  const { resolveDomain, loading: dnsLoading, error: dnsError } = useDNSResolver();
  const [dnsInfo, setDnsInfo] = useState<any>(null);
  const [checkingDns, setCheckingDns] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [domainsRes, pagesRes, quizzesRes] = await Promise.all([
        (supabase.from("custom_domains" as any)
          .select("*")
          .eq("user_id", user.id) as any)
          .order("created_at", { ascending: false }),
        supabase.from("generated_pages")
          .select("id, title, slug")
          .eq("status", "published"),
        supabase.from("quizzes")
          .select("id, title, slug")
          .eq("status", "published")
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

  const handleCheckDns = async () => {
    if (!domain.trim()) {
      toast.error("Informe um domínio");
      return;
    }

    setCheckingDns(true);
    const result = await resolveDomain(domain.toLowerCase().trim());
    setDnsInfo(result);
    setCheckingDns(false);

    if (result?.isConfigured) {
      toast.success("Domínio configurado corretamente!");
    } else {
      toast.error("Domínio não está configurado no DNS");
    }
  };

  const handleAddDomain = async () => {
    const finalDomain = isNative ? window.location.hostname : domain.toLowerCase().trim();
    if (!finalDomain) return toast.error("Informe o domínio");
    if (isNative && !slug.trim()) return toast.error("Informe o slug para o domínio nativo");
    if (contentType !== "main_lp" && !contentId) return toast.error("Selecione o conteúdo");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await (supabase.from("custom_domains" as any) as any).insert({
        domain: finalDomain,
        slug: slug.trim() || null,
        is_native: isNative,
        content_type: contentType,
        content_id: contentType === "main_lp" ? null : contentId,
        is_active: true,
        user_id: user.id,
      });

      if (error) throw error;

      toast.success("Domínio configurado com sucesso!");
      setAddOpen(false);
      setDomain("");
      setSlug("");
      setIsNative(false);
      setDnsInfo(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar domínio");
    }
  };

  const handleDeleteDomain = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover este domínio?")) return;
    try {
      await (supabase.from("custom_domains" as any) as any).delete().eq("id", id);
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

      {/* Instruções DNS Simplificadas */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 max-w-3xl">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-full bg-primary/20 mt-0.5"><Info className="w-5 h-5 text-primary" /></div>
          <div>
            <p className="text-sm font-bold mb-3">Como Configurar Seu Domínio (Hospedagem Nativa)</p>
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Acesse o painel de controle do seu provedor de domínio (Cloudflare, Hostinger, GoDaddy, Namecheap, etc.) e adicione o registro DNS abaixo:
              </p>
              
              <div className="p-4 rounded-lg bg-background border border-border/40">
                <p className="text-[11px] font-bold text-primary uppercase mb-3 flex items-center gap-2">
                  Registro A (Recomendado para Hospedagem Nativa)
                </p>
                <div className="space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-bold text-primary">A</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                    <span className="text-muted-foreground">Nome:</span>
                    <span className="font-bold">@ (ou deixe em branco)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                    <span className="text-muted-foreground">Valor (IP):</span>
                    <span className="font-bold text-primary">185.158.133.1</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-secondary/30 rounded">
                    <span className="text-muted-foreground">TTL:</span>
                    <span className="font-bold">3600 (1 hora) ou Auto</span>
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 italic">⏱️ Propagação: 5-30 minutos</p>
              </div>

              <div className="p-3 rounded-lg bg-secondary/20 border border-border/30">
                <p className="text-[10px] font-bold text-foreground mb-2">📋 O que significa cada campo:</p>
                <ul className="text-[10px] text-muted-foreground space-y-1">
                  <li><strong>Tipo:</strong> A (IPv4 - Endereço de Internet Protocol versão 4)</li>
                  <li><strong>Nome:</strong> @ para domínio raiz (exemplo.com)</li>
                  <li><strong>Valor:</strong> IP do servidor (185.158.133.1)</li>
                  <li><strong>TTL:</strong> Tempo de cache em segundos (3600 = 1 hora, 86400 = 1 dia)</li>
                </ul>
              </div>

              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <p className="text-[10px] text-amber-700 font-semibold">
                  ⚠️ <strong>Importante:</strong> Após adicionar o registro DNS, aguarde 5-30 minutos para a propagação. Clique em "Verificar" no modal para confirmar que o domínio foi configurado corretamente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Adicionar Domínio */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Globe2 className="w-4 h-4 text-primary" /> Conectar Novo Domínio</DialogTitle>
            <DialogDescription>Vincule um domínio próprio. A conexão com conteúdo é opcional e pode ser feita depois.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border/50">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold">Usar Domínio Nativo do Sistema?</span>
              </div>
              <input 
                type="checkbox" 
                checked={isNative} 
                onChange={e => setIsNative(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
            </div>

            {!isNative ? (
              <div>
                <label className="text-xs font-semibold block mb-1.5">Seu Domínio Customizado</label>
                <div className="flex gap-2">
                  <input 
                    value={domain} 
                    onChange={e => setDomain(e.target.value)}
                    placeholder="ex: promocao.meusite.com.br" 
                    className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30" 
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleCheckDns}
                    disabled={checkingDns || !domain.trim()}
                    className="gap-1"
                  >
                    {checkingDns ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                    Verificar
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <label className="text-xs font-semibold block mb-1.5">Slug (Caminho)</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border text-sm">
                  <span className="text-muted-foreground">{window.location.hostname}/</span>
                  <input 
                    value={slug} 
                    onChange={e => setSlug(e.target.value)}
                    placeholder="minha-pagina" 
                    className="flex-1 bg-transparent outline-none" 
                  />
                </div>
              </div>
            )}

            {/* DNS Validation Guide */}
            {!isNative && domain && (
              <DNSValidationGuide
                domain={domain}
                isConfigured={dnsInfo?.isConfigured || false}
                records={dnsInfo?.records || []}
                onRetry={handleCheckDns}
                isLoading={checkingDns}
              />
            )}

            <div>
              <label className="text-xs font-semibold block mb-1.5">O que este domínio deve exibir? (Opcional)</label>
              <select 
                value={contentType} 
                onChange={e => setContentType(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="none">Nenhum (Configurar depois)</option>
                <option value="main_lp">Landing Page Principal (Home)</option>
                <option value="page">Uma Página Gerada específica</option>
                <option value="quiz">Um Quiz específico</option>
              </select>
            </div>

            {contentType !== "main_lp" && contentType !== "none" && (
              <div>
                <label className="text-xs font-semibold block mb-1.5">Selecione o conteúdo</label>
                <select 
                  value={contentId} 
                  onChange={e => setContentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30"
                >
                  <option value="">Selecione...</option>
                  {contentType === "page" && pages.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                  {contentType === "quiz" && quizzes.map(q => (
                    <option key={q.id} value={q.id}>{q.title}</option>
                  ))}
                </select>
              </div>
            )}

            <Button onClick={handleAddDomain} className="w-full">
              Conectar Domínio
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

AdminDomains.displayName = "AdminDomains";
export default AdminDomains;
