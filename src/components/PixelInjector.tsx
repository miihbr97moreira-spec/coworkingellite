import { useEffect } from "react";

interface PixelInjectorProps {
  metaPixelId?: string | null;
  gaId?: string | null;
}

/**
 * Injects Meta Pixel and Google Analytics scripts into the actual document head.
 * This ensures Pixel Helper and GA Debugger detect the pixels correctly.
 */
const PixelInjector = ({ metaPixelId, gaId }: PixelInjectorProps) => {
  // Meta Pixel
  useEffect(() => {
    if (!metaPixelId) return;

    // Avoid duplicate init
    if ((window as any).fbq) {
      (window as any).fbq("init", metaPixelId);
      (window as any).fbq("track", "PageView");
      return;
    }

    const script = document.createElement("script");
    script.id = "meta-pixel-script";
    script.innerHTML = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
      (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      fbq('init','${metaPixelId}');
      fbq('track','PageView');
    `;
    document.head.appendChild(script);

    // noscript fallback in body
    const noscript = document.createElement("noscript");
    noscript.id = "meta-pixel-noscript";
    const img = document.createElement("img");
    img.height = 1;
    img.width = 1;
    img.style.display = "none";
    img.src = `https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);

    return () => {
      document.getElementById("meta-pixel-script")?.remove();
      document.getElementById("meta-pixel-noscript")?.remove();
    };
  }, [metaPixelId]);

  // Google Analytics
  useEffect(() => {
    if (!gaId) return;

    // Avoid duplicate
    if (document.getElementById("ga-script")) return;

    const gtagScript = document.createElement("script");
    gtagScript.id = "ga-script";
    gtagScript.async = true;
    gtagScript.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(gtagScript);

    const inlineScript = document.createElement("script");
    inlineScript.id = "ga-inline-script";
    inlineScript.innerHTML = `
      window.dataLayer=window.dataLayer||[];
      function gtag(){dataLayer.push(arguments);}
      gtag('js',new Date());
      gtag('config','${gaId}');
    `;
    document.head.appendChild(inlineScript);

    return () => {
      document.getElementById("ga-script")?.remove();
      document.getElementById("ga-inline-script")?.remove();
    };
  }, [gaId]);

  return null;
};

export default PixelInjector;
