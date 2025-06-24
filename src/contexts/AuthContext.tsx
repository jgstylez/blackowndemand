import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { logError } from '../lib/errorLogger';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  error: null,
  refreshUser: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshUser = async () => {
    try {
      setLoading(true);
      console.log('🔄 AuthContext: Refreshing user...');
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        throw error;
      }
      
      console.log('✅ AuthContext: User refreshed:', user ? 'Logged in' : 'Not logged in');
      setUser(user);
    } catch (err) {
      const authError = err as AuthError;
      console.error('❌ AuthContext: Failed to refresh user:', authError);
      logError('Failed to refresh user', {
        context: 'AuthContext',
        metadata: { error: authError }
      });
      setError(authError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log('🔍 AuthContext: Initializing auth...');
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        const currentUser = session?.user ?? null;
        console.log('✅ AuthContext: Auth initialized:', currentUser ? 'User found' : 'No user');
        console.log('📊 AuthContext: Session data:', session ? 'Session exists' : 'No session');
        
        setUser(currentUser);
      } catch (err) {
        const authError = err as AuthError;
        console.error('❌ AuthContext: Failed to get auth session:', authError);
        logError('Failed to get auth session', {
          context: 'AuthContext',
          metadata: { error: authError }
        });
        setError(authError);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('🔔 AuthContext: Auth state changed:', _event);
      console.log('👤 AuthContext: New user state:', session?.user ? 'Logged in' : 'Not logged in');
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};