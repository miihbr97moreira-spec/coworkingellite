import { useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, Type, Megaphone, MessageCircle, Monitor, LogOut,
  Settings, Users, Kanban, Image,
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
  { id: "content", label: "Builder", icon: Type },
  { id: "gallery", label: "Galeria", icon: Image },
  { id: "reviews", label: "Avaliações", icon: Users },
  { id: "pixels", label: "Pixels", icon: Megaphone },
  { id: "cta", label: "Link Redirecionamento", icon: MessageCircle },
  { id: "crm", label: "CRM", icon: Kanban },
];

const Admin = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const { user, role, signOut, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>;

  if (!user) {
    navigate("/admin/login");
    return null;
  }

  const logout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 border-r border-border bg-secondary/30 flex flex-col shrink-0">
        <div className="p-6 border-b border-border">
          <span className="font-display text-xl font-bold text-gradient-gold">ELLITE</span>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Settings className="w-3 h-3" /> Painel Admin
          </p>
          {role && (
            <span className="inline-block mt-2 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full bg-primary/10 text-primary">
              {role.replace("_", " ")}
            </span>
          )}
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
          <p className="text-xs text-muted-foreground mb-2 truncate">{user.email}</p>
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
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
          {activeTab === "dashboard" && <AdminDashboard />}
          {activeTab === "content" && <AdminContentEditor />}
          {activeTab === "gallery" && <AdminGallery />}
          {activeTab === "reviews" && <AdminReviews />}
          {activeTab === "pixels" && <AdminPixelManager />}
          {activeTab === "cta" && <AdminCTAManager />}
          {activeTab === "crm" && <AdminCRM />}
        </motion.div>
      </main>
    </div>
  );
};

export default Admin;
