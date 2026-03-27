import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type AppRole = "admin" | "doctor" | "patient";

interface AuthContextType {
  user: User | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, metadata: Record<string, string>) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (currentUser: User): Promise<AppRole | null> => {
    // Method 1: Try querying user_roles table via PostgREST
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .maybeSingle();
      if (!error && data?.role) {
        console.log("Fetched role from DB:", data.role);
        return data.role as AppRole;
      }
      if (error) console.warn("DB role fetch failed:", error.message);
    } catch (err) {
      console.warn("DB role fetch exception:", err);
    }

    // Method 2: Try RPC function
    try {
      const { data, error } = await supabase.rpc("get_user_role", {
        _user_id: currentUser.id,
      });
      if (!error && data) {
        console.log("Fetched role from RPC:", data);
        return data as AppRole;
      }
    } catch (err) {
      console.warn("RPC role fetch failed:", err);
    }

    // Method 3: Fall back to user metadata (set during signup)
    const metaRole = currentUser.user_metadata?.role;
    if (metaRole && ["admin", "doctor", "patient"].includes(metaRole)) {
      console.log("Using role from metadata:", metaRole);
      return metaRole as AppRole;
    }

    console.warn("Could not determine role, defaulting to null");
    return null;
  };

  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user) {
          setUser(session.user);
          const r = await fetchRole(session.user);
          if (mounted) setRole(r);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        setUser(session.user);
        const r = await fetchRole(session.user);
        if (mounted) setRole(r);
      } else {
        setUser(null);
        setRole(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      if (data.user) {
        setUser(data.user);
        const r = await fetchRole(data.user);
        setRole(r);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || "Login failed" };
    }
  };

  const signUp = async (email: string, password: string, metadata: Record<string, string>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });
      if (error) return { error: error.message };
      if (data.user && data.session) {
        setUser(data.user);
        const r = await fetchRole(data.user);
        setRole(r);
      }
      return { error: null };
    } catch (err: any) {
      return { error: err?.message || "Signup failed" };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setUser(null);
      setRole(null);
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
