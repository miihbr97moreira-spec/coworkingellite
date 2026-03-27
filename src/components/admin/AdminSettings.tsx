import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Shield, Plus, Edit2, Trash2, Eye, EyeOff, RefreshCw, Clock } from "lucide-react";
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

interface QueueItem {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error_message?: string;
  created_at: string;
}

const AdminSettings = () => {
  const { user, role } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
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
    if (isSuperAdmin) {
      loadData();
      // Inscrever para atualizações em tempo real
      const channel = supabase
        .channel('admin_users_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_management' }, () => loadData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_creation_queue' }, () => loadData())
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [isSuperAdmin]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Carregar usuários reais da tabela user_management
      const { data: userData, error: userError } = await supabase
        .from('user_management')
        .select('*')
        .order('created_at', { ascending: false });

      if (userError) throw userError;
      setUsers(userData || []);

      // 2. Carregar fila de criação pendente
      const { data: queueData, error: queueError } = await supabase
        .from('user_creation_queue')
        .select('*')
        .neq('status', 'completed')
        .order('created_at', { ascending: false });

      if (queueError) throw queueError;
      setQueue(queueData || []);

    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar usuários: " + error.message);
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
      // Inserir na fila de criação (Queue)
      // Isso é puramente banco de dados, SEM chamadas HTTP de Edge Functions
      const { error } = await supabase
        .from('user_creation_queue')
        .insert({
          email: formData.email.trim(),
          full_name: formData.full_name.trim(),
          password: formData.password,
          role: formData.role,
          status: 'pending'
        });

      if (error) throw error;

      toast.success("Solicitação enviada! O usuário será criado em instantes.");
      setFormData({ email: "", full_name: "", password: "", role: "editor" });
      setNewUserOpen(false);
      await loadData();
    } catch (error: any) {
      toast.error("Erro ao solicitar criação: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      // Atualizar diretamente no banco (tabela user_management)
      const { error } = await supabase
        .from('user_management')
        .update({
          full_name: formData.full_name.trim(),
          role: formData.role
        })
        .eq('user_id', editingUser.user_id);

      if (error) throw error;

      toast.success("Usuário atualizado com sucesso!");
      setEditingUser(null);
      await loadData();
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleUserStatus = async (managedUser: ManagedUser) => {
    if (managedUser.user_id === user?.id) {
      toast.error("Você não pode desativar sua própria conta");
      return;
    }

    const newStatus = !managedUser.is_active;
    try {
      const { error } = await supabase
        .from('user_management')
        .update({ is_active: newStatus })
        .eq('user_id', managedUser.user_id);

      if (error) throw error;
      toast.success(newStatus ? "Usuário ativado!" : "Usuário desativado!");
      await loadData();
    } catch (error: any) {
      toast.error("Erro ao alterar status: " + error.message);
    }
  };

  const handleDeleteUser = async (managedUser: ManagedUser) => {
    if (managedUser.user_id === user?.id) {
      toast.error("Você não pode deletar sua própria conta");
      return;
    }
    if (!confirm(`Remover "${managedUser.full_name}"?`)) return;

    try {
      // Deletar da tabela (RLS deve estar configurado)
      const { error } = await supabase
        .from('user_management')
        .delete()
        .eq('user_id', managedUser.user_id);

      if (error) throw error;
      toast.success("Usuário removido!");
      await loadData();
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <Shield className="w-12 h-12 text-muted-foreground/50" />
        <p className="font-semibold text-lg">Acesso Restrito ao Super Admin</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold mb-2">Configurações</h2>
          <p className="text-muted-foreground text-sm">Gerencie usuários via Banco de Dados (Arquitetura Resiliente)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Atualizar">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button onClick={() => { setEditingUser(null); setFormData({ email: "", full_name: "", password: "", role: "editor" }); setNewUserOpen(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Usuário
          </Button>
        </div>
      </div>

      {/* Fila de Processamento (Queue) */}
      {queue.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-2">
            <Clock className="w-3 h-3" /> Processando Criações ({queue.length})
          </h3>
          <div className="grid gap-2">
            {queue.map(item => (
              <div key={item.id} className="bg-background/50 p-3 rounded-lg flex items-center justify-between text-sm border border-border/50">
                <div>
                  <p className="font-medium">{item.full_name}</p>
                  <p className="text-xs text-muted-foreground">{item.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  {item.status === 'error' ? (
                    <span className="text-destructive text-xs flex items-center gap-1" title={item.error_message}>
                      Erro no servidor
                    </span>
                  ) : (
                    <span className="text-primary text-xs flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" /> Aguardando Supabase...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela de Usuários Reais */}
      <div className="bg-secondary/30 rounded-xl border border-border/30 overflow-hidden">
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
              {users.length === 0 && !loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">Nenhum usuário ativo.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                    <td className="p-4 font-medium">{u.full_name} {u.user_id === user?.id && <span className="text-[10px] text-primary">(você)</span>}</td>
                    <td className="p-4 text-muted-foreground">{u.email}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'super_admin' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-500'}`}>
                        {u.role === 'super_admin' ? 'Super Admin' : 'Editor'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => toggleUserStatus(u)} disabled={u.user_id === user?.id} className={`px-3 py-1 rounded text-xs font-medium ${u.is_active ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                        {u.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setEditingUser(u); setFormData({ email: u.email, full_name: u.full_name, password: "", role: u.role }); }} className="p-2 hover:bg-secondary rounded-lg"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
                        <button onClick={() => handleDeleteUser(u)} disabled={u.user_id === user?.id} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={newUserOpen || editingUser !== null} onOpenChange={(open) => { if (!open) { setNewUserOpen(false); setEditingUser(null); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            <DialogDescription>
              {editingUser ? "Atualize os dados básicos do usuário." : "O usuário será criado via fila de processamento automática."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5 font-medium">Nome Completo *</label>
              <input type="text" value={formData.full_name} onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30" placeholder="Ex: João Silva" />
            </div>
            {!editingUser && (
              <>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5 font-medium">Email *</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30" placeholder="email@exemplo.com" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1.5 font-medium">Senha *</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}
            <div>
              <label className="text-xs text-muted-foreground block mb-1.5 font-medium">Perfil de Acesso *</label>
              <select value={formData.role} onChange={(e) => setFormData(p => ({ ...p, role: e.target.value as any }))} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30">
                <option value="editor">Editor (Painel Admin)</option>
                <option value="super_admin">Super Admin (Acesso Total)</option>
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => { setNewUserOpen(false); setEditingUser(null); }} className="flex-1" disabled={saving}>Cancelar</Button>
              <Button onClick={editingUser ? handleEditUser : handleAddUser} className="flex-1 gap-2" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingUser ? "Salvar" : "Criar na Fila"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
        <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-blue-700">Arquitetura Resiliente Ativada</p>
          <p className="text-xs text-blue-600 mt-1">
            Para evitar erros de rede do navegador, a criação de usuários agora é feita via <strong>Fila de Banco de Dados</strong>. 
            Você solicita a criação e o Supabase processa em background. A lista atualiza automaticamente.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
