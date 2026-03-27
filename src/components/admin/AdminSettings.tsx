import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Shield, Plus, Edit2, Trash2, Eye, EyeOff } from "lucide-react";

interface User {
  id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  created_at: string;
}

const AdminSettings = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    password: "",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Buscar usuários do localStorage (simulando banco de dados)
      const stored = localStorage.getItem("admin_users");
      if (stored) {
        setUsers(JSON.parse(stored));
      } else {
        // Usuário padrão
        const defaultUsers: User[] = [
          {
            id: "1",
            email: "jpm19990@gmail.com",
            full_name: "Administrador",
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ];
        setUsers(defaultUsers);
        localStorage.setItem("admin_users", JSON.stringify(defaultUsers));
      }
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  const saveUsers = (newUsers: User[]) => {
    localStorage.setItem("admin_users", JSON.stringify(newUsers));
    setUsers(newUsers);
  };

  const handleAddUser = async () => {
    if (!formData.email.trim() || !formData.full_name.trim() || !formData.password.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (users.some(u => u.email === formData.email)) {
      toast.error("Este email já está cadastrado");
      return;
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: formData.email,
      full_name: formData.full_name,
      is_active: true,
      created_at: new Date().toISOString(),
    };

    const updated = [...users, newUser];
    saveUsers(updated);
    setFormData({ email: "", full_name: "", password: "" });
    setNewUserOpen(false);
    toast.success("Usuário adicionado com sucesso!");
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    if (!formData.email.trim() || !formData.full_name.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    const updated = users.map(u => {
      if (u.id === editingUser.id) {
        return {
          ...u,
          email: formData.email,
          full_name: formData.full_name,
        };
      }
      return u;
    });

    saveUsers(updated);
    setEditingUser(null);
    setFormData({ email: "", full_name: "", password: "" });
    toast.success("Usuário atualizado com sucesso!");
  };

  const handleDeleteUser = (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return;
    
    const updated = users.filter(u => u.id !== userId);
    saveUsers(updated);
    toast.success("Usuário removido!");
  };

  const toggleUserStatus = (userId: string) => {
    const updated = users.map(u => {
      if (u.id === userId) {
        return { ...u, is_active: !u.is_active };
      }
      return u;
    });
    saveUsers(updated);
    toast.success("Status do usuário atualizado!");
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      password: "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Configurações</h2>
        <p className="text-muted-foreground">Gerencie usuários e permissões do sistema</p>
      </div>

      {/* Botão Adicionar Usuário */}
      <div className="flex justify-end">
        <Button onClick={() => { setEditingUser(null); setFormData({ email: "", full_name: "", password: "" }); setNewUserOpen(true); }} className="gap-2">
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
                <th className="p-4 text-center font-semibold">Status</th>
                <th className="p-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-muted-foreground">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                    <td className="p-4 font-medium">{user.full_name}</td>
                    <td className="p-4 text-muted-foreground">{user.email}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => toggleUserStatus(user.id)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          user.is_active
                            ? "bg-green-500/20 text-green-600"
                            : "bg-red-500/20 text-red-600"
                        }`}
                      >
                        {user.is_active ? "✓ Ativo" : "✗ Inativo"}
                      </button>
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      <button
                        onClick={() => openEditDialog(user)}
                        className="p-1.5 hover:bg-secondary rounded transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 hover:bg-destructive/10 rounded transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Adicionar/Editar Usuário */}
      <Dialog open={newUserOpen || editingUser !== null} onOpenChange={(open) => {
        if (!open) {
          setNewUserOpen(false);
          setEditingUser(null);
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Atualize as informações do usuário." : "Adicione um novo usuário ao sistema."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5 font-medium">Nome Completo *</label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))}
                placeholder="João Silva"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5 font-medium">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                placeholder="joao@exemplo.com"
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5 font-medium">
                {editingUser ? "Nova Senha (deixe em branco para manter)" : "Senha *"}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30"
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
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setNewUserOpen(false);
                  setEditingUser(null);
                  setFormData({ email: "", full_name: "", password: "" });
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={editingUser ? handleEditUser : handleAddUser}
                className="flex-1"
              >
                {editingUser ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-600">
          <Shield className="w-4 h-4 inline mr-2" />
          <strong>Nota:</strong> Os usuários são gerenciados localmente. Integração com Supabase Auth será implementada em breve para melhor segurança.
        </p>
      </div>
    </div>
  );
};

export default AdminSettings;
