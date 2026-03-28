import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Globe, Eye, EyeOff, Copy, Check, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface PageSettingsProps {
  pageId: string;
  onUpdate?: () => void;
}

interface PageData {
  id: string;
  title: string;
  custom_domain?: string;
  seo_title?: string;
  seo_description?: string;
  favicon_url?: string;
  logo_url?: string;
  brand_color?: string;
}

const PageSettings = ({ pageId, onUpdate }: PageSettingsProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [pageData, setPageData] = useState<PageData>({
    id: pageId,
    title: "",
  });

  useEffect(() => {
    loadPageData();
  }, [pageId]);

  const loadPageData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("generated_pages")
        .select("*")
        .eq("id", pageId)
        .single();

      if (error) throw error;
      setPageData(data);
    } catch (error: any) {
      console.error("Erro ao carregar dados da página:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("generated_pages")
        .update({
          meta_pixel_id: (pageData as any).meta_pixel_id || null,
          ga_id: (pageData as any).ga_id || null,
        } as any)
        .eq("id", pageId);

      if (error) throw error;

      toast.success("Configurações salvas com sucesso!");
      onUpdate?.();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file: File, type: "favicon" | "logo") => {
    if (!user) return;

    setUploading(type);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${pageId}/${type}_${Date.now()}.${fileExt}`;
      const filePath = `page-assets/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("page-assets")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("page-assets")
        .getPublicUrl(filePath);

      const urlField = type === "favicon" ? "favicon_url" : "logo_url";
      setPageData(prev => ({
        ...prev,
        [urlField]: data.publicUrl,
      }));

      toast.success(`${type === "favicon" ? "Favicon" : "Logo"} enviado com sucesso!`);
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload do arquivo");
    } finally {
      setUploading(null);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Configurações da Página</h2>
        <p className="text-muted-foreground">Personalize sua página com logo, favicon e informações de SEO</p>
      </div>

      {/* Domínio Customizado */}
      <div className="bg-secondary/30 rounded-xl border border-border p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Domínio Customizado</h3>
        </div>

        <div className="space-y-2">
          <Label htmlFor="custom_domain">Seu Domínio</Label>
          <div className="flex gap-2">
            <Input
              id="custom_domain"
              placeholder="seu-dominio.com"
              value={pageData.custom_domain || ""}
              onChange={(e) => setPageData(prev => ({ ...prev, custom_domain: e.target.value }))}
              className="flex-1"
            />
            {pageData.custom_domain && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(pageData.custom_domain || "", "domain")}
              >
                {copied === "domain" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Configure o DNS do seu domínio para apontar para nossos servidores
          </p>
        </div>
      </div>

      {/* Identidade Visual */}
      <div className="bg-secondary/30 rounded-xl border border-border p-6 space-y-6">
        <h3 className="text-lg font-semibold">Identidade Visual</h3>

        {/* Logo */}
        <div className="space-y-3">
          <Label>Logo da Marca</Label>
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <div className="text-center">
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Clique para fazer upload</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG ou SVG (máx. 5MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "logo");
                  }}
                  disabled={uploading === "logo"}
                  className="hidden"
                />
              </label>
            </div>
            {pageData.logo_url && (
              <div className="w-24 h-24 rounded-lg border border-border overflow-hidden bg-secondary/50 flex items-center justify-center">
                <img src={pageData.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
              </div>
            )}
          </div>
          {uploading === "logo" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </div>
          )}
        </div>

        {/* Favicon */}
        <div className="space-y-3">
          <Label>Favicon (Ícone da Aba)</Label>
          <div className="flex gap-4 items-start">
            <div className="flex-1">
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                <div className="text-center">
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm font-medium">Clique para fazer upload</p>
                  <p className="text-xs text-muted-foreground">ICO, PNG ou SVG (máx. 1MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file, "favicon");
                  }}
                  disabled={uploading === "favicon"}
                  className="hidden"
                />
              </label>
            </div>
            {pageData.favicon_url && (
              <div className="w-24 h-24 rounded-lg border border-border overflow-hidden bg-secondary/50 flex items-center justify-center">
                <img src={pageData.favicon_url} alt="Favicon" className="w-8 h-8" />
              </div>
            )}
          </div>
          {uploading === "favicon" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </div>
          )}
        </div>

        {/* Cor da Marca */}
        <div className="space-y-2">
          <Label htmlFor="brand_color">Cor Principal da Marca</Label>
          <div className="flex gap-2">
            <input
              id="brand_color"
              type="color"
              value={pageData.brand_color || "#000000"}
              onChange={(e) => setPageData(prev => ({ ...prev, brand_color: e.target.value }))}
              className="w-12 h-10 rounded-lg cursor-pointer border border-border"
            />
            <Input
              type="text"
              placeholder="#000000"
              value={pageData.brand_color || ""}
              onChange={(e) => setPageData(prev => ({ ...prev, brand_color: e.target.value }))}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      {/* SEO */}
      <div className="bg-secondary/30 rounded-xl border border-border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Otimização para SEO</h3>

        <div className="space-y-2">
          <Label htmlFor="seo_title">Título da Página (Meta Title)</Label>
          <Input
            id="seo_title"
            placeholder="Seu Título Aqui - Máx. 60 caracteres"
            value={pageData.seo_title || ""}
            onChange={(e) => setPageData(prev => ({ ...prev, seo_title: e.target.value.slice(0, 60) }))}
            maxLength={60}
          />
          <p className="text-xs text-muted-foreground">
            {pageData.seo_title?.length || 0}/60 caracteres (aparece na aba do navegador e nos resultados de busca)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="seo_description">Descrição da Página (Meta Description)</Label>
          <textarea
            id="seo_description"
            placeholder="Descrição breve da sua página - Máx. 160 caracteres"
            value={pageData.seo_description || ""}
            onChange={(e) => setPageData(prev => ({ ...prev, seo_description: e.target.value.slice(0, 160) }))}
            maxLength={160}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm resize-none"
          />
          <p className="text-xs text-muted-foreground">
            {pageData.seo_description?.length || 0}/160 caracteres (aparece nos resultados de busca)
          </p>
        </div>

        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Estes campos afetam como sua página aparece no Google e em outros mecanismos de busca.
          </p>
        </div>
      </div>

      {/* Preview */}
      {(pageData.seo_title || pageData.seo_description) && (
        <div className="bg-secondary/30 rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Pré-visualização no Google</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-2"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? "Ocultar" : "Mostrar"}
            </Button>
          </div>

          {showPreview && (
            <div className="p-4 rounded-lg bg-background border border-border space-y-1">
              <p className="text-sm text-blue-600 font-medium">{pageData.seo_title || "Título não definido"}</p>
              <p className="text-xs text-green-700">{pageData.custom_domain || "seu-dominio.com"}</p>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {pageData.seo_description || "Descrição não definida"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Save Button */}
      <div className="flex gap-2 pt-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2 flex-1"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Configurações"}
        </Button>
      </div>
    </div>
  );
};

export default PageSettings;
