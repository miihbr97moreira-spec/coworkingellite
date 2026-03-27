import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Type, ListChecks, LogOut,
  Settings, Kanban, Zap, PanelLeftClose, PanelLeft, ShieldAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AdminDashboardExpanded from "@/components/admin/AdminDashboardExpanded";
import AdminBuilderOmni from "@/components/admin/AdminBuilderOmni";
import AdminCRM from "@/components/admin/AdminCRM";
import AdminQuizBuilder from "@/components/admin/AdminQuizBuilder";
import OmniFlow from "@/components/admin/OmniFlow";
import AdminSettings from "@/components/admin/AdminSettings";

// Main navigation tabs (top-down order)
const mainTabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3, module: "dashboard" },
  { id: "crm", label: "CRM", icon: Kanban, module: "crm" },
  { id: "content", label: "Builder Pages", icon: Type, module: "builder" },
  { id: "quiz", label: "Quizzes", icon: ListChecks, module: "quiz_builder" },
  { id: "omni_flow", label: "Omni Flow", icon: Zap, module: "omni_flow", badge: "BETA" },
];

const SIDEBAR_KEY = "omni_sidebar_collapsed";
const SUPER_ADMIN_EMAIL = "jpm19990@gmail.com";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, role, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === "true"; } catch { return false; }
  });

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

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
        {/* Header */}
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

        {/* Main Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {mainTabs.map((t) => (
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
              {!collapsed && (
                <span className="flex items-center gap-2">
                  {t.label}
                  {t.badge && (
                    <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {t.badge}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-border space-y-1">
          {/* Settings - Always visible */}
          <button
            onClick={() => setActiveTab("settings")}
            title={collapsed ? "Configurações" : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activeTab === "settings"
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            {!collapsed && "Configurações"}
          </button>

          {/* Super Admin - Conditional */}
          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab("super_admin")}
              title={collapsed ? "Super Admin" : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === "super_admin"
                  ? "bg-red-500/10 text-red-400 font-medium"
                  : "text-muted-foreground hover:text-red-400 hover:bg-red-950/20"
              } ${collapsed ? "justify-center" : ""}`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              {!collapsed && "Super Admin"}
            </button>
          )}

          {/* Logout */}
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-8"
        >
          {activeTab === "dashboard" && <AdminDashboardExpanded />}
          {activeTab === "crm" && <AdminCRM />}
          {activeTab === "content" && <AdminBuilderOmni />}
          {activeTab === "quiz" && <AdminQuizBuilder />}
          {activeTab === "omni_flow" && <OmniFlow />}
          {activeTab === "settings" && <AdminSettings />}
          {activeTab === "super_admin" && isSuperAdmin && (
            <div className="text-center py-12">
              <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-2">Painel Super Admin</h1>
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
};

export default Admin;
