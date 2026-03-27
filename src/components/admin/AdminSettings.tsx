import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Shield, Plus, Edit2, Trash2, Eye, EyeOff, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface ManagedUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role: "super_admin" | "editor";
  created_at: string;
}

async function callManageUsers(action: string, payload: Record<string, unknown> = {}) {
  try {
    const { data, error } = await supabase.functions.invoke('manage-users', {
      body: { action, ...payload },
    });

    if (error) {
      console.error("Erro retornado pela Edge Function:", error);
      
      // Tratamento de erros específicos de rede/CORS
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        throw new Error("Erro de conexão com o servidor. Verifique se a função 'manage-users' foi publicada no Supabase.");
      }
      
      // Tratamento de erro 404
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        throw new Error("Função de gerenciamento não encontrada (404). É necessário realizar o deploy no Supabase.");
      }

      throw new Error(error.message || "Erro inesperado na comunicação com o servidor.");
    }

    return data;
  } catch (err: any) {
    console.error("Falha crítica na chamada da função:", err);
    
    // Fallback amigável para erro de rede genérico
    if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
      throw new Error("Não foi possível conectar ao servidor do Supabase. Verifique se o deploy da função foi realizado e se as configurações de CORS estão corretas.");
    }
    
    throw err;
  }
}

const AdminSettings = () => {
  const { user, role } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    password: "",
    role: "editor" as "super_admin" | "editor",
  });

  const isSuperAdmin = role === "super_admin";

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await callManageUsers("list");
      setUsers(data.users ?? []);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!formData.email.trim() || !formData.full_name.trim() || !formData.password.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setSaving(true);
    try {
      await callManageUsers("create", {
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        password: formData.password,
        role: formData.role,
      });
      toast.success("Usuário criado com sucesso! Ele já pode fazer login.");
      setFormData({ email: "", full_name: "", password: "", role: "editor" });
      setNewUserOpen(false);
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao criar usuário");
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    if (!formData.email.trim() || !formData.full_name.trim()) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    if (formData.password && formData.password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        user_id: editingUser.user_id,
        email: formData.email.trim(),
        full_name: formData.full_name.trim(),
        role: formData.role,
      };
      if (formData.password) payload.password = formData.password;

      await callManageUsers("update", payload);
      toast.success("Usuário atualizado com sucesso!");
      setEditingUser(null);
      setFormData({ email: "", full_name: "", password: "", role: "editor" });
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar usuário");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (managedUser: ManagedUser) => {
    if (managedUser.user_id === user?.id) {
      toast.error("Você não pode deletar sua própria conta");
      return;
    }
    if (!confirm(`Tem certeza que deseja remover o usuário "${managedUser.full_name}"? Esta ação é irreversível.`)) return;

    try {
      await callManageUsers("delete", { user_id: managedUser.user_id });
      toast.success("Usuário removido com sucesso!");
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao remover usuário");
    }
  };

  const toggleUserStatus = async (managedUser: ManagedUser) => {
    if (managedUser.user_id === user?.id) {
      toast.error("Você não pode desativar sua própria conta");
      return;
    }

    const newStatus = !managedUser.is_active;
    try {
      await callManageUsers("toggle_status", {
        user_id: managedUser.user_id,
        is_active: newStatus,
      });
      toast.success(newStatus ? "Usuário ativado!" : "Usuário desativado!");
      await loadUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao alterar status");
    }
  };

  const openEditDialog = (managedUser: ManagedUser) => {
    setEditingUser(managedUser);
    setFormData({
      email: managedUser.email,
      full_name: managedUser.full_name,
      password: "",
      role: managedUser.role,
    });
  };

  const closeDialog = () => {
    setNewUserOpen(false);
    setEditingUser(null);
    setFormData({ email: "", full_name: "", password: "", role: "editor" });
    setShowPassword(false);
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <Shield className="w-12 h-12 text-muted-foreground/50" />
        <div>
          <p className="font-semibold text-lg">Acesso Restrito</p>
          <p className="text-muted-foreground text-sm mt-1">
            Apenas o Super Admin pode gerenciar usuários.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando usuários...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Configurações</h2>
        <p className="text-muted-foreground">Gerencie usuários e permissões do sistema</p>
      </div>

      {/* Ações */}
      <div className="flex justify-between items-center">
        <button
          onClick={loadUsers}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Atualizar lista
        </button>
        <Button
          onClick={() => {
            setEditingUser(null);
            setFormData({ email: "", full_name: "", password: "", role: "editor" });
            setNewUserOpen(true);
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Novo Usuário
        </Button>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-secondary/30 rounded-lg border border-border/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/20 bg-secondary/50">
                <th className="p-4 text-left font-semibold">Nome</th>
                <th className="p-4 text-left font-semibold">Email</th>
                <th className="p-4 text-center font-semibold">Perfil</th>
                <th className="p-4 text-center font-semibold">Status</th>
                <th className="p-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Nenhum usuário cadastrado. Clique em "Novo Usuário" para adicionar.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border/10 hover:bg-secondary/20 transition-colors"
                  >
                    <td className="p-4 font-medium">
                      {u.full_name}
                      {u.user_id === user?.id && (
                        <span className="ml-2 text-[10px] text-primary font-semibold uppercase">(você)</span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground">{u.email}</td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                          u.role === "super_admin"
                            ? "bg-primary/20 text-primary"
                            : "bg-blue-500/20 text-blue-500"
                        }`}
                      >
                        {u.role === "super_admin" ? "Super Admin" : "Editor"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleUserStatus(u)}
                        disabled={u.user_id === user?.id}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          u.is_active
                            ? "bg-green-500/20 text-green-600 hover:bg-green-500/30"
                            : "bg-red-500/20 text-red-600 hover:bg-red-500/30"
                        }`}
                      >
                        {u.is_active ? "✓ Ativo" : "✗ Inativo"}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditDialog(u)}
                          className="p-1.5 hover:bg-secondary rounded transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.user_id === user?.id}
                          className="p-1.5 hover:bg-destructive/10 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar/Editar Usuário */}
      <Dialog
        open={newUserOpen || editingUser !== null}
        onOpenChange={(open) => { if (!open) closeDialog(); }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            <DialogDescription>
              {editingUser
                ? "Atualize as informações do usuário. Deixe a senha em branco para não alterá-la."
                : "Preencha os dados para criar um novo usuário. Ele poderá fazer login imediatamente."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5 font-medium">
                Nome Completo *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="João Silva"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5 font-medium">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                placeholder="joao@exemplo.com"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5 font-medium">
                {editingUser ? "Nova Senha (deixe em branco para manter)" : "Senha * (mínimo 6 caracteres)"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30 pr-10"
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
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5 font-medium">
                Perfil de Acesso *
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    role: e.target.value as "super_admin" | "editor",
                  }))
                }
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30"
              >
                <option value="editor">Editor — acesso ao painel, sem gerenciar usuários</option>
                <option value="super_admin">Super Admin — acesso total ao sistema</option>
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={closeDialog}
                className="flex-1"
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button
                onClick={editingUser ? handleEditUser : handleAddUser}
                className="flex-1 gap-2"
                disabled={saving}
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingUser ? "Atualizar" : "Criar Usuário"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Info */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
        <p className="text-sm text-green-600">
          <Shield className="w-4 h-4 inline mr-2" />
          <strong>Segurança:</strong> Usuários são criados diretamente no Supabase Auth. Ao criar um usuário, ele pode fazer login imediatamente com as credenciais definidas.
        </p>
      </div>
    </div>
  );
};

export default AdminSettings;
