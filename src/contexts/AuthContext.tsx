import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

// ✅ Updated AuthContextType with `error`
export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: any;
  signOut: () => Promise<void>;
}

// ✅ Initial context (placeholder values)
const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  error: null, // ✅ Default to null
  signOut: async () => {},
});

// ✅ Hook to access auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// ✅ AuthProvider
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null); // ✅ Added error state

  useEffect(() => {
    // ✅ Load initial session and handle errors
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("❌ Error fetching session:", error);
        setError(error);
      } else {
        setError(null); // Clear any previous errors
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // ✅ Handle auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setError(null); // Clear error on successful auth change
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // ✅ Include `error` in context value
  const value: AuthContextType = {
    user,
    session,
    loading,
    error,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
