import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "@/pages/Index";
import GeneratedPage from "@/pages/GeneratedPage";
import QuizPage from "@/pages/QuizPage";
import { Loader2 } from "lucide-react";

const DomainRouter = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<{ type: string; id: string | null; slug: string | null } | null>(null);

  useEffect(() => {
    const resolveDomain = async () => {
      const hostname = window.location.hostname;
      
      // Se for localhost ou o domínio padrão do app, não faz roteamento por domínio
      if (hostname === "localhost" || hostname.includes("lovable.app") || hostname.includes("supabase.co")) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("custom_domains")
          .select("content_type, content_id")
          .eq("domain", hostname)
          .eq("is_active", true)
          .maybeSingle();

        if (data) {
          // Se encontrou um mapeamento, precisamos do slug se for page ou quiz
          let slug = null;
          if (data.content_type === "page" && data.content_id) {
            const { data: page } = await supabase.from("generated_pages").select("slug").eq("id", data.content_id).single();
            slug = page?.slug;
          } else if (data.content_type === "quiz" && data.content_id) {
            const { data: quiz } = await supabase.from("quizzes").select("slug").eq("id", data.content_id).single();
            slug = quiz?.slug;
          }
          
          setContent({ type: data.content_type, id: data.content_id, slug });
        }
      } catch (err) {
        console.error("Erro ao resolver domínio:", err);
      } finally {
        setLoading(false);
      }
    };

    resolveDomain();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (content) {
    if (content.type === "main_lp") return <Index />;
    if (content.type === "page" && content.slug) return <GeneratedPage overrideSlug={content.slug} />;
    if (content.type === "quiz" && content.slug) return <QuizPage overrideSlug={content.slug} />;
  }

  return <>{children}</>;
};

export default DomainRouter;
