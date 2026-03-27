import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "@/pages/Index";
import GeneratedPage from "@/pages/GeneratedPage";
import QuizPage from "@/pages/QuizPage";
import { Loader2, AlertCircle } from "lucide-react";

interface ResolvedContent {
  type: "main_lp" | "page" | "quiz";
  id: string | null;
  slug: string | null;
  isCustomDomain: boolean;
}

const DomainRouter = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<ResolvedContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Lista de domínios internos/raiz que devem renderizar o app principal
  const isRootDomain = (hostname: string): boolean => {
    const rootDomains = [
      "localhost",
      "localhost:3000",
      "localhost:5173",
      "lovable.app",
      "supabase.co",
      // Domínio raiz do SaaS (configurável via variável de ambiente)
      import.meta.env.VITE_ROOT_DOMAIN || "",
    ].filter(Boolean);

    return rootDomains.some((domain) => hostname.includes(domain));
  };

  useEffect(() => {
    const resolveDomain = async () => {
      const hostname = window.location.hostname;

      try {
        // Se for um domínio raiz, renderiza o app principal
        if (isRootDomain(hostname)) {
          setLoading(false);
          return;
        }

        // Busca o mapeamento de domínio customizado no banco de dados
        const { data, error: queryError } = await supabase
          .from("custom_domains")
          .select("content_type, content_id, is_active, slug")
          .eq("domain", hostname)
          .eq("is_active", true)
          .maybeSingle();

        if (queryError) {
          console.error("Erro ao consultar domínio customizado:", queryError);
          setError("Erro ao carregar conteúdo. Por favor, tente novamente.");
          setLoading(false);
          return;
        }

        // Se não encontrou um mapeamento ativo, renderiza o fallback
        if (!data) {
          console.warn(`Domínio customizado ${hostname} não encontrado ou inativo.`);
          setLoading(false);
          return;
        }

        // Validação: domínio deve ter um tipo de conteúdo
        if (!data.content_type) {
          console.warn(`Domínio ${hostname} não tem conteúdo vinculado.`);
          setLoading(false);
          return;
        }

        // Renderiza Landing Page Principal
        if (data.content_type === "main_lp") {
          setContent({
            type: "main_lp",
            id: null,
            slug: null,
            isCustomDomain: true,
          });
          setLoading(false);
          return;
        }

        // Renderiza Página Gerada
        if (data.content_type === "page" && data.content_id) {
          const { data: page, error: pageError } = await supabase
            .from("generated_pages")
            .select("slug, status")
            .eq("id", data.content_id)
            .eq("status", "published")
            .single();

          if (pageError || !page) {
            console.error(
              `Página ${data.content_id} não encontrada ou não publicada:`,
              pageError
            );
            setError("Página não encontrada ou não está publicada.");
            setLoading(false);
            return;
          }

          setContent({
            type: "page",
            id: data.content_id,
            slug: page.slug,
            isCustomDomain: true,
          });
          setLoading(false);
          return;
        }

        // Renderiza Quiz
        if (data.content_type === "quiz" && data.content_id) {
          const { data: quiz, error: quizError } = await supabase
            .from("quizzes")
            .select("slug, status")
            .eq("id", data.content_id)
            .eq("status", "published")
            .single();

          if (quizError || !quiz) {
            console.error(
              `Quiz ${data.content_id} não encontrado ou não publicado:`,
              quizError
            );
            setError("Quiz não encontrado ou não está publicado.");
            setLoading(false);
            return;
          }

          setContent({
            type: "quiz",
            id: data.content_id,
            slug: quiz.slug,
            isCustomDomain: true,
          });
          setLoading(false);
          return;
        }

        // Fallback se o tipo de conteúdo não for reconhecido
        console.warn(`Tipo de conteúdo desconhecido: ${data.content_type}`);
        setLoading(false);
      } catch (err) {
        console.error("Erro crítico ao resolver domínio:", err);
        setError(
          "Ocorreu um erro ao carregar o conteúdo. Por favor, tente novamente mais tarde."
        );
        setLoading(false);
      }
    };

    resolveDomain();
  }, []);

  // Estado de Carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Estado de Erro
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full border border-destructive/30 rounded-lg p-6 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-foreground mb-1">
                Erro ao Carregar Conteúdo
              </h2>
              <p className="text-sm text-muted-foreground">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm font-medium"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Renderiza Conteúdo Customizado (Isolado)
  if (content) {
    // Renderiza APENAS o artefato, sem o shell do Builder/CRM
    if (content.type === "main_lp") {
      return <Index />;
    }
    if (content.type === "page" && content.slug) {
      return <GeneratedPage overrideSlug={content.slug} />;
    }
    if (content.type === "quiz" && content.slug) {
      return <QuizPage overrideSlug={content.slug} />;
    }
  }

  // Renderiza o App Principal (Builder/CRM) para domínios raiz
  return <>{children}</>;
};

export default DomainRouter;
