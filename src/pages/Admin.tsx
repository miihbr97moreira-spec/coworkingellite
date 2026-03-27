import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Type, Megaphone, LogOut,
  Settings, Users, Kanban, ListChecks, PanelLeftClose, PanelLeft, Globe2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AdminDashboardExpanded from "@/components/admin/AdminDashboardExpanded";
import AdminBuilderOmni from "@/components/admin/AdminBuilderOmni";
import AdminPixelManager from "@/components/admin/AdminPixelManager";
import AdminCRM from "@/components/admin/AdminCRM";
import AdminReviews from "@/components/admin/AdminReviews";
import AdminQuizBuilder from "@/components/admin/AdminQuizBuilder";
import AdminDomains from "@/components/admin/AdminDomains";
import AdminSettings from "@/components/admin/AdminSettings";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, module: "dashboard" },
  { id: "content", label: "Builder", icon: Type, module: "builder" },
  { id: "quiz", label: "Quiz Builder", icon: ListChecks, module: "quiz_builder" },
  { id: "reviews", label: "Avaliações", icon: Users, module: "reviews" },
  { id: "pixels", label: "Pixels", icon: Megaphone, module: "pixels" },
  { id: "crm", label: "CRM", icon: Kanban, module: "crm" },
  { id: "domains", label: "Domínios", icon: Globe2, module: "domains" },
  { id: "settings", label: "Configurações", icon: Settings, module: "settings" },
];

const SIDEBAR_KEY = "omni_sidebar_collapsed";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, role, signOut, loading, userLimits } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === "true"; } catch { return false; }
  });

  const toggleSidebar = () => {
    setCollapsed(p => {
      localStorage.setItem(SIDEBAR_KEY, String(!p));
      return !p;
    });
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate("/admin/login");
    }
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const logout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex admin-theme">
      <aside className={`border-r border-border bg-secondary/30 flex flex-col shrink-0 transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          {!collapsed && (
            <div>
              <span className="font-display text-lg font-bold text-gradient-terracota">Omni Builder</span>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Settings className="w-3 h-3" /> Painel Admin
              </p>
              {role && (
                <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-primary/10 text-primary">
                  {role.replace("_", " ")}
                </span>
              )}
            </div>
          )}
          <button onClick={toggleSidebar} className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground">
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {tabs.filter(t => 
            t.module === 'dashboard' || 
            role === 'super_admin' || 
            userLimits?.allowed_modules?.includes(t.module)
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              title={collapsed ? t.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === t.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <t.icon className="w-4 h-4 shrink-0" />
              {!collapsed && t.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={logout}
            title={collapsed ? "Sair" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && "Sair"}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-8"
        >
          {activeTab === "dashboard" && <AdminDashboardExpanded />}
          {activeTab === "content" && <AdminBuilderOmni />}
          {activeTab === "quiz" && <AdminQuizBuilder />}
          {activeTab === "reviews" && <AdminReviews />}
          {activeTab === "pixels" && <AdminPixelManager />}
          {activeTab === "crm" && <AdminCRM />}
          {activeTab === "domains" && <AdminDomains />}
          {activeTab === "settings" && <AdminSettings />}
        </motion.div>
      </main>
    </div>
  );
};

export default Admin;
