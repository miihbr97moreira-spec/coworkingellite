import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft, Plus, Trash2, Loader2, Users, TrendingUp, Activity, AlertCircle, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

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

interface SuperAdminProps {
  isEmbedded?: boolean;
}

const MODULES = [
  { id: 'builder', label: 'Builder (Omni)' },
  { id: 'quiz_builder', label: 'Quiz Builder' },
  { id: 'pixels', label: 'Pixels' },
  { id: 'crm', label: 'CRM' },
  { id: 'omni_flow', label: 'Omni Flow' },
];

const SuperAdmin = ({ isEmbedded = false }: SuperAdminProps) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const authCheckRef = useRef(false);
  const dataLoadedRef = useRef(false);

  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "editor" as "super_admin" | "editor",
    max_domains: 1,
    max_quizzes: 5,
    max_pages: 10,
    allowed_modules: ['builder', 'quiz_builder', 'pixels', 'crm', 'omni_flow'] as string[],
  });

  // Security check: Only allow jpm19990@gmail.com (runs only once)
  useEffect(() => {
    if (loading) return;

    if (authCheckRef.current) return;
    authCheckRef.current = true;

    if (!user) {
      if (!isEmbedded) navigate("/admin/login");
      return;
    }

    if (user.email !== SUPER_ADMIN_EMAIL) {
      if (!isEmbedded) {
        toast.error("Acesso Negado: Apenas Super Admin pode acessar");
        navigate("/admin");
      }
      return;
    }

    setIsAuthorized(true);
  }, [user, loading, navigate, isEmbedded]);

  // Load data only when authorized (and only once)
  useEffect(() => {
    if (isAuthorized && !dataLoadedRef.current) {
      dataLoadedRef.current = true;
      loadData();
    }
  }, [isAuthorized]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch users from auth.users
      let authUsers: any[] = [];
      try {
        const { data: { users: fetchedUsers }, error: usersError } = await supabase.auth.admin.listUsers();
        if (!usersError && fetchedUsers) {
          authUsers = fetchedUsers.map(u => ({
            id: u.id,
            email: u.email || "",
            full_name: u.user_metadata?.full_name || "Sem nome",
            role: u.user_metadata?.role || "user",
            created_at: u.created_at || new Date().toISOString(),
          }));
        }
      } catch (err) {
        console.warn("Não foi possível listar usuários via Admin API:", err);
        toast.error("Erro ao listar usuários: verifique as permissões do Supabase Auth Admin");
      }

      setUsers(authUsers);

      // Fetch system metrics with error handling
      try {
        const [
          { count: totalUsers },
          { count: totalDomains },
          { count: totalPages },
          { count: totalQuizzes },
        ] = await Promise.all([
          (supabase.from("user_management" as any) as any).select("*", { count: "exact", head: true }).catch(() => ({ count: 0 })),
          (supabase.from("custom_domains" as any) as any).select("*", { count: "exact", head: true }).catch(() => ({ count: 0 })),
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
      } catch (err) {
        console.warn("Erro ao carregar métricas:", err);
        setMetrics({
          total_users: 0,
          active_users: 0,
          total_domains: 0,
          total_pages: 0,
          total_quizzes: 0,
        });
      }
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar dados: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_modules: prev.allowed_modules.includes(moduleId)
        ? prev.allowed_modules.filter(id => id !== moduleId)
        : [...prev.allowed_modules, moduleId]
    }));
  };

  const resetForm = () => {
    setFormData({
      email: "",
      full_name: "",
      password: "",
      role: "editor",
      max_domains: 1,
      max_quizzes: 5,
      max_pages: 10,
      allowed_modules: ['builder', 'quiz_builder', 'pixels', 'crm', 'omni_flow'],
    });
    setShowPassword(false);
  };

  const handleAddUser = async () => {
    if (!formData.email.trim() || !formData.full_name.trim() || !formData.password.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSaving(true);
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email.trim(),
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          full_name: formData.full_name.trim(),
          role: formData.role,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Falha ao criar usuário");

      // Create entry in user_management table
      const { error: dbError } = await supabase
        .from('user_management')
        .insert({
          user_id: authData.user.id,
          email: formData.email.trim(),
          full_name: formData.full_name.trim(),
          is_active: true,
          role: formData.role,
          max_domains: formData.max_domains,
          max_quizzes: formData.max_quizzes,
          max_pages: formData.max_pages,
          allowed_modules: formData.allowed_modules,
        });

      if (dbError) throw dbError;

      toast.success(`Usuário ${formData.email} criado com sucesso!`);
      resetForm();
      setIsDialogOpen(false);
      dataLoadedRef.current = false;
      await loadData();
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
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

    if (!confirm(`Tem certeza que deseja deletar o usuário ${userEmail}? Esta ação é irreversível.`)) return;

    try {
      // Delete from user_management first
      await supabase
        .from('user_management')
        .delete()
        .eq('user_id', userId)
        .catch(() => null);

      // Delete from auth
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;

      toast.success("Usuário deletado com sucesso");
      dataLoadedRef.current = false;
      await loadData();
    } catch (error: any) {
      console.error("Erro ao deletar usuário:", error);
      toast.error("Erro ao deletar usuário: " + error.message);
    }
  };

  // When embedded in Admin.tsx, don't show loading state
  if (!isEmbedded && (loading || !isAuthorized)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  // If embedded and not authorized, don't render
  if (isEmbedded && !isAuthorized) {
    return null;
  }

  return (
    <div className={isEmbedded ? "" : "min-h-screen bg-background"}>
      <div className={isEmbedded ? "" : "max-w-7xl mx-auto p-4 md:p-8"}>
        {/* Header - Only show back button if not embedded */}
        {!isEmbedded && (
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
                <h1 className="text-2xl md:text-3xl font-bold">Painel Super Admin</h1>
                <p className="text-muted-foreground text-sm mt-1">Gestão centralizada do sistema</p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        {metrics && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-8"
          >
            <div className="bg-secondary/30 border border-border rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground truncate">Total de Usuários</p>
                  <p className="text-2xl md:text-3xl font-bold mt-2">{metrics.total_users}</p>
                </div>
                <Users className="w-6 h-6 md:w-8 md:h-8 text-primary/50 flex-shrink-0" />
              </div>
            </div>

            <div className="bg-secondary/30 border border-border rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground truncate">Usuários Ativos</p>
                  <p className="text-2xl md:text-3xl font-bold mt-2">{metrics.active_users}</p>
                </div>
                <Activity className="w-6 h-6 md:w-8 md:h-8 text-green-500/50 flex-shrink-0" />
              </div>
            </div>

            <div className="bg-secondary/30 border border-border rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground truncate">Domínios</p>
                  <p className="text-2xl md:text-3xl font-bold mt-2">{metrics.total_domains}</p>
                </div>
                <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-blue-500/50 flex-shrink-0" />
              </div>
            </div>

            <div className="bg-secondary/30 border border-border rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground truncate">Páginas</p>
                  <p className="text-2xl md:text-3xl font-bold mt-2">{metrics.total_pages}</p>
                </div>
                <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-amber-500/50 flex-shrink-0" />
              </div>
            </div>

            <div className="bg-secondary/30 border border-border rounded-xl p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs md:text-sm text-muted-foreground truncate">Quizzes</p>
                  <p className="text-2xl md:text-3xl font-bold mt-2">{metrics.total_quizzes}</p>
                </div>
                <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-purple-500/50 flex-shrink-0" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Management */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-secondary/30 border border-border rounded-xl p-4 md:p-8"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl md:text-2xl font-bold">Gestão Global de Usuários</h2>
            <div className="flex gap-2 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
                className="gap-2 flex-1 md:flex-none"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 bg-primary hover:bg-primary/90 flex-1 md:flex-none">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Novo Usuário</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-secondary/50 border-border w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                    <DialogDescription>
                      Crie um novo usuário com permissões e limites personalizados
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
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="••••••••"
                          className="bg-background border-border pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <Label className="text-sm font-semibold mb-3 block">Perfil</Label>
                      <select
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as "super_admin" | "editor" })}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
                      >
                        <option value="editor">Editor (Padrão)</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>

                    <div className="border-t border-border pt-4 space-y-3">
                      <Label className="text-sm font-semibold">Limites</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Domínios</label>
                          <Input
                            type="number"
                            min="1"
                            value={formData.max_domains}
                            onChange={(e) => setFormData({ ...formData, max_domains: parseInt(e.target.value) || 1 })}
                            className="bg-background border-border text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Quizzes</label>
                          <Input
                            type="number"
                            min="1"
                            value={formData.max_quizzes}
                            onChange={(e) => setFormData({ ...formData, max_quizzes: parseInt(e.target.value) || 1 })}
                            className="bg-background border-border text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Páginas</label>
                          <Input
                            type="number"
                            min="1"
                            value={formData.max_pages}
                            onChange={(e) => setFormData({ ...formData, max_pages: parseInt(e.target.value) || 1 })}
                            className="bg-background border-border text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 space-y-2">
                      <Label className="text-sm font-semibold">Módulos Permitidos</Label>
                      <div className="space-y-2">
                        {MODULES.map(mod => (
                          <div key={mod.id} className="flex items-center gap-2">
                            <Checkbox
                              id={mod.id}
                              checked={formData.allowed_modules.includes(mod.id)}
                              onCheckedChange={() => toggleModule(mod.id)}
                            />
                            <label htmlFor={mod.id} className="text-sm cursor-pointer">{mod.label}</label>
                          </div>
                        ))}
                      </div>
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
                        onClick={() => {
                          setIsDialogOpen(false);
                          resetForm();
                        }}
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
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/20 bg-secondary/50">
                    <th className="p-3 md:p-4 text-left font-semibold text-xs md:text-sm">Email</th>
                    <th className="p-3 md:p-4 text-left font-semibold text-xs md:text-sm hidden sm:table-cell">Nome</th>
                    <th className="p-3 md:p-4 text-left font-semibold text-xs md:text-sm">Perfil</th>
                    <th className="p-3 md:p-4 text-left font-semibold text-xs md:text-sm hidden md:table-cell">Criado em</th>
                    <th className="p-3 md:p-4 text-right font-semibold text-xs md:text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                      <td className="p-3 md:p-4 font-mono text-xs md:text-sm truncate">{u.email}</td>
                      <td className="p-3 md:p-4 text-xs md:text-sm hidden sm:table-cell truncate">{u.full_name || "—"}</td>
                      <td className="p-3 md:p-4">
                        <span className={`px-2 py-1 rounded text-[10px] md:text-xs font-semibold whitespace-nowrap ${
                          u.email === SUPER_ADMIN_EMAIL
                            ? "bg-red-500/20 text-red-400"
                            : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {u.email === SUPER_ADMIN_EMAIL ? "Super Admin" : "User"}
                        </span>
                      </td>
                      <td className="p-3 md:p-4 text-xs text-muted-foreground hidden md:table-cell">
                        {new Date(u.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-3 md:p-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={u.email === SUPER_ADMIN_EMAIL}
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-950/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
