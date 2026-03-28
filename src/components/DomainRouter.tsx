import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "@/pages/Index";
import GeneratedPage from "@/pages/GeneratedPage";
import QuizPage from "@/pages/QuizPage";
import WhiteLabelHelmet from "@/components/WhiteLabelHelmet";
import { Loader2 } from "lucide-react";

interface DomainContent {
  type: string;
  id: string | null;
  slug: string | null;
  seo_title?: string;
  seo_description?: string;
  favicon_url?: string;
  logo_url?: string;
  brand_color?: string;
  domain?: string;
}

const DomainRouter = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState<DomainContent | null>(null);

  useEffect(() => {
    const resolveDomain = async () => {
      const hostname = window.location.hostname;
      
      if (hostname === "localhost" || hostname.includes("lovable.app") || hostname.includes("supabase.co")) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await (supabase
          .from("custom_domains" as any)
          .select("content_type, content_id")
          .eq("domain", hostname)
          .eq("is_active", true) as any)
          .maybeSingle();

        if (data) {
          let slug = null;
          let seoData: any = {};
          
          if (data.content_type === "page" && data.content_id) {
            const { data: page } = await supabase
              .from("generated_pages")
              .select("slug, title, meta_pixel_id, ga_id")
              .eq("id", data.content_id)
              .single();
            slug = page?.slug;
            seoData = { seo_title: page?.title };
          } else if (data.content_type === "quiz" && data.content_id) {
            const { data: quiz } = await supabase
              .from("quizzes")
              .select("slug, title, description, logo_url")
              .eq("id", data.content_id)
              .single();
            slug = quiz?.slug;
            seoData = {
              seo_title: quiz?.title,
              seo_description: quiz?.description,
              logo_url: quiz?.logo_url,
            };
          }
          
          setContent({
            type: data.content_type,
            id: data.content_id,
            slug,
            domain: hostname,
            ...seoData,
          });
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
    const helmet = (
      <WhiteLabelHelmet
        title={content.seo_title}
        description={content.seo_description}
        faviconUrl={content.favicon_url}
        logoUrl={content.logo_url}
        brandColor={content.brand_color}
        customDomain={content.domain}
      />
    );

    if (content.type === "main_lp") return <>{helmet}<Index /></>;
    if (content.type === "page" && content.slug) return <>{helmet}<GeneratedPage overrideSlug={content.slug} /></>;
    if (content.type === "quiz" && content.slug) return <>{helmet}<QuizPage overrideSlug={content.slug} /></>;
  }

  return <>{children}</>;
};

export default DomainRouter;
