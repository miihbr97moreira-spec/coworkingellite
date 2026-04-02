import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { lazy, Suspense } from "react";

// Páginas Públicas
import Home from "./pages/Home";
import AdminLogin from "./pages/AdminLogin";
import GeneratedPage from "./pages/GeneratedPage";
import QuizPage from "./pages/QuizPage";
import NotFound from "./pages/NotFound";

// Páginas Privadas (Admin/Tenant)
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";

// Páginas Ultra-Privadas (Super Admin) - Lazy Loaded
const SuperAdmin = lazy(() => import("./pages/SuperAdmin"));
const AdminBuilderOmni = lazy(() => import("./components/admin/AdminBuilderOmni").then(m => ({ default: (props: any) => <m.default {...props} isLegacyLP={true} /> })));

import DomainRouter from "./components/DomainRouter";

const queryClient = new QueryClient();

// Componente para Proteger Rotas de Admin
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!session) return <Navigate to="/admin/login" />;
  return <>{children}</>;
};

// Componente para Proteger Rotas de Super Admin
const SuperAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuth();
  const SUPER_ADMIN_EMAIL = "jpm19990@gmail.com";

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  
  const isSuperAdmin = role === "super_admin" || user?.email === SUPER_ADMIN_EMAIL;
  
  if (!user || !isSuperAdmin) {
    return <Navigate to="/admin" />;
  }
  
  return <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>{children}</Suspense>;
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <DomainRouter>
              <Routes>
                {/* Rotas Públicas */}
                <Route path="/" element={<Home />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/p/:slug" element={<GeneratedPage />} />
                <Route path="/quiz/:slug" element={<QuizPage />} />

                {/* Rotas Privadas (Tenant) */}
                <Route path="/admin" element={<PrivateRoute><Admin /></PrivateRoute>} />
                <Route path="/admin/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />

                {/* Rotas Super Admin (Isoladas e Seguras) */}
                <Route path="/admin/super" element={<SuperAdminRoute><SuperAdmin /></SuperAdminRoute>} />
                <Route path="/admin/super/legacy-lp" element={<SuperAdminRoute><Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}><AdminBuilderOmni isLegacyLP={true} /></Suspense></SuperAdminRoute>} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DomainRouter>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
