
import type { Session } from '@supabase/supabase-js';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { isPauEmail, supabase } from '../lib/supabase';
console.log('SUPABASE IMPORT CHECK:', typeof supabase);

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  authenticated: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (mounted) {
          setSession(data.session);
        }
      } catch (error) {
        console.warn('Unable to restore session:', error);

        if (mounted) {
          setSession(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession: Session | null) => {
        if (!mounted) return;

        setSession(nextSession);
        setLoading(false);
      }
    );

    loadSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const authenticated = Boolean(
    session?.user.email_confirmed_at &&
    session.user.email &&
    isPauEmail(session.user.email)
  );

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setSession(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        authenticated,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    );
  }

  return context;
}
