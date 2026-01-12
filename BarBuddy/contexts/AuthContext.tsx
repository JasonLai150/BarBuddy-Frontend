import React, { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { getIdToken, signInWithCognito, signOutHostedUI, signOutLocal } from '@/services/cognito-auth';

interface AuthContextType {
  isAuthenticated: boolean | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearTokens: () => Promise<void>;
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      console.log('[Auth] Starting auth check...');
      const idToken = await getIdToken();
      const hasToken = !!idToken;
      console.log('[Auth] checkAuth: hasToken =', hasToken, 'token length:', idToken?.length || 0);
      setIsAuthenticated(hasToken);
    } catch (error) {
      console.error('[Auth] checkAuth error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      console.log('[Auth] Auth check complete, isLoading = false, isAuthenticated =', isAuthenticated);
    }
  };

  useEffect(() => {
    console.log('[Auth] AuthProvider mounted, checking auth...');
    checkAuth();
  }, []);

  const clearTokens = async () => {
    console.log('[Auth] Clearing tokens...');
    await signOutLocal();
    setIsAuthenticated(false);
    console.log('[Auth] Tokens cleared, redirecting to login');
  };

  const signIn = async () => {
    try {
      console.log('[Auth] Starting sign in...');
      await signInWithCognito();
      console.log('[Auth] Sign in successful, setting authenticated = true');
      setIsAuthenticated(true);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('[Auth] Sign in failed:', error);
      // Handle error, maybe show alert
    }
  };

  const signOut = async () => {
    try {
      console.log('[Auth] Signing out...');
      await signOutLocal();
      setIsAuthenticated(false);
      router.replace('/login' as any);
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
      // Still set not authenticated even if local sign out fails
      setIsAuthenticated(false);
      router.replace('/login' as any);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, signIn, signOut, clearTokens }}>
      {children}
    </AuthContext.Provider>
  );
};