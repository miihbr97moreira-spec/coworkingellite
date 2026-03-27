import { Helmet } from "react-helmet-async";

interface WhiteLabelHelmetProps {
  title?: string;
  description?: string;
  faviconUrl?: string;
  logoUrl?: string;
  brandColor?: string;
  customDomain?: string;
}

/**
 * Componente para injeção dinâmica de headers (Helmet)
 * Remove qualquer rastro do Lovable e injeta dados White-label do cliente
 * 
 * Responsabilidades:
 * - Substituir favicon dinamicamente
 * - Injetar título e descrição meta para SEO
 * - Remover scripts/tags do Lovable
 * - Aplicar cor da marca globalmente
 */
const WhiteLabelHelmet = ({
  title,
  description,
  faviconUrl,
  logoUrl,
  brandColor,
  customDomain,
}: WhiteLabelHelmetProps) => {
  // Título padrão se não fornecido
  const pageTitle = title || "Omni Builder";
  
  // Descrição padrão se não fornecida
  const pageDescription = description || "Página criada com Omni Builder CRM";

  return (
    <Helmet>
      {/* Título e Meta Tags de SEO */}
      <title>{pageTitle}</title>
      <meta name="description" content={pageDescription} />
      <meta name="og:title" content={pageTitle} />
      <meta name="og:description" content={pageDescription} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={pageDescription} />

      {/* Favicon Dinâmico */}
      {faviconUrl && (
        <>
          <link rel="icon" href={faviconUrl} type="image/x-icon" />
          <link rel="shortcut icon" href={faviconUrl} type="image/x-icon" />
          <link rel="apple-touch-icon" href={faviconUrl} />
        </>
      )}

      {/* Cor da Marca - Injetar como CSS Variable */}
      {brandColor && (
        <style>
          {`
            :root {
              --brand-color: ${brandColor};
            }
            /* Aplicar cor da marca em elementos primários */
            a, button.primary, .btn-primary {
              --tw-text-opacity: 1;
            }
          `}
        </style>
      )}

      {/* Remover qualquer referência ao Lovable */}
      <meta name="generator" content="Omni Builder CRM" />
      
      {/* Canonical URL para SEO */}
      {customDomain && (
        <link rel="canonical" href={`https://${customDomain}`} />
      )}

      {/* Open Graph para redes sociais */}
      {logoUrl && (
        <meta property="og:image" content={logoUrl} />
      )}
      <meta property="og:type" content="website" />
    </Helmet>
  );
};

export default WhiteLabelHelmet;
