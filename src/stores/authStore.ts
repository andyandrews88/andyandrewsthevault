import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  isAuthenticated: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isLoading: false,
  isInitialized: false,
  isAuthenticated: false,

  initialize: async () => {
    // Set up auth state listener FIRST
    supabase.auth.onAuthStateChange(
      (event, session) => {
        set({ 
          session, 
          user: session?.user ?? null,
          isAuthenticated: !!session?.user
        });
      }
    );

    // THEN check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    
    set({ 
      session, 
      user: session?.user ?? null,
      isAuthenticated: !!session?.user,
      isLoading: false,
      isInitialized: true
    });
  },

  signIn: async (email: string, password: string) => {
    set({ isLoading: true });
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    set({ isLoading: false });
    
    return { error: error as Error | null };
  },

  signUp: async (email: string, password: string) => {
    set({ isLoading: true });
    
    const redirectUrl = `${window.location.origin}/vault`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });

    set({ isLoading: false });
    
    return { error: error as Error | null };
  },

  signOut: async () => {
    set({ isLoading: true });
    await supabase.auth.signOut();
    set({ 
      user: null, 
      session: null, 
      isAuthenticated: false,
      isLoading: false 
    });
  },
}));
