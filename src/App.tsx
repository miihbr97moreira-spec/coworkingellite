import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Settings from "./pages/Settings";
import SuperAdmin from "./pages/SuperAdmin";
import GeneratedPage from "./pages/GeneratedPage";
import QuizPage from "./pages/QuizPage";
import NotFound from "./pages/NotFound";
import DomainRouter from "./components/DomainRouter";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <DomainRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/admin/settings" element={<Settings />} />
              <Route path="/admin/super" element={<SuperAdmin />} />
              <Route path="/p/:slug" element={<GeneratedPage />} />
              <Route path="/quiz/:slug" element={<QuizPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DomainRouter>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
