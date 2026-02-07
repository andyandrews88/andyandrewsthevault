import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const STRIPE_PAYMENT_URL = 'https://buy.stripe.com/6oU6oHa8VaojfAt1AFenS0F';

interface Subscription {
  id: string;
  user_id: string;
  trial_started_at: string;
  subscription_status: 'trial' | 'active' | 'expired' | 'cancelled';
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Computed values
  isAuthenticated: boolean;
  isTrialActive: boolean;
  trialDaysRemaining: number;
  hasActiveSubscription: boolean;
  
  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  redirectToPayment: () => void;
}

const calculateTrialStatus = (subscription: Subscription | null): { isActive: boolean; daysRemaining: number } => {
  if (!subscription) return { isActive: false, daysRemaining: 0 };
  
  if (subscription.subscription_status === 'active') {
    return { isActive: true, daysRemaining: -1 }; // -1 indicates paid subscriber
  }
  
  if (subscription.subscription_status !== 'trial') {
    return { isActive: false, daysRemaining: 0 };
  }
  
  const trialStart = new Date(subscription.trial_started_at);
  const now = new Date();
  const daysPassed = Math.floor((now.getTime() - trialStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = Math.max(0, 7 - daysPassed);
  
  return {
    isActive: daysRemaining > 0,
    daysRemaining
  };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  subscription: null,
  isLoading: true,
  isInitialized: false,
  isAuthenticated: false,
  isTrialActive: false,
  trialDaysRemaining: 0,
  hasActiveSubscription: false,

  initialize: async () => {
    // Set up auth state listener FIRST
    supabase.auth.onAuthStateChange(
      (event, session) => {
        set({ 
          session, 
          user: session?.user ?? null,
          isAuthenticated: !!session?.user
        });
        
        // Defer subscription fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            get().fetchSubscription();
          }, 0);
        } else {
          set({ 
            subscription: null, 
            isTrialActive: false, 
            trialDaysRemaining: 0,
            hasActiveSubscription: false
          });
        }
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

    if (session?.user) {
      await get().fetchSubscription();
    }
  },

  fetchSubscription: async () => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching subscription:', error);
      return;
    }

    const { isActive, daysRemaining } = calculateTrialStatus(data);
    
    set({ 
      subscription: data,
      isTrialActive: isActive,
      trialDaysRemaining: daysRemaining,
      hasActiveSubscription: data?.subscription_status === 'active'
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
      subscription: null,
      isAuthenticated: false,
      isTrialActive: false,
      trialDaysRemaining: 0,
      hasActiveSubscription: false,
      isLoading: false 
    });
  },

  redirectToPayment: () => {
    window.location.href = STRIPE_PAYMENT_URL;
  }
}));
