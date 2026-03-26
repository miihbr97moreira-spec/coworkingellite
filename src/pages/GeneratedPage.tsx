import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const GeneratedPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [html, setHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!slug) return;
      const { data, error: err } = await supabase
        .from("generated_pages")
        .select("html_content, status")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

      if (err || !data) {
        setError(true);
      } else {
        setHtml(data.html_content);
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
