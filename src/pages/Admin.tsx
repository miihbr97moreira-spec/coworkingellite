import { useState } from "react";
import { useSiteContent } from "@/context/SiteContext";
import { motion } from "framer-motion";
import {
  BarChart3,
  Type,
  Megaphone,
  MessageCircle,
  Monitor,
  LogOut,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AdminContentEditor from "@/components/admin/AdminContentEditor";
import AdminPixelManager from "@/components/admin/AdminPixelManager";
import AdminCTAManager from "@/components/admin/AdminCTAManager";
import AdminPreview from "@/components/admin/AdminPreview";

const tabs = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "content", label: "Conteúdo", icon: Type },
  { id: "pixels", label: "Pixels", icon: Megaphone },
  { id: "cta", label: "CTAs WhatsApp", icon: MessageCircle },
  { id: "preview", label: "Preview", icon: Monitor },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { isAdmin, setIsAdmin } = useSiteContent();
  const navigate = useNavigate();

  if (!isAdmin) {
    navigate("/admin/login");
    return null;
  }

  const logout = () => {
    setIsAdmin(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-secondary/30 flex flex-col shrink-0">
        <div className="p-6 border-b border-border">
          <span className="font-display text-xl font-bold text-gradient-gold">ELLITE</span>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Settings className="w-3 h-3" /> Painel Admin
          </p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === t.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <t.icon className="w-4 h-4" />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-border">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-8"
        >
          {activeTab === "dashboard" && <AdminDashboard />}
          {activeTab === "content" && <AdminContentEditor />}
          {activeTab === "pixels" && <AdminPixelManager />}
          {activeTab === "cta" && <AdminCTAManager />}
          {activeTab === "preview" && <AdminPreview />}
        </motion.div>
      </main>
    </div>
  );
};

export default Admin;
