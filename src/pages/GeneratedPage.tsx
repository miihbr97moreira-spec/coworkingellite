import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const GeneratedPage = ({ overrideSlug }: { overrideSlug?: string }) => {
  const { slug: paramSlug } = useParams<{ slug: string }>();
  const slug = overrideSlug || paramSlug;
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data, error: err } = await supabase
        .from("generated_pages")
        .select("html_content, status, meta_pixel_id, ga_id")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (err || !data) {
        setError(true);
      } else {
        let finalHtml = data.html_content;

        // Inject pixels into <head>
        const pixelScripts: string[] = [];

        if (data.meta_pixel_id) {
          pixelScripts.push(`
            <script>
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
            (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init','${data.meta_pixel_id}');fbq('track','PageView');
            <\/script>
            <noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${data.meta_pixel_id}&ev=PageView&noscript=1"/></noscript>`);
        }

        if (data.ga_id) {
          pixelScripts.push(`
            <script async src="https://www.googletagmanager.com/gtag/js?id=${data.ga_id}"><\/script>
            <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${data.ga_id}');<\/script>`);
        }

        if (pixelScripts.length > 0) {
          const injection = pixelScripts.join("\n");
          if (finalHtml.includes("</head>")) {
            finalHtml = finalHtml.replace("</head>", injection + "</head>");
          } else if (finalHtml.includes("<body")) {
            finalHtml = finalHtml.replace("<body", injection + "<body");
          } else {
            finalHtml = injection + finalHtml;
          }
        }

        setHtml(finalHtml);
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !html) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        <p>Página não encontrada ou não publicada.</p>
      </div>
    );
  }

  return <iframe srcDoc={html} className="w-full h-screen border-0" title="Generated Page" />;
};

export default GeneratedPage;
