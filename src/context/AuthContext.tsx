import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: "super_admin" | "editor" | null;
  userLimits: {
    max_domains: number;
    max_quizzes: number;
    max_pages: number;
    allowed_modules: string[];
  } | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"super_admin" | "editor" | null>(null);
  const [userLimits, setUserLimits] = useState<AuthContextType["userLimits"]>(null);

  const fetchUserData = async (userId: string) => {
    try {
      const [roleRes, mgmtRes] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
        (supabase.from("user_management" as any).select("max_domains, max_quizzes, max_pages, allowed_modules").eq("user_id", userId) as any).maybeSingle()
      ]);

      if (roleRes.data) {
        setRole(roleRes.data.role as "super_admin" | "editor");
      }
      
      if (mgmtRes.data) {
        setUserLimits({
          max_domains: (mgmtRes.data as any).max_domains,
          max_quizzes: (mgmtRes.data as any).max_quizzes,
          max_pages: (mgmtRes.data as any).max_pages,
          allowed_modules: (mgmtRes.data as any).allowed_modules || [],
        });
      }
    } catch (err) {
      console.error("Erro ao buscar dados do usuário:", err);
      setRole(null);
      setUserLimits(null);
    }
  };

  useEffect(() => {
    // Inicializar sessão existente primeiro
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    // Escutar mudanças de estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        // Usar setTimeout para evitar deadlock com Supabase
        setTimeout(() => fetchUserData(session.user.id), 0);
      } else {
        setRole(null);
        setUserLimits(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
    setUserLimits(null);
    setUser(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, role, userLimits, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
