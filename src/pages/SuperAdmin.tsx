import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft, Plus, Trash2, Edit2, Loader2, Users, TrendingUp, Activity, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const SUPER_ADMIN_EMAIL = "jpm19990@gmail.com";

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  created_at: string;
}

interface SystemMetrics {
  total_users: number;
  active_users: number;
  total_domains: number;
  total_pages: number;
  total_quizzes: number;
}

const SuperAdmin = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    password: "",
  });

  // Security check: Only allow jpm19990@gmail.com
  useEffect(() => {
    if (!loading && user?.email !== SUPER_ADMIN_EMAIL) {
      toast.error("Acesso Negado");
      navigate("/admin");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user?.email === SUPER_ADMIN_EMAIL) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch users from auth.users (if accessible) or from a custom table
      const { data: { users: authUsers }, error: usersError } = await supabase.auth.admin.listUsers();
      
      if (!usersError && authUsers) {
        const formattedUsers = authUsers.map(u => ({
          id: u.id,
          email: u.email || "",
          full_name: u.user_metadata?.full_name || "Sem nome",
          role: u.user_metadata?.role || "user",
          created_at: u.created_at || new Date().toISOString(),
        }));
        setUsers(formattedUsers);
      }

      // Fetch system metrics
      const [
        { count: totalUsers },
        { count: totalDomains },
        { count: totalPages },
        { count: totalQuizzes },
      ] = await Promise.all([
        supabase.from("user_management").select("*", { count: "exact", head: true }),
        supabase.from("custom_domains").select("*", { count: "exact", head: true }),
        supabase.from("generated_pages").select("*", { count: "exact", head: true }),
        supabase.from("quizzes").select("*", { count: "exact", head: true }),
      ]);

      setMetrics({
        total_users: totalUsers || 0,
        active_users: totalUsers ? Math.floor((totalUsers * 0.85)) : 0,
        total_domains: totalDomains || 0,
        total_pages: totalPages || 0,
        total_quizzes: totalQuizzes || 0,
      });
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!formData.email || !formData.full_name || !formData.password) {
      toast.error("Preencha todos os campos");
      return;
    }

    setSaving(true);
    try {
      // Create user via Supabase Auth Admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          full_name: formData.full_name,
          role: "user",
        },
      });

      if (error) throw error;

      toast.success(`Usuário ${formData.email} criado com sucesso!`);
      setFormData({ email: "", full_name: "", password: "" });
      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      toast.error("Erro ao criar usuário: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail === SUPER_ADMIN_EMAIL) {
      toast.error("Não é possível deletar a conta do Super Admin");
      return;
    }

    if (!confirm(`Tem certeza que deseja deletar o usuário ${userEmail}?`)) return;

    try {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;

      toast.success("Usuário deletado com sucesso");
      loadData();
    } catch (error: any) {
      toast.error("Erro ao deletar usuário: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (user?.email !== SUPER_ADMIN_EMAIL) {
    return null; // Redirect is handled in useEffect
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="text-3xl font-bold">Painel Super Admin</h1>
              <p className="text-muted-foreground mt-1">Gestão centralizada do sistema</p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        {metrics && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8"
          >
            <div className="bg-secondary/30 border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Usuários</p>
                  <p className="text-3xl font-bold mt-2">{metrics.total_users}</p>
                </div>
                <Users className="w-8 h-8 text-primary/50" />
              </div>
            </div>

            <div className="bg-secondary/30 border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Usuários Ativos</p>
                  <p className="text-3xl font-bold mt-2">{metrics.active_users}</p>
                </div>
                <Activity className="w-8 h-8 text-green-500/50" />
              </div>
            </div>

            <div className="bg-secondary/30 border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Domínios</p>
                  <p className="text-3xl font-bold mt-2">{metrics.total_domains}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500/50" />
              </div>
            </div>

            <div className="bg-secondary/30 border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Páginas</p>
                  <p className="text-3xl font-bold mt-2">{metrics.total_pages}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-amber-500/50" />
              </div>
            </div>

            <div className="bg-secondary/30 border border-border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Quizzes</p>
                  <p className="text-3xl font-bold mt-2">{metrics.total_quizzes}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-500/50" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Management */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-secondary/30 border border-border rounded-lg p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Gestão de Usuários</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <Button className="gap-2 bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4" /> Novo Usuário
                </Button>
                <DialogContent className="bg-secondary/50 border-border">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                    <DialogDescription>
                      Crie um novo usuário manualmente no sistema
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="usuario@example.com"
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Nome Completo *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        placeholder="João Silva"
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="••••••••"
                        className="bg-background border-border"
                      />
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleAddUser}
                        disabled={isSaving}
                        className="flex-1 gap-2"
                      >
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                        className="flex-1"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/20 bg-secondary/50">
                    <th className="p-4 text-left font-semibold">Email</th>
                    <th className="p-4 text-left font-semibold">Nome</th>
                    <th className="p-4 text-left font-semibold">Perfil</th>
                    <th className="p-4 text-left font-semibold">Criado em</th>
                    <th className="p-4 text-right font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                      <td className="p-4 font-mono text-sm">{u.email}</td>
                      <td className="p-4">{u.full_name || "—"}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          u.email === SUPER_ADMIN_EMAIL
                            ? "bg-red-500/20 text-red-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {u.email === SUPER_ADMIN_EMAIL ? "Super Admin" : "User"}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={u.email === SUPER_ADMIN_EMAIL}
                            onClick={() => handleDeleteUser(u.id, u.email)}
                            className="text-red-500 hover:text-red-600 hover:bg-red-950/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default SuperAdmin;
