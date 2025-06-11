
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
}

interface Subscription {
  subscribed: boolean;
  plan?: string;
  expiresAt?: Date;
}

interface AuthContextType {
  user: User | null;
  subscription: Subscription | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
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
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        const savedSubscription = localStorage.getItem('subscription');
        
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
        
        if (savedSubscription) {
          setSubscription(JSON.parse(savedSubscription));
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      // Simulate login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: '1',
        email,
        name: email.split('@')[0],
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      // Check subscription status
      const mockSubscription: Subscription = {
        subscribed: false,
      };
      
      setSubscription(mockSubscription);
      localStorage.setItem('subscription', JSON.stringify(mockSubscription));
    } catch (error) {
      throw new Error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      // Simulate Google OAuth
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockUser: User = {
        id: '1',
        email: 'user@gmail.com',
        name: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      // Check subscription status
      const mockSubscription: Subscription = {
        subscribed: false,
      };
      
      setSubscription(mockSubscription);
      localStorage.setItem('subscription', JSON.stringify(mockSubscription));
    } catch (error) {
      throw new Error('Google login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      // Simulate registration
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: User = {
        id: '1',
        email,
        name,
      };
      
      setUser(mockUser);
      localStorage.setItem('user', JSON.stringify(mockUser));
      
      const mockSubscription: Subscription = {
        subscribed: false,
      };
      
      setSubscription(mockSubscription);
      localStorage.setItem('subscription', JSON.stringify(mockSubscription));
    } catch (error) {
      throw new Error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setSubscription(null);
    localStorage.removeItem('user');
    localStorage.removeItem('subscription');
  };

  const value: AuthContextType = {
    user,
    subscription,
    login,
    loginWithGoogle,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
