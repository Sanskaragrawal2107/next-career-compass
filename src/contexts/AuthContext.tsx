import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
}

interface Subscription {
  subscribed: boolean;
  subscription_tier?: string;
  subscription_end?: Date;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  subscription: Subscription | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set up auth state listener
    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email || 'no user');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User authenticated, fetching profile and subscription...');
          // Fetch user profile and subscription after a brief delay to allow DB trigger to complete
          setTimeout(async () => {
            await fetchUserProfile(session.user.id);
            await fetchSubscription(session.user.id);
          }, 100);
        } else {
          console.log('No user, clearing profile and subscription');
          setProfile(null);
          setSubscription(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Existing session check:', session?.user?.email || 'no session');
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
        fetchSubscription(session.user.id);
      }
      setLoading(false);
    });

    return () => authSubscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      console.log('Profile fetched:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchSubscription = async (userId: string) => {
    try {
      console.log('Fetching subscription for user:', userId);
      const { data, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching subscription:', error);
        // For any existing user without subscription record, create one with access
        console.log('Creating subscription record for existing user');
        const { error: insertError } = await supabase
          .from('subscribers')
          .insert({
            user_id: userId,
            email: user?.email || '',
            subscribed: true,
            subscription_tier: 'yearly',
            subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year from now
          });

        if (insertError) {
          console.error('Error creating subscription:', insertError);
          setSubscription({ subscribed: true }); // Default to subscribed for existing users
        } else {
          setSubscription({
            subscribed: true,
            subscription_tier: 'yearly',
            subscription_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          });
        }
        return;
      }

      console.log('Subscription fetched:', data);
      setSubscription({
        subscribed: data.subscribed,
        subscription_tier: data.subscription_tier,
        subscription_end: data.subscription_end ? new Date(data.subscription_end) : undefined,
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Default to subscribed for existing users
      setSubscription({ subscribed: true });
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signInWithGoogle = async () => {
    const redirectUrl = `${window.location.origin}/dashboard`;
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
      },
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value: AuthContextType = {
    user,
    profile,
    subscription,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
