import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Bell,
  Trash2,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import TooltipHelp from "@/components/ui/tooltip-help";

interface Notification {
  id: string;
  title: string;
  content: string;
  event_type: string;
  is_read: boolean;
  created_at: string;
  data?: Record<string, any>;
}

interface NotificationCenterProps {
  onBack: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onBack }) => {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "success" | "error" | "info">("all");

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("organizations")
          .select("id")
          .eq("owner_id", user.id)
          .single();

        if (data) {
          setOrganizationId(data.id);
          await loadNotifications(data.id);
          subscribeToNotifications(data.id);
        }
      } catch (err) {
        console.error("Erro ao carregar organização:", err);
        toast.error("Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    };

    loadOrganization();
  }, []);

  const loadNotifications = async (orgId: string) => {
    try {
      const { data } = await supabase
        .from("owner_notifications")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(50);

      setNotifications(data || []);
    } catch (err) {
      console.error("Erro ao carregar notificações:", err);
    }
  };

  const subscribeToNotifications = (orgId: string) => {
    const channel = supabase
      .channel(`notifications-${orgId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "owner_notifications",
          filter: `organization_id=eq.${orgId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await supabase
        .from("owner_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Erro ao marcar como lido:", err);
      toast.error("Erro ao atualizar notificação");
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await supabase
        .from("owner_notifications")
        .delete()
        .eq("id", notificationId);

      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      toast.success("Notificação deletada");
    } catch (err) {
      console.error("Erro ao deletar notificação:", err);
      toast.error("Erro ao deletar notificação");
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase
        .from("owner_notifications")
        .update({ is_read: true })
        .eq("organization_id", organizationId)
        .eq("is_read", false);

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      toast.success("Todas as notificações marcadas como lidas");
    } catch (err) {
      console.error("Erro ao marcar todas como lidas:", err);
      toast.error("Erro ao atualizar notificações");
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "message_received":
        return <Info className="w-5 h-5 text-blue-500" />;
      case "lead_created":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "automation_failed":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "automation_triggered":
        return <Info className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case "message_received":
        return "bg-blue-500/10 border-blue-500/20";
      case "lead_created":
        return "bg-green-500/10 border-green-500/20";
      case "automation_failed":
        return "bg-red-500/10 border-red-500/20";
      case "automation_triggered":
        return "bg-purple-500/10 border-purple-500/20";
      default:
        return "bg-gray-500/10 border-gray-500/20";
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.is_read;
    if (filter === "success") return ["lead_created", "automation_triggered"].includes(n.event_type);
    if (filter === "error") return n.event_type === "automation_failed";
    if (filter === "info") return n.event_type === "message_received";
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#D97757]" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button onClick={onBack} variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-[#D97757]/20 to-[#D97757]/10 border border-[#D97757]/30">
                <Bell className="w-6 h-6 text-[#D97757]" />
              </div>
              Centro de Notificações
              <TooltipHelp content="Gerencie todas as notificações do sistema sobre eventos críticos, leads criados e automações." />
            </h1>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="mt-2">
                {unreadCount} não lida{unreadCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={markAllAsRead} disabled={unreadCount === 0}>
            Marcar tudo como lido
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-48">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as notificações</SelectItem>
            <SelectItem value="unread">Não lidas</SelectItem>
            <SelectItem value="success">Sucesso</SelectItem>
            <SelectItem value="error">Erros</SelectItem>
            <SelectItem value="info">Informações</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Notificações */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredNotifications.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Nenhuma notificação neste filtro</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`border-2 cursor-pointer transition-all hover:shadow-lg ${
                    notification.is_read
                      ? "border-border/50 opacity-75"
                      : "border-[#D97757]/50 bg-[#D97757]/5"
                  } ${getEventColor(notification.event_type)}`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="mt-1">{getEventIcon(notification.event_type)}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{notification.title}</h3>
                            {!notification.is_read && (
                              <div className="w-2 h-2 rounded-full bg-[#D97757]" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.content}
                          </p>
                          <div className="flex items-center gap-2 mt-3">
                            <Badge variant="secondary" className="text-xs">
                              {notification.event_type.replace(/_/g, " ")}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(notification.created_at).toLocaleString("pt-BR")}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default NotificationCenter;
