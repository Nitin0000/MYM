import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface AppUser {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
  app_metadata?: {
    provider?: string;
  };
  created_at?: string;
}

type AuthContextType = {
  session: Session | null;
  user: AppUser | null;
  isLoading: boolean;
  isDemo: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<void>;
  signInAsDemoUser: () => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isLoading: true,
  isDemo: false,
  signInWithEmail: async () => ({ error: null }),
  signUpWithEmail: async () => ({ error: null }),
  signInWithGoogle: async () => {},
  signInAsDemoUser: () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Check if demo user is stored
    const demoStored = localStorage.getItem('mym_demo_user');
    if (demoStored) {
      try {
        const parsed = JSON.parse(demoStored);
        setUser(parsed);
        setIsDemo(true);
        setIsLoading(false);
        return;
      } catch {
        localStorage.removeItem('mym_demo_user');
      }
    }

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser((session?.user as AppUser) || null);
        setIsLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser((session?.user as AppUser) || null);
        setIsLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setIsLoading(false);
    }
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      // Create local demo user for this email
      const demoUser: AppUser = {
        id: 'local-' + btoa(email).slice(0, 8),
        email,
        user_metadata: { full_name: email.split('@')[0] },
        app_metadata: { provider: 'email' },
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('mym_demo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      setIsDemo(true);
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!isSupabaseConfigured) {
      return signInWithEmail(email, password);
    }
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      const demoUser: AppUser = {
        id: 'google-demo-user-1',
        email: 'alex.google@example.com',
        user_metadata: { full_name: 'Alex Johnson' },
        app_metadata: { provider: 'google' },
        created_at: new Date().toISOString(),
      };
      localStorage.setItem('mym_demo_user', JSON.stringify(demoUser));
      setUser(demoUser);
      setIsDemo(true);
      return;
    }
    // Ensure redirect returns to the exact subfolder on GitHub Pages (/MYM/) or localhost
    const redirectUrl = `${window.location.origin}${window.location.pathname}`;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });
  };

  const signInAsDemoUser = () => {
    const demoUser: AppUser = {
      id: 'demo-user-12345',
      email: 'demo@mym.finance',
      user_metadata: { full_name: 'Harman Demo' },
      app_metadata: { provider: 'email' },
      created_at: '2024-01-01T00:00:00.000Z',
    };
    localStorage.setItem('mym_demo_user', JSON.stringify(demoUser));
    setUser(demoUser);
    setIsDemo(true);
  };

  const signOut = async () => {
    localStorage.removeItem('mym_demo_user');
    setIsDemo(false);
    setUser(null);
    setSession(null);
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        isDemo,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInAsDemoUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
