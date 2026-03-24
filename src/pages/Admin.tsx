import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3, Layout, Megaphone, Link2, Monitor, LogOut,
  Settings, Users, Kanban, Image, ChevronLeft, ChevronRight,
  User, Bell, Search, Moon, Sun, ShieldCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminContentEditor from "@/components/admin/AdminContentEditor";
import AdminPixelManager from "@/components/admin/AdminPixelManager";
import AdminCTAManager from "@/components/admin/AdminCTAManager";
import AdminCRM from "@/components/admin/AdminCRM";
import AdminGallery from "@/components/admin/AdminGallery";
import AdminReviews from "@/components/admin/AdminReviews";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "content", label: "Builder", icon: Layout },
  { id: "crm", label: "CRM", icon: Kanban },
  { id: "gallery", label: "Galeria", icon: Image },
  { id: "reviews", label: "Avaliações", icon: Users },
  { id: "pixels", label: "Pixels", icon: Megaphone },
  { id: "cta", label: "Link Redirecionamento", icon: Link2 },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, role, signOut, loading } = useAuth();
  const navigate = useNavigate();

  // Efeito para garantir que o tema dark seja aplicado ao body no admin
  useEffect(() => {
    document.documentElement.classList.add('dark');
    return () => {
      // Opcional: remover ao sair do admin se o resto do site não for dark
      // document.documentElement.classList.remove('dark');
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (!user) {
    navigate("/admin/login");
    return null;
  }

  const logout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex font-sans selection:bg-primary/30">
      {/* Sidebar */}
      <aside 
        className={`relative border-r border-zinc-800/50 bg-[#09090b] flex flex-col shrink-0 transition-all duration-500 ease-in-out z-50 ${
          isCollapsed ? "w-[80px]" : "w-[280px]"
        }`}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-zinc-800/30">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <span className="font-display font-black text-white text-sm">E</span>
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col"
              >
                <span className="font-display text-lg font-bold tracking-tight text-gradient-gold">ELLITE</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest -mt-1">Control Center</span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {!isCollapsed && (
            <p className="px-4 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">Menu Principal</p>
          )}
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 group relative ${
                activeTab === t.id
                  ? "bg-primary/10 text-primary font-semibold shadow-[inset_0_0_20px_rgba(251,191,36,0.05)]"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/40"
              }`}
            >
              <t.icon className={`w-[18px] h-[18px] transition-transform duration-300 ${activeTab === t.id ? "scale-110" : "group-hover:scale-110"}`} />
              {!isCollapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="truncate"
                >
                  {t.label}
                </motion.span>
              )}
              {activeTab === t.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                />
              )}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-zinc-800/30 bg-zinc-900/20">
          {!isCollapsed && (
            <div className="flex items-center gap-3 px-4 py-3 mb-2 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
              <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 border border-zinc-600">
                {user.email?.[0].toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-xs font-bold truncate text-zinc-200">{user.email?.split('@')[0]}</span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-tighter font-medium">Admin Ellite</span>
              </div>
            </div>
          )}
          
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-zinc-500 hover:text-rose-400 hover:bg-rose-500/5 transition-all duration-300 ${isCollapsed ? "justify-center" : ""}`}
          >
            <LogOut className="w-[18px] h-[18px]" />
            {!isCollapsed && <span className="font-medium">Encerrar Sessão</span>}
          </button>
        </div>

        {/* Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-24 w-6 h-6 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-primary hover:border-primary/50 transition-all shadow-xl z-[60]"
        >
          {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 border-b border-zinc-800/30 bg-[#09090b]/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold tracking-tight text-zinc-100">
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            <div className="h-4 w-px bg-zinc-800 mx-2" />
            <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              Ambiente Seguro
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
              <Search className="w-3.5 h-3.5" />
              <span className="text-[10px] font-medium uppercase tracking-wider">Buscar...</span>
              <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700 ml-2">⌘K</span>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="p-2 text-zinc-400 hover:text-zinc-100 transition-colors relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-[#09090b]" />
              </button>
              <div className="h-8 w-px bg-zinc-800 mx-1" />
              <div className="flex items-center gap-3 pl-2">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-zinc-200">{role?.replace('_', ' ').toUpperCase()}</p>
                  <p className="text-[10px] text-zinc-500 font-medium">SISTEMIO v5.0</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center shadow-inner">
                  <User className="w-5 h-5 text-zinc-400" />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-[#09090b]">
          <div className="max-w-[1600px] mx-auto p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(10px)" }}
                transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              >
                {activeTab === "dashboard" && <AdminDashboard />}
                {activeTab === "content" && <AdminContentEditor />}
                {activeTab === "gallery" && <AdminGallery />}
                {activeTab === "reviews" && <AdminReviews />}
                {activeTab === "pixels" && <AdminPixelManager />}
                {activeTab === "cta" && <AdminCTAManager />}
                {activeTab === "crm" && <AdminCRM />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46;
        }
        .text-gradient-gold {
          background: linear-gradient(to right, #FBBF24, #D97706);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default Admin;
