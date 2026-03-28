import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface APIKey {
  id: string;
  provider: string;
  api_key: string;
  model: string;
  is_active: boolean;
  created_at: string;
}

interface BYOKState {
  keys: APIKey[];
  loading: boolean;
  activeProvider: string | null;
  
  loadKeys: () => Promise<void>;
  addKey: (provider: string, apiKey: string, model: string) => Promise<void>;
  removeKey: (id: string) => Promise<void>;
  toggleKey: (id: string, isActive: boolean) => Promise<void>;
  getActiveKey: (provider?: string) => APIKey | null;
}

export const useBYOKStore = create<BYOKState>((set, get) => ({
  keys: [],
  loading: false,
  activeProvider: null,

  loadKeys: async () => {
    set({ loading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await (supabase
        .from("api_keys" as any)
        .select("*")
        .eq("tenant_id", user.id) as any)
        .order("created_at", { ascending: false });

      set({ keys: (data || []) as APIKey[] });
    } catch (err) {
      console.error("Erro ao carregar chaves:", err);
    } finally {
      set({ loading: false });
    }
  },

  addKey: async (provider, apiKey, model) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase.from("api_keys" as any) as any).insert({
        tenant_id: user.id,
        provider,
        api_key: apiKey,
        model,
        is_active: true,
      });

      if (error) throw error;
      toast.success("Chave adicionada com sucesso!");
      await get().loadKeys();
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar chave");
    }
  },

  removeKey: async (id) => {
    try {
      await (supabase.from("api_keys" as any) as any).delete().eq("id", id);
      set((state) => ({ keys: state.keys.filter((k) => k.id !== id) }));
      toast.success("Chave removida");
    } catch (err) {
      toast.error("Erro ao remover chave");
    }
  },

  toggleKey: async (id, isActive) => {
    try {
      await (supabase.from("api_keys" as any) as any).update({ is_active: isActive }).eq("id", id);
      set((state) => ({
        keys: state.keys.map((k) => (k.id === id ? { ...k, is_active: isActive } : k)),
      }));
    } catch (err) {
      toast.error("Erro ao atualizar chave");
    }
  },

  getActiveKey: (provider) => {
    const keys = get().keys.filter((k) => k.is_active);
    if (provider) return keys.find((k) => k.provider === provider) || null;
    return keys[0] || null;
  },
}));
