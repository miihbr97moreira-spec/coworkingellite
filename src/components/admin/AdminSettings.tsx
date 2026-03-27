import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2, Shield, Plus, Edit2, Trash2, Eye, EyeOff, RefreshCw, Clock, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Checkbox } from "@/components/ui/checkbox";

interface ManagedUser {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  is_active: boolean;
  role: "super_admin" | "editor";
  max_domains: number;
  max_quizzes: number;
  max_pages: number;
  allowed_modules: string[];
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

const MODULES = [
  { id: 'builder', label: 'Builder (Omni)' },
  { id: 'quiz_builder', label: 'Quiz Builder' },
  { id: 'pixels', label: 'Pixels' },
  { id: 'crm', label: 'CRM' },
  { id: 'omni_flow', label: 'Omni Flow' },
  { id: 'settings', label: 'Configurações' },
];

const AdminSettings = () => {
  const { user, role } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newUserOpen, setNewUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [schemaError, setSchemaError] = useState(false);

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

  const isSuperAdmin = role === "super_admin";

  useEffect(() => {
    if (isSuperAdmin) {
      loadData();
      const channel = supabase
        .channel('admin_users_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_management' }, () => loadData())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_creation_queue' }, () => loadData())
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isSuperAdmin]);

  const loadData = async () => {
    setLoading(true);
    setSchemaError(false);
    try {
      const { data: userData, error: userError } = await supabase
        .from('user_management')
        .select('*')
        .order('created_at', { ascending: false });

      if (userError) {
        if (userError.message.includes('not found') || userError.code === 'PGRST116') {
          setSchemaError(true);
          return;
        }
        throw userError;
      }
      setUsers(userData || []);

      const { data: queueData, error: queueError } = await supabase
        .from('user_creation_queue')
        .select('*')
        .neq('status', 'completed')
        .order('created_at', { ascending: false });

      if (!queueError) setQueue(queueData || []);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro de conexão: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!formData.email.trim() || !formData.full_name.trim() || !formData.password.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_creation_queue')
        .insert({
          email: formData.email.trim(),
          full_name: formData.full_name.trim(),
          password: formData.password,
          role: formData.role,
          max_domains: formData.max_domains,
          max_quizzes: formData.max_quizzes,
          max_pages: formData.max_pages,
          allowed_modules: formData.allowed_modules,
          status: 'pending'
        });

      if (error) throw error;
      toast.success("Solicitação de criação enviada!");
      setNewUserOpen(false);
      loadData();
    } catch (error: any) {
      toast.error("Erro ao enviar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_management')
        .update({
          full_name: formData.full_name.trim(),
          role: formData.role,
          max_domains: formData.max_domains,
          max_quizzes: formData.max_quizzes,
          max_pages: formData.max_pages,
          allowed_modules: formData.allowed_modules,
        })
        .eq('user_id', editingUser.user_id);

      if (error) throw error;
      toast.success("Dados atualizados com sucesso!");
      setEditingUser(null);
      loadData();
    } catch (error: any) {
      toast.error("Erro ao atualizar: " + error.message);
    } finally {
      setSaving(false);
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

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Shield className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="font-bold text-lg">Acesso Restrito</p>
        <p className="text-muted-foreground text-sm">Apenas o Super Admin pode gerenciar usuários.</p>
      </div>
    );
  }

  if (schemaError) {
    return (
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-8 text-center max-w-2xl mx-auto mt-12">
        <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-bold text-destructive mb-2">Tabelas de Gestão não Encontradas</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Execute o SQL consolidado no painel do Supabase para ativar a gestão de usuários com limites e permissões.
        </p>
        <Button onClick={loadData} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" /> Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold mb-2">Configurações</h2>
          <p className="text-muted-foreground text-sm">Gerencie usuários, limites e permissões de acesso</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="p-2 hover:bg-secondary rounded-lg transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button onClick={() => { 
            setEditingUser(null); 
            setFormData({ 
              email: "", full_name: "", password: "", role: "editor", 
              max_domains: 1, max_quizzes: 5, max_pages: 10,
              allowed_modules: ['builder', 'quiz_builder', 'pixels', 'crm', 'omni_flow']
            }); 
            setNewUserOpen(true); 
          }} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Usuário
          </Button>
        </div>
      </div>

      {/* Fila de Criação Pendente */}
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
                    <span className="text-destructive text-xs" title={item.error_message}>Falha no processamento</span>
                  ) : (
                    <span className="text-primary text-xs flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" /> Criando no Supabase...
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela Principal */}
      <div className="bg-secondary/30 rounded-xl border border-border/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/20 bg-secondary/50">
                <th className="p-4 text-left font-semibold">Nome</th>
                <th className="p-4 text-left font-semibold">Limites (Dom/Quiz/Pag)</th>
                <th className="p-4 text-center font-semibold">Perfil</th>
                <th className="p-4 text-center font-semibold">Status</th>
                <th className="p-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !loading ? (
                <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">Nenhum usuário cadastrado.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                    <td className="p-4">
                      <p className="font-medium">{u.full_name} {u.user_id === user?.id && <span className="text-[10px] text-primary">(você)</span>}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <span className="bg-secondary px-2 py-0.5 rounded text-[10px] font-mono" title="Máximo de Domínios">D: {u.max_domains === 9999 ? '∞' : u.max_domains}</span>
                        <span className="bg-secondary px-2 py-0.5 rounded text-[10px] font-mono" title="Máximo de Quizzes">Q: {u.max_quizzes === 9999 ? '∞' : u.max_quizzes}</span>
                        <span className="bg-secondary px-2 py-0.5 rounded text-[10px] font-mono" title="Máximo de Páginas">P: {u.max_pages === 9999 ? '∞' : u.max_pages}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${u.role === 'super_admin' ? 'bg-primary/20 text-primary' : 'bg-blue-500/20 text-blue-500'}`}>
                        {u.role === 'super_admin' ? 'Super Admin' : 'Editor'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={async () => {
                        const { error } = await supabase.from('user_management').update({ is_active: !u.is_active }).eq('user_id', u.user_id);
                        if (!error) loadData();
                      }} disabled={u.user_id === user?.id} className={`px-3 py-1 rounded text-xs font-medium ${u.is_active ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                        {u.is_active ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { 
                          setEditingUser(u); 
                          setFormData({ 
                            email: u.email, full_name: u.full_name, password: "", role: u.role,
                            max_domains: u.max_domains, max_quizzes: u.max_quizzes, max_pages: u.max_pages,
                            allowed_modules: u.allowed_modules || []
                          }); 
                        }} className="p-2 hover:bg-secondary rounded-lg"><Edit2 className="w-4 h-4 text-muted-foreground" /></button>
                        <button onClick={async () => {
                          if (confirm(`Excluir permanentemente "${u.full_name}"?`)) {
                            const { error } = await supabase.from('user_management').delete().eq('user_id', u.user_id);
                            if (!error) loadData();
                          }
                        }} disabled={u.user_id === user?.id} className="p-2 hover:bg-destructive/10 rounded-lg"><Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" /></button>
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
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            <DialogDescription>Defina os limites e módulos acessíveis para este usuário.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <h4 className="text-sm font-bold border-b pb-2">Dados Básicos</h4>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5 font-medium">Nome Completo *</label>
                <input type="text" value={formData.full_name} onChange={(e) => setFormData(p => ({ ...p, full_name: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30" />
              </div>
              {!editingUser && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5 font-medium">Email *</label>
                    <input type="email" value={formData.email} onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1.5 font-medium">Senha *</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={formData.password} onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
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
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-bold border-b pb-2">Limites de Uso</h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1 font-medium uppercase">Domínios</label>
                  <input type="number" value={formData.max_domains} onChange={(e) => setFormData(p => ({ ...p, max_domains: parseInt(e.target.value) }))} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1 font-medium uppercase">Quizzes</label>
                  <input type="number" value={formData.max_quizzes} onChange={(e) => setFormData(p => ({ ...p, max_quizzes: parseInt(e.target.value) }))} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1 font-medium uppercase">Páginas</label>
                  <input type="number" value={formData.max_pages} onChange={(e) => setFormData(p => ({ ...p, max_pages: parseInt(e.target.value) }))} className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm outline-none" />
                </div>
              </div>

              <h4 className="text-sm font-bold border-b pb-2 mt-4">Módulos Permitidos</h4>
              <div className="grid grid-cols-2 gap-2">
                {MODULES.map(mod => (
                  <div key={mod.id} className="flex items-center space-x-2 bg-secondary/50 p-2 rounded-lg border border-border/20">
                    <Checkbox 
                      id={mod.id} 
                      checked={formData.allowed_modules.includes(mod.id)} 
                      onCheckedChange={() => toggleModule(mod.id)} 
                    />
                    <label htmlFor={mod.id} className="text-xs cursor-pointer select-none">{mod.label}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => { setNewUserOpen(false); setEditingUser(null); }} className="flex-1" disabled={saving}>Cancelar</Button>
            <Button onClick={editingUser ? handleEditUser : handleAddUser} className="flex-1 gap-2" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingUser ? "Salvar Alterações" : "Criar Usuário na Fila"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSettings;
