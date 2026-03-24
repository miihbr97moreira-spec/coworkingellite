import { useEffect } from "react";
import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import LogoTrust from "@/components/landing/LogoTrust";
import SocialProof from "@/components/landing/SocialProof";
import StatsCounter from "@/components/landing/StatsCounter";
import TargetAudience from "@/components/landing/TargetAudience";
import Gallery from "@/components/landing/Gallery";
import Features from "@/components/landing/Features";
import ROICalculator from "@/components/landing/ROICalculator";
import CTABanner from "@/components/landing/CTABanner";
import Pricing from "@/components/landing/Pricing";
import Footer from "@/components/landing/Footer";
import FloatingWhatsApp from "@/components/landing/FloatingWhatsApp";
import NoiseOverlay from "@/components/landing/NoiseOverlay";
import { useLPConfig, trackEvent } from "@/hooks/useSupabaseQuery";

const Index = () => {
  const { data: config } = useLPConfig();

  useEffect(() => {
    trackEvent("page_view", { path: "/" });
  }, []);

  useEffect(() => {
    const pixels = config?.pixels as { metaPixelId?: string; googleAnalyticsId?: string } | undefined;
    if (pixels?.metaPixelId) {
      const existing = document.getElementById("meta-pixel");
      if (!existing) {
        const script = document.createElement("script");
        script.id = "meta-pixel";
        script.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixels.metaPixelId}');fbq('track','PageView');`;
        document.head.appendChild(script);
      }
    }
    if (pixels?.googleAnalyticsId) {
      const existing = document.getElementById("ga-script");
      if (!existing) {
        const script = document.createElement("script");
        script.id = "ga-script";
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${pixels.googleAnalyticsId}`;
        document.head.appendChild(script);
        const script2 = document.createElement("script");
        script2.innerHTML = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${pixels.googleAnalyticsId}');`;
        document.head.appendChild(script2);
      }
    }
  }, [config]);

  return (
    <div className="min-h-screen bg-background">
      <NoiseOverlay />
      <Navbar />
      <HeroSection />
      <LogoTrust />
      <SocialProof />
      <StatsCounter />
      <TargetAudience />
      <div id="espaco">
        <Gallery />
      </div>
      <Features />
      <ROICalculator />
      <CTABanner />
      <Pricing />
      <div id="contato">
        <Footer />
      </div>
      <FloatingWhatsApp />
    </div>
  );
};

export default Index;
