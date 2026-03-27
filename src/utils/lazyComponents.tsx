import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Lazy load admin components
export const AdminDashboardExpanded = lazy(() => import("@/components/admin/AdminDashboardExpanded"));
export const AdminBuilderOmni = lazy(() => import("@/components/admin/AdminBuilderOmni"));
export const AdminCRM = lazy(() => import("@/components/admin/AdminCRM"));
export const AdminQuizBuilder = lazy(() => import("@/components/admin/AdminQuizBuilder"));
export const OmniFlow = lazy(() => import("@/components/admin/OmniFlow"));
export const AdminSettings = lazy(() => import("@/components/admin/AdminSettings"));
export const SuperAdmin = lazy(() => import("@/pages/SuperAdmin"));

// Loading fallback component
export const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
      <p className="text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

// Wrapper component for lazy-loaded components
export const LazyComponentWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<LoadingFallback />}>
    {children}
  </Suspense>
);
