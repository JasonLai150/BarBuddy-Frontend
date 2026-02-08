import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { router } from 'expo-router';
import { getIdToken, signInWithCognito, signOutHostedUI, signOutLocal } from '@/services/cognito-auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  isAuthenticated: boolean | null;
  isLoading: boolean;
  userId: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearTokens: () => Promise<void>;
  getUserId: () => string | null;
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
  const [userId, setUserId] = useState<string | null>(null);

  /**
   * Decode JWT and extract the 'sub' (subject/user ID) claim
   */
  const extractUserIdFromToken = useCallback((token: string): string | null => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.warn('[Auth] Invalid token format');
        return null;
      }
      const payload = parts[1];
      const decoded = JSON.parse(atob(payload));
      return decoded.sub || null;
    } catch (error) {
      console.error('[Auth] Error decoding token:', error);
      return null;
    }
  }, []);

  const checkAuth = async () => {
    try {
      console.log('[Auth] Starting auth check...');
      const idToken = await getIdToken();
      const hasToken = !!idToken;
      console.log('[Auth] checkAuth: hasToken =', hasToken, 'token length:', idToken?.length || 0);
      
      if (hasToken && idToken) {
        const extractedUserId = extractUserIdFromToken(idToken);
        setUserId(extractedUserId);
        console.log('[Auth] Extracted userId:', extractedUserId);
      } else {
        setUserId(null);
      }
      
      setIsAuthenticated(hasToken);
    } catch (error) {
      console.error('[Auth] checkAuth error:', error);
      setIsAuthenticated(false);
      setUserId(null);
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
      const idToken = await getIdToken();
      if (idToken) {
        const extractedUserId = extractUserIdFromToken(idToken);
        setUserId(extractedUserId);
        console.log('[Auth] Extracted userId after sign in:', extractedUserId);
      }
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
      
      // Clear user's jobs from AsyncStorage before logout
      if (userId) {
        const jobsKey = `@barbuddy:jobs:${userId}`;
        await AsyncStorage.removeItem(jobsKey);
        console.log('[Auth] Cleared jobs for user:', userId);
      }
      
      await signOutLocal();
      setIsAuthenticated(false);
      setUserId(null);
      router.replace('/login' as any);
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
      // Still set not authenticated even if local sign out fails
      setIsAuthenticated(false);
      setUserId(null);
      router.replace('/login' as any);
    }
  };

  const getUserId = useCallback(() => userId, [userId]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, userId, signIn, signOut, clearTokens, getUserId }}>
      {children}
    </AuthContext.Provider>
  );
};