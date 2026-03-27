import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe2, Megaphone, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import AdminDomains from "@/components/admin/AdminDomains";
import AdminPixelManager from "@/components/admin/AdminPixelManager";

const TenantSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("domains");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie seus domínios, pixels e dados de conta</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-secondary/30 border border-border rounded-lg p-1 mb-8">
            <TabsTrigger value="domains" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
              <Globe2 className="w-4 h-4" />
              <span className="hidden sm:inline">Domínios</span>
            </TabsTrigger>
            <TabsTrigger value="pixels" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">Pixels & Tracking</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Minha Conta</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="domains" className="mt-0">
            <AdminDomains />
          </TabsContent>

          <TabsContent value="pixels" className="mt-0">
            <AdminPixelManager />
          </TabsContent>

          <TabsContent value="account" className="mt-0">
            <div className="bg-secondary/30 rounded-xl border border-border p-8 max-w-2xl">
              <h2 className="text-2xl font-bold mb-6">Minha Conta</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Email</label>
                  <p className="text-lg font-medium text-foreground">{user?.email}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">ID do Usuário</label>
                  <p className="text-sm font-mono text-muted-foreground break-all">{user?.id}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground">Membro desde</label>
                  <p className="text-lg font-medium text-foreground">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                  </p>
                </div>

                <div className="pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-4">
                    Para alterar sua senha ou dados de perfil, acesse as configurações de autenticação do Supabase.
                  </p>
                  <Button variant="outline" className="gap-2">
                    Gerenciar Autenticação
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default TenantSettings;
