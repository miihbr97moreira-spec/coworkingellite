import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Type, ListChecks, LogOut, Menu, X,
  Settings, Kanban, Zap, PanelLeftClose, PanelLeft, ShieldAlert, Globe,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import AdminDashboardExpanded from "@/components/admin/AdminDashboardExpanded";
import AdminBuilderOmni from "@/components/admin/AdminBuilderOmni";
import AdminCRM from "@/components/admin/AdminCRM";
import AdminQuizBuilder from "@/components/admin/AdminQuizBuilder";
import OmniFlow from "@/components/admin/OmniFlow";
import TenantSettings from "@/components/admin/TenantSettings";
import SuperAdminPanel from "@/pages/SuperAdmin";
import OperatingSystem from "@/components/admin/OperatingSystem";

// Main navigation tabs (top-down order)
const mainTabs = [
  { id: "omni_os", label: "Omni OS", icon: Zap, module: "omni_os", badge: "NEW" },
  { id: "dashboard", label: "Dashboard", icon: BarChart3, module: "dashboard" },
  { id: "crm", label: "CRM", icon: Kanban, module: "crm" },
  { id: "content", label: "Builder Pages", icon: Type, module: "builder" },
  { id: "quiz", label: "Quizzes", icon: ListChecks, module: "quiz_builder" },
  { id: "omni_flow", label: "Omni Flow", icon: Zap, module: "omni_flow", badge: "BETA" },
];

const SIDEBAR_KEY = "omni_sidebar_collapsed";
const MOBILE_MENU_KEY = "omni_mobile_menu_open";
const SUPER_ADMIN_EMAIL = "jpm19990@gmail.com";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("omni_os");
  const { user, role, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) === "true"; } catch { return false; }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  const toggleSidebar = () => {
    setCollapsed(p => {
      localStorage.setItem(SIDEBAR_KEY, String(!p));
      return !p;
    });
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false); // Close mobile menu on tab change
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
    <div className="min-h-screen bg-background flex admin-theme overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex border-r border-border bg-secondary/30 flex-col shrink-0 transition-all duration-300 ${collapsed ? "w-16" : "w-64"}`}>
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
              onClick={() => handleTabChange(t.id)}
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
          {/* Theme Toggle */}
          <div className="flex justify-center mb-2">
            <ThemeToggle />
          </div>

          {/* Settings - Always visible */}
          <button
            onClick={() => handleTabChange("settings")}
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
            <>
              <button
                onClick={() => handleTabChange("super_admin")}
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
              <button
                onClick={() => handleTabChange("legacy_lp")}
                title={collapsed ? "Editar LP" : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeTab === "legacy_lp"
                    ? "bg-amber-500/10 text-amber-400 font-medium"
                    : "text-muted-foreground hover:text-amber-400 hover:bg-amber-950/20"
                } ${collapsed ? "justify-center" : ""}`}
              >
                <Globe className="w-4 h-4 shrink-0" />
                {!collapsed && "Editar LP"}
              </button>
            </>
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

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-secondary/30 border-b border-border z-50 h-16 flex items-center justify-between px-4">
        <span className="font-display text-lg font-bold text-gradient-terracota">Omni</span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          className="md:hidden fixed top-16 left-0 right-0 bg-secondary/30 border-b border-border z-40 max-h-[calc(100vh-64px)] overflow-y-auto"
        >
          <nav className="p-2 space-y-1">
            {mainTabs.map((t) => (
              <button
                key={t.id}
                onClick={() => handleTabChange(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  activeTab === t.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <t.icon className="w-4 h-4 shrink-0" />
                <span className="flex items-center gap-2 flex-1">
                  {t.label}
                  {t.badge && (
                    <span className="ml-auto px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      {t.badge}
                    </span>
                  )}
                </span>
              </button>
            ))}

            <div className="border-t border-border my-2 pt-2 space-y-1">
              <button
                onClick={() => handleTabChange("settings")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                  activeTab === "settings"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                Configurações
              </button>

              {isSuperAdmin && (
                <>
                  <button
                    onClick={() => handleTabChange("super_admin")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                      activeTab === "super_admin"
                        ? "bg-red-500/10 text-red-400 font-medium"
                        : "text-muted-foreground hover:text-red-400 hover:bg-red-950/20"
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    Super Admin
                  </button>
                  <button
                    onClick={() => handleTabChange("legacy_lp")}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${
                      activeTab === "legacy_lp"
                        ? "bg-amber-500/10 text-amber-400 font-medium"
                        : "text-muted-foreground hover:text-amber-400 hover:bg-amber-950/20"
                    }`}
                  >
                    <Globe className="w-4 h-4 shrink-0" />
                    Editar LP
                  </button>
                </>
              )}

              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                Sair
              </button>
            </div>
          </nav>
        </motion.div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto mt-16 md:mt-0">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className={activeTab === "omni_os" ? "p-0 h-screen" : "p-4 md:p-8"}
        >
          {activeTab === "omni_os" && <OperatingSystem />}
          {activeTab === "dashboard" && <AdminDashboardExpanded />}
          {activeTab === "crm" && <AdminCRM />}
          {activeTab === "content" && <AdminBuilderOmni />}
          {activeTab === "quiz" && <AdminQuizBuilder />}
          {activeTab === "omni_flow" && <OmniFlow />}
          {activeTab === "settings" && <TenantSettings />}
          {activeTab === "super_admin" && isSuperAdmin && <SuperAdminPanel />}
          {activeTab === "legacy_lp" && isSuperAdmin && <AdminBuilderOmni isLegacyLP={true} />}
        </motion.div>
      </main>
    </div>
  );
};

export default Admin;
