import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Pin,
  Trash2,
  Eye,
  EyeOff,
  MoreVertical,
  Users,
  MessageCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Conversation } from "./useInbox";

interface ConversationListProps {
  conversations: Conversation[];
  selectedClientId: string | null;
  loading: boolean;
  onSelectConversation: (clientId: string) => void;
  onDeleteConversation: (clientId: string) => void;
  onPinConversation: (clientId: string, isPinned: boolean) => void;
  onMarkAsRead: (clientId: string) => void;
  onMarkAsUnread: (clientId: string) => void;
}

type FilterType = "all" | "unread" | "waiting" | "individual" | "groups";

const BEHAVIOR_TAGS: Record<string, { color: string; label: string }> = {
  gold: { color: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30", label: "Gold" },
  silver: { color: "bg-gray-500/20 text-gray-700 border-gray-500/30", label: "Silver" },
  bronze: { color: "bg-orange-500/20 text-orange-700 border-orange-500/30", label: "Bronze" },
  vip: { color: "bg-purple-500/20 text-purple-700 border-purple-500/30", label: "VIP" },
  risk: { color: "bg-red-500/20 text-red-700 border-red-500/30", label: "Risco" },
  inactive: { color: "bg-slate-500/20 text-slate-700 border-slate-500/30", label: "Inativo" },
};

const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedClientId,
  loading,
  onSelectConversation,
  onDeleteConversation,
  onPinConversation,
  onMarkAsRead,
  onMarkAsUnread,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");

  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Aplicar filtro por tipo
    switch (filterType) {
      case "unread":
        filtered = filtered.filter((c) => c.unread_count > 0 || c.is_marked_unread);
        break;
      case "waiting":
        filtered = filtered.filter((c) => c.unread_count > 0);
        break;
      case "individual":
        filtered = filtered.filter((c) => !c.is_group);
        break;
      case "groups":
        filtered = filtered.filter((c) => c.is_group);
        break;
    }

    // Aplicar busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.contact_name.toLowerCase().includes(term) ||
          c.contact_phone.includes(term)
      );
    }

    return filtered;
  }, [conversations, searchTerm, filterType]);

  if (loading) {
    return (
      <div className="h-full flex flex-col gap-3 p-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* Header */}
      <div className="p-3 border-b border-border/50 space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 h-9"
          />
        </div>

        <Tabs value={filterType} onValueChange={(v) => setFilterType(v as FilterType)}>
          <TabsList className="grid w-full grid-cols-5 h-8">
            <TabsTrigger value="all" className="text-xs">
              Todos
            </TabsTrigger>
            <TabsTrigger value="unread" className="text-xs">
              Não lidos
            </TabsTrigger>
            <TabsTrigger value="waiting" className="text-xs">
              Aguardando
            </TabsTrigger>
            <TabsTrigger value="individual" className="text-xs">
              Individual
            </TabsTrigger>
            <TabsTrigger value="groups" className="text-xs">
              Grupos
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Lista de Conversas */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Nenhuma conversa encontrada</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conv, idx) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
              >
                <div
                  onClick={() => onSelectConversation(conv.client_id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all group ${
                    selectedClientId === conv.client_id
                      ? "bg-[#D97757]/20 border border-[#D97757]/50"
                      : "hover:bg-muted/50 border border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D97757] to-[#D97757]/70 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {conv.contact_name.charAt(0).toUpperCase()}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">
                          {conv.contact_name}
                        </h4>
                        {conv.is_group && (
                          <Users className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                        )}
                        {conv.unread_count > 0 && (
                          <Badge className="bg-[#D97757] text-white text-xs">
                            {conv.unread_count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {conv.last_message}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {conv.behavior_tag && BEHAVIOR_TAGS[conv.behavior_tag] && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${BEHAVIOR_TAGS[conv.behavior_tag].color}`}
                          >
                            {BEHAVIOR_TAGS[conv.behavior_tag].label}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(conv.last_message_time).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7">
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => onPinConversation(conv.client_id, conv.is_pinned)}
                            className="gap-2"
                          >
                            <Pin className="w-3 h-3" />
                            {conv.is_pinned ? "Desafixar" : "Afixar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              conv.is_marked_unread
                                ? onMarkAsRead(conv.client_id)
                                : onMarkAsUnread(conv.client_id)
                            }
                            className="gap-2"
                          >
                            {conv.is_marked_unread ? (
                              <>
                                <Eye className="w-3 h-3" />
                                Marcar como lido
                              </>
                            ) : (
                              <>
                                <EyeOff className="w-3 h-3" />
                                Marcar como não lido
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDeleteConversation(conv.client_id)}
                            className="gap-2 text-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
