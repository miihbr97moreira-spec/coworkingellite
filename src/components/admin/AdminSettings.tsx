import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, Eye, Edit3, Trash2, Plus } from "lucide-react";

interface UserPermission {
  id: string;
  user_id: string;
  user_email: string;
  can_view_crm: boolean;
  can_edit_crm: boolean;
  can_delete_crm: boolean;
  can_view_builder: boolean;
  can_edit_builder: boolean;
  can_view_reviews: boolean;
  can_edit_reviews: boolean;
  created_at: string;
}

const AdminSettings = () => {
  const [permissions, setPermissions] = useState<UserPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState("");
  const qc = useQueryClient();

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      // Por enquanto, vamos usar localStorage como base de dados local
      // Futuramente, isso será migrado para uma tabela no Supabase
      const stored = localStorage.getItem("user_permissions");
      if (stored) {
        setPermissions(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Erro ao carregar permissões:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePermissions = (newPermissions: UserPermission[]) => {
    localStorage.setItem("user_permissions", JSON.stringify(newPermissions));
    setPermissions(newPermissions);
  };

  const togglePermission = (userId: string, permission: keyof UserPermission) => {
    const updated = permissions.map(p => {
      if (p.user_id === userId && typeof p[permission] === "boolean") {
        return { ...p, [permission]: !p[permission] };
      }
      return p;
    });
    savePermissions(updated);
    toast.success("Permissão atualizada!");
  };

  const addUser = async () => {
    if (!newUserEmail.trim()) {
      toast.error("Digite um email válido");
      return;
    }

    // Verificar se o usuário já existe
    if (permissions.some(p => p.user_email === newUserEmail)) {
      toast.error("Usuário já cadastrado");
      return;
    }

    const newPermission: UserPermission = {
      id: Math.random().toString(36).substr(2, 9),
      user_id: Math.random().toString(36).substr(2, 9),
      user_email: newUserEmail,
      can_view_crm: true,
      can_edit_crm: true,
      can_delete_crm: true,
      can_view_builder: true,
      can_edit_builder: true,
      can_view_reviews: true,
      can_edit_reviews: true,
      created_at: new Date().toISOString(),
    };

    const updated = [...permissions, newPermission];
    savePermissions(updated);
    setNewUserEmail("");
    toast.success("Usuário adicionado com permissões completas!");
  };

  const removeUser = (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return;
    const updated = permissions.filter(p => p.user_id !== userId);
    savePermissions(updated);
    toast.success("Usuário removido!");
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
        <p className="text-muted-foreground">Gerencie permissões de usuários e funcionalidades do sistema</p>
      </div>

      {/* Adicionar Novo Usuário */}
      <div className="bg-secondary/30 rounded-lg p-6 border border-border/30">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Adicionar Novo Usuário
        </h3>
        <div className="flex gap-2">
          <input
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            placeholder="email@exemplo.com"
            className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm outline-none focus:ring-1 focus:ring-primary/30"
            onKeyDown={(e) => e.key === "Enter" && addUser()}
          />
          <Button onClick={addUser}>Adicionar</Button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Novos usuários recebem todas as permissões por padrão</p>
      </div>

      {/* Tabela de Permissões */}
      <div className="bg-secondary/30 rounded-lg border border-border/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/20 bg-secondary/50">
                <th className="p-4 text-left font-semibold">Email</th>
                <th className="p-4 text-center font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    <Eye className="w-4 h-4" /> Ver CRM
                  </div>
                </th>
                <th className="p-4 text-center font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    <Edit3 className="w-4 h-4" /> Editar CRM
                  </div>
                </th>
                <th className="p-4 text-center font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    <Trash2 className="w-4 h-4" /> Deletar CRM
                  </div>
                </th>
                <th className="p-4 text-center font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    <Eye className="w-4 h-4" /> Ver Builder
                  </div>
                </th>
                <th className="p-4 text-center font-semibold">
                  <div className="flex items-center justify-center gap-1">
                    <Edit3 className="w-4 h-4" /> Editar Builder
                  </div>
                </th>
                <th className="p-4 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {permissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-4 text-center text-muted-foreground">
                    Nenhum usuário cadastrado. Adicione um novo usuário acima.
                  </td>
                </tr>
              ) : (
                permissions.map((perm) => (
                  <tr key={perm.id} className="border-b border-border/10 hover:bg-secondary/20 transition-colors">
                    <td className="p-4">{perm.user_email}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => togglePermission(perm.user_id, "can_view_crm")}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          perm.can_view_crm
                            ? "bg-green-500/20 text-green-600"
                            : "bg-red-500/20 text-red-600"
                        }`}
                      >
                        {perm.can_view_crm ? "✓ Sim" : "✗ Não"}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => togglePermission(perm.user_id, "can_edit_crm")}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          perm.can_edit_crm
                            ? "bg-green-500/20 text-green-600"
                            : "bg-red-500/20 text-red-600"
                        }`}
                      >
                        {perm.can_edit_crm ? "✓ Sim" : "✗ Não"}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => togglePermission(perm.user_id, "can_delete_crm")}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          perm.can_delete_crm
                            ? "bg-green-500/20 text-green-600"
                            : "bg-red-500/20 text-red-600"
                        }`}
                      >
                        {perm.can_delete_crm ? "✓ Sim" : "✗ Não"}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => togglePermission(perm.user_id, "can_view_builder")}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          perm.can_view_builder
                            ? "bg-green-500/20 text-green-600"
                            : "bg-red-500/20 text-red-600"
                        }`}
                      >
                        {perm.can_view_builder ? "✓ Sim" : "✗ Não"}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => togglePermission(perm.user_id, "can_edit_builder")}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                          perm.can_edit_builder
                            ? "bg-green-500/20 text-green-600"
                            : "bg-red-500/20 text-red-600"
                        }`}
                      >
                        {perm.can_edit_builder ? "✓ Sim" : "✗ Não"}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => removeUser(perm.user_id)}
                        className="px-3 py-1 rounded text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <p className="text-sm text-blue-600">
          <Shield className="w-4 h-4 inline mr-2" />
          <strong>Nota:</strong> As permissões são gerenciadas localmente por enquanto. No futuro, será integrado com o banco de dados do Supabase para persistência permanente.
        </p>
      </div>
    </div>
  );
};

export default AdminSettings;
