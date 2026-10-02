import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AuthContextType = {
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function checkAdminMembership(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Unable to verify admin membership:', error);
    return false;
  }

  return Boolean(data);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const hydrateSession = async (nextSession: Session | null) => {
      if (!active) return;

      setSession(nextSession);

      if (!nextSession?.user) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      const admin = await checkAdminMembership(nextSession.user.id);
      if (!active) return;

      setIsAdmin(admin);
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => {
      void hydrateSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      // Run database authorization outside the auth callback itself.
      queueMicrotask(() => {
        void hydrateSession(newSession);
      });
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: error.message };
    }

    if (!data.user) {
      return { error: 'Inloggen is niet gelukt.' };
    }

    const admin = await checkAdminMembership(data.user.id);
    if (!admin) {
      await supabase.auth.signOut();
      return { error: 'Dit account heeft geen beheerrechten.' };
    }

    setSession(data.session);
    setIsAdmin(true);
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ session, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
