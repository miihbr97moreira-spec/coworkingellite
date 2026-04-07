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

interface ManagedUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  max_domains: number;
  max_quizzes: number;
  max_pages: number;
  allowed_modules: string[];
  is_active: boolean;
  created_at: string;
}

interface SystemMetrics {
  total_users: number;
  total_domains: number;
  total_pages: number;
  total_quizzes: number;
}

interface SuperAdminProps {
  isEmbedded?: boolean;
}

const MODULES = [
  { id: "builder", label: "Builder (Omni)" },
  { id: "quiz_builder", label: "Quiz Builder" },
  { id: "pixels", label: "Pixels" },
  { id: "crm", label: "CRM" },
  { id: "omni_flow", label: "Omni Flow" },
];

const SuperAdmin = ({ isEmbedded = false }: SuperAdminProps) => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
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
    allowed_modules: ["builder", "quiz_builder", "pixels", "crm", "omni_flow"] as string[],
  });

  // Helper to call edge function
  const callManageUsers = async (body: Record<string, any>) => {
    const { data, error } = await supabase.functions.invoke("manage-users", { body });
    if (error) throw new Error(error.message);
    if (data?.error) throw new Error(data.error);
    return data;
  };

  useEffect(() => {
    if (loading || authCheckRef.current) return;
    authCheckRef.current = true;
    if (!user) { if (!isEmbedded) navigate("/admin/login"); return; }
    if (user.email !== SUPER_ADMIN_EMAIL) {
      if (!isEmbedded) { toast.error("Acesso Negado"); navigate("/admin"); }
      return;
    }
    setIsAuthorized(true);
  }, [user, loading, navigate, isEmbedded]);

  useEffect(() => {
    if (isAuthorized && !dataLoadedRef.current) {
      dataLoadedRef.current = true;
      loadData();
    }
  }, [isAuthorized]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersRes, metricsRes] = await Promise.all([
        callManageUsers({ action: "list_users" }),
        callManageUsers({ action: "get_metrics" }),
      ]);
      setUsers(usersRes.users || []);
      setMetrics(metricsRes);
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
      toast.error("Erro: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleModule = (moduleId: string) => {
    setFormData(prev => ({
      ...prev,
      allowed_modules: prev.allowed_modules.includes(moduleId)
        ? prev.allowed_modules.filter(id => id !== moduleId)
        : [...prev.allowed_modules, moduleId],
    }));
  };

  const resetForm = () => {
    setFormData({
      email: "", full_name: "", password: "", role: "editor",
      max_domains: 1, max_quizzes: 5, max_pages: 10,
      allowed_modules: ["builder", "quiz_builder", "pixels", "crm", "omni_flow"],
    });
    setShowPassword(false);
  };

  const handleAddUser = async () => {
    if (!formData.email.trim() || !formData.full_name.trim() || !formData.password.trim()) {
      return toast.error("Preencha todos os campos obrigatórios");
    }
    setSaving(true);
    try {
      await callManageUsers({ action: "create_user", ...formData });
      toast.success(`Usuário ${formData.email} criado com sucesso!`);
      resetForm();
      setIsDialogOpen(false);
      dataLoadedRef.current = false;
      await loadData();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (userEmail === SUPER_ADMIN_EMAIL) return toast.error("Não é possível deletar o Super Admin");
    if (!confirm(`Deletar ${userEmail}? Ação irreversível.`)) return;
    try {
      await callManageUsers({ action: "delete_user", user_id: userId });
      toast.success("Usuário deletado");
      dataLoadedRef.current = false;
      await loadData();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    }
  };

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

  if (isEmbedded && !isAuthorized) return null;

  const inputCls = "bg-background border-border";

  return (
    <div className={isEmbedded ? "" : "min-h-screen bg-background"}>
      <div className={isEmbedded ? "" : "max-w-7xl mx-auto p-4 md:p-8"}>
        {!isEmbedded && (
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}><ArrowLeft className="w-4 h-4" /></Button>
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-red-500" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Painel Super Admin</h1>
                <p className="text-muted-foreground text-sm mt-1">Gestão centralizada do sistema</p>
              </div>
            </div>
          </div>
        )}

        {/* Metrics */}
        {metrics && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
            {[
              { label: "Usuários", value: metrics.total_users, icon: Users, color: "text-primary/50" },
              { label: "Domínios", value: metrics.total_domains, icon: TrendingUp, color: "text-blue-500/50" },
              { label: "Páginas", value: metrics.total_pages, icon: Activity, color: "text-amber-500/50" },
              { label: "Quizzes", value: metrics.total_quizzes, icon: TrendingUp, color: "text-purple-500/50" },
            ].map(m => (
              <div key={m.label} className="bg-secondary/30 border border-border rounded-xl p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{m.label}</p>
                    <p className="text-2xl md:text-3xl font-bold mt-2">{m.value}</p>
                  </div>
                  <m.icon className={`w-6 h-6 md:w-8 md:h-8 ${m.color} shrink-0`} />
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Users Table */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-secondary/30 border border-border rounded-xl p-4 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl md:text-2xl font-bold">Gestão de Usuários</h2>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" size="sm" onClick={() => { dataLoadedRef.current = false; loadData(); }} disabled={isLoading} className="gap-2 flex-1 md:flex-none">
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Atualizar</span>
              </Button>

              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2 flex-1 md:flex-none"><Plus className="w-4 h-4" /><span className="hidden sm:inline">Novo Usuário</span></Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                    <DialogDescription>Crie um usuário com permissões e limites personalizados</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="usuario@example.com" className={inputCls} />
                    </div>
                    <div className="space-y-2">
                      <Label>Nome Completo *</Label>
                      <Input value={formData.full_name} onChange={e => setFormData({ ...formData, full_name: e.target.value })} placeholder="João Silva" className={inputCls} />
                    </div>
                    <div className="space-y-2">
                      <Label>Senha *</Label>
                      <div className="relative">
                        <Input type={showPassword ? "text" : "password"} value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="••••••••" className={`${inputCls} pr-10`} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4">
                      <Label className="text-sm font-semibold mb-3 block">Perfil</Label>
                      <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm">
                        <option value="editor">Editor (Padrão)</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>

                    <div className="border-t border-border pt-4 space-y-3">
                      <Label className="text-sm font-semibold">Limites</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { key: "max_domains", label: "Domínios" },
                          { key: "max_quizzes", label: "Quizzes" },
                          { key: "max_pages", label: "Páginas" },
                        ].map(f => (
                          <div key={f.key}>
                            <label className="text-xs text-muted-foreground">{f.label}</label>
                            <Input type="number" min="1" value={(formData as any)[f.key]}
                              onChange={e => setFormData({ ...formData, [f.key]: parseInt(e.target.value) || 1 })}
                              className={`${inputCls} text-sm`} />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 space-y-2">
                      <Label className="text-sm font-semibold">Módulos Permitidos</Label>
                      <div className="space-y-2">
                        {MODULES.map(mod => (
                          <div key={mod.id} className="flex items-center gap-2">
                            <Checkbox id={mod.id} checked={formData.allowed_modules.includes(mod.id)} onCheckedChange={() => toggleModule(mod.id)} />
                            <label htmlFor={mod.id} className="text-sm cursor-pointer">{mod.label}</label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button onClick={handleAddUser} disabled={isSaving} className="flex-1 gap-2">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Criar"}
                      </Button>
                      <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="flex-1">Cancelar</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
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
                    <th className="p-3 text-left font-semibold text-xs">Email</th>
                    <th className="p-3 text-left font-semibold text-xs hidden sm:table-cell">Nome</th>
                    <th className="p-3 text-left font-semibold text-xs">Perfil</th>
                    <th className="p-3 text-left font-semibold text-xs hidden md:table-cell">Limites</th>
                    <th className="p-3 text-left font-semibold text-xs hidden md:table-cell">Criado</th>
                    <th className="p-3 text-right font-semibold text-xs">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                      <td className="p-3 font-mono text-xs truncate max-w-[200px]">{u.email}</td>
                      <td className="p-3 text-xs hidden sm:table-cell truncate">{u.full_name || "—"}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-semibold ${
                          u.role === "super_admin" ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {u.role === "super_admin" ? "Super Admin" : "Editor"}
                        </span>
                      </td>
                      <td className="p-3 text-[10px] text-muted-foreground hidden md:table-cell">
                        {u.max_pages}pg · {u.max_quizzes}qz · {u.max_domains}dom
                      </td>
                      <td className="p-3 text-xs text-muted-foreground hidden md:table-cell">
                        {new Date(u.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="p-3 text-right">
                        <Button variant="ghost" size="sm" disabled={u.email === SUPER_ADMIN_EMAIL}
                          onClick={() => handleDeleteUser(u.id, u.email)}
                          className="text-red-500 hover:text-red-600 hover:bg-red-950/20">
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
