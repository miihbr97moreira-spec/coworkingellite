import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  User,
  Mail,
  Phone,
  Building,
  Tag,
  FileText,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Conversation } from "./useInbox";

interface ChatSidebarProps {
  conversation: Conversation | null;
  onClose: () => void;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  behavior_tag: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ conversation, onClose }) => {
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    behavior_tag: "",
  });
  const [notes, setNotes] = useState("");
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    if (conversation?.client_id) {
      loadContact();
    }
  }, [conversation?.client_id]);

  const loadContact = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", conversation?.client_id)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      if (data) {
        setContact(data);
        setFormData({
          name: data.name || "",
          email: data.email || "",
          company: data.company || "",
          behavior_tag: data.behavior_tag || "",
        });
      }

      // Carregar notas
      const { data: history } = await supabase
        .from("contact_history")
        .select("content, created_at")
        .eq("client_id", conversation?.client_id)
        .eq("direction", "internal")
        .order("created_at", { ascending: false });

      if (history) {
        setNotes(history.map((h) => h.content).join("\n\n---\n\n"));
      }
    } catch (err) {
      console.error("Erro ao carregar contato:", err);
      toast.error("Erro ao carregar contato");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContact = async () => {
    if (!contact?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("contacts")
        .update(formData)
        .eq("id", contact.id);

      if (error) throw error;

      setContact({ ...contact, ...formData });
      setEditMode(false);
      toast.success("✓ Contato atualizado");
    } catch (err: any) {
      console.error("Erro ao salvar:", err);
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !conversation?.client_id) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("contact_history").insert([
        {
          organization_id: conversation?.client_id,
          client_id: conversation.client_id,
          content: newNote,
          direction: "internal",
          created_by: user.id,
        },
      ]);

      if (error) throw error;

      setNotes((prev) => `${newNote}\n\n---\n\n${prev}`);
      setNewNote("");
      toast.success("✓ Nota adicionada");
    } catch (err: any) {
      console.error("Erro ao adicionar nota:", err);
      toast.error(err.message || "Erro ao adicionar nota");
    } finally {
      setSaving(false);
    }
  };

  if (!conversation) {
    return null;
  }

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted/30">
        <Loader2 className="w-6 h-6 animate-spin text-[#D97757]" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full flex flex-col bg-muted/30 border-l border-border/50 overflow-y-auto"
    >
      {/* Header */}
      <div className="p-4 border-b border-border/50 flex items-center justify-between">
        <h3 className="font-semibold">Contexto do Lead</h3>
        <Button size="icon" variant="ghost" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Perfil */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="w-4 h-4" />
              Perfil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {editMode ? (
              <>
                <div>
                  <Label className="text-xs">Nome</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Empresa</Label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveContact}
                    disabled={saving}
                    className="flex-1 h-8 bg-[#D97757] hover:bg-[#D97757]/90"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Salvar"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditMode(false)}
                    className="flex-1 h-8"
                  >
                    Cancelar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D97757] to-[#D97757]/70 flex items-center justify-center text-white font-semibold">
                    {contact?.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{contact?.name || "Desconhecido"}</p>
                    <p className="text-xs text-muted-foreground">{conversation.contact_phone}</p>
                  </div>
                </div>

                {contact?.behavior_tag && (
                  <Badge className="w-fit bg-[#D97757]/20 text-[#D97757] border-[#D97757]/30">
                    {contact.behavior_tag}
                  </Badge>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditMode(true)}
                  className="w-full h-8"
                >
                  Editar
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>{conversation.contact_phone}</span>
            </div>
            {contact?.email && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{contact.email}</span>
              </div>
            )}
            {contact?.company && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building className="w-4 h-4" />
                <span>{contact.company}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notas Internas */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notas Internas
            </CardTitle>
            <CardDescription className="text-xs">Alt+N para adicionar nota</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder="Adicione uma nota interna..."
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              rows={3}
              className="text-sm resize-none"
            />
            <Button
              size="sm"
              onClick={handleAddNote}
              disabled={saving || !newNote.trim()}
              className="w-full h-8 bg-[#D97757] hover:bg-[#D97757]/90"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              Adicionar Nota
            </Button>

            {notes && (
              <div className="bg-muted/50 p-3 rounded-lg max-h-40 overflow-y-auto">
                <p className="text-xs whitespace-pre-wrap text-muted-foreground">{notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default ChatSidebar;
