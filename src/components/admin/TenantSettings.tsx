import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Globe2, Megaphone, User, Key, Loader2, Trash2, Plus, Eye, EyeOff, Power } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminDomains from "@/components/admin/AdminDomains";
import AdminPixelManager from "@/components/admin/AdminPixelManager";
import { useBYOKStore } from "@/stores/useBYOKStore";
import { toast } from "sonner";

const PROVIDERS = [
  { value: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"] },
  { value: "groq", label: "Groq", models: ["llama-3.3-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"] },
  { value: "gemini", label: "Google Gemini", models: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-2.0-flash"] },
  { value: "anthropic", label: "Anthropic", models: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022"] },
];

const BYOKTab = () => {
  const { keys, loading, loadKeys, addKey, removeKey, toggleKey } = useBYOKStore();
  const [showForm, setShowForm] = useState(false);
  const [provider, setProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  useEffect(() => { loadKeys(); }, [loadKeys]);

  const selectedProvider = PROVIDERS.find(p => p.value === provider);

  const handleAdd = async () => {
    if (!apiKey.trim()) return toast.error("Informe a API Key");
    await addKey(provider, apiKey.trim(), model || selectedProvider?.models[0] || "");
    setApiKey("");
    setModel("");
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cofre de Chaves API (BYOK)</h2>
          <p className="text-sm text-muted-foreground mt-1">Traga suas próprias chaves para usar no AI Builder e Omni Flow.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> Nova Chave
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="bg-secondary/30 border border-border rounded-xl p-6 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Provedor</label>
              <Select value={provider} onValueChange={(v) => { setProvider(v); setModel(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Modelo</label>
              <Select value={model || selectedProvider?.models[0] || ""} onValueChange={setModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {selectedProvider?.models.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">API Key</label>
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={handleAdd}>Salvar Chave</Button>
          </div>
        </motion.div>
      )}

      {/* Keys List */}
      {keys.length === 0 ? (
        <div className="text-center py-16 bg-secondary/20 border border-dashed border-border rounded-xl">
          <Key className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-bold text-lg mb-2">Nenhuma chave configurada</h3>
          <p className="text-sm text-muted-foreground mb-6">Adicione suas chaves API para usar IA sem custos extras.</p>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Adicionar Primeira Chave
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                key.is_active 
                  ? "bg-primary/5 border-primary/20" 
                  : "bg-secondary/30 border-border opacity-60"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold uppercase ${
                  key.is_active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                }`}>
                  {key.provider.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold capitalize">{key.provider}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{key.model}</span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {showKeys[key.id] ? key.api_key : `${key.api_key.slice(0, 8)}${"•".repeat(20)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowKeys(prev => ({ ...prev, [key.id]: !prev[key.id] }))}
                  className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground"
                >
                  {showKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <Switch
                  checked={key.is_active}
                  onCheckedChange={(checked) => toggleKey(key.id, checked)}
                />
                <button
                  onClick={() => {
                    if (confirm("Remover esta chave?")) removeKey(key.id);
                  }}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors text-destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TenantSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("domains");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie domínios, pixels, chaves API e sua conta</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-secondary/30 border border-border rounded-lg p-1 mb-8">
            <TabsTrigger value="domains" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
              <Globe2 className="w-4 h-4" />
              <span className="hidden sm:inline">Domínios</span>
            </TabsTrigger>
            <TabsTrigger value="pixels" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
              <Megaphone className="w-4 h-4" />
              <span className="hidden sm:inline">Pixels</span>
            </TabsTrigger>
            <TabsTrigger value="api_keys" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">Chaves API</span>
            </TabsTrigger>
            <TabsTrigger value="account" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Conta</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="domains" className="mt-0">
            <AdminDomains />
          </TabsContent>

          <TabsContent value="pixels" className="mt-0">
            <AdminPixelManager />
          </TabsContent>

          <TabsContent value="api_keys" className="mt-0">
            <BYOKTab />
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
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default TenantSettings;
