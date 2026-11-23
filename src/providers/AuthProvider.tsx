
import type { Session } from '@supabase/supabase-js';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { AppState } from 'react-native';

import { isPauEmail, supabase } from '../lib/supabase';

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
  const [session, setSession] = useState<Session | null>(
    null
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialSessionLoaded = false;

    // Listen for authentication changes.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!mounted) return;

        setSession(nextSession);

        // Wait for the initial session restoration
        // before allowing authentication redirects.
        if (initialSessionLoaded) {
          setLoading(false);
        }
      }
    );

    async function restoreSession() {
      try {
        const { data, error } =
          await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (mounted) {
          setSession(data.session);
        }
      } catch (error) {
        // A temporary failure should not automatically
        // erase an existing saved authentication session.
        console.warn(
          'Unable to restore authentication session:',
          error
        );
      } finally {
        initialSessionLoaded = true;

        if (mounted) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    // Refresh tokens only while the app is active.
    const appStateSubscription =
      AppState.addEventListener('change', (state) => {
        if (state === 'active') {
          supabase.auth.startAutoRefresh();
        } else {
          supabase.auth.stopAutoRefresh();
        }
      });

    if (AppState.currentState === 'active') {
      supabase.auth.startAutoRefresh();
    }

    return () => {
      mounted = false;
      subscription.unsubscribe();
      appStateSubscription.remove();
      supabase.auth.stopAutoRefresh();
    };
  }, []);

  const authenticated = useMemo(() => {
    if (!session?.user) return false;

    const email = session.user.email;

    return Boolean(
      email &&
      session.user.email_confirmed_at &&
      isPauEmail(email)
    );
  }, [session]);

  async function signOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setSession(null);
  }

  const value = useMemo(
    () => ({
      session,
      loading,
      authenticated,
      signOut,
    }),
    [session, loading, authenticated]
  );

  return (
    <AuthContext.Provider value={value}>
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
