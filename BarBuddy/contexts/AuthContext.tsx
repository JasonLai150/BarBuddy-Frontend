import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { router } from 'expo-router';
import {
  getValidIdToken,
  signInWithCognito,
  signOutHostedUI,
  signOutLocal,
  refreshTokens,
  isTokenExpired,
  getIdToken,
  getRefreshToken,
} from '@/services/cognito-auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** How often (ms) the background timer attempts a proactive token refresh */
const TOKEN_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes

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
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      // base64url → base64
      let base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      while (base64.length % 4 !== 0) base64 += '=';
      const decoded = JSON.parse(atob(base64));
      return decoded.sub || null;
    } catch (error) {
      console.error('[Auth] Error decoding token:', error);
      return null;
    }
  }, []);

  // ── Force-logout helper (used when refresh fails) ──────────────
  const forceLogout = useCallback(async () => {
    console.log('[Auth] Force logout – session expired');
    await signOutLocal();
    setIsAuthenticated(false);
    setUserId(null);
    stopRefreshTimer();
    router.replace('/login' as any);
  }, []);

  // ── Proactive token refresh ────────────────────────────────────
  const attemptTokenRefresh = useCallback(async () => {
    try {
      const idToken = await getIdToken();
      if (!idToken) {
        // No token at all – session gone
        await forceLogout();
        return;
      }

      if (isTokenExpired(idToken)) {
        console.log('[Auth] Token expired – refreshing…');
        const ok = await refreshTokens();
        if (!ok) {
          await forceLogout();
          return;
        }
        // Update userId from the fresh token
        const freshToken = await getIdToken();
        if (freshToken) {
          setUserId(extractUserIdFromToken(freshToken));
        }
        console.log('[Auth] Proactive token refresh succeeded');
      }
    } catch (error) {
      console.error('[Auth] Proactive refresh error:', error);
      await forceLogout();
    }
  }, [forceLogout, extractUserIdFromToken]);

  const startRefreshTimer = useCallback(() => {
    stopRefreshTimer();
    refreshTimerRef.current = setInterval(attemptTokenRefresh, TOKEN_REFRESH_INTERVAL_MS);
    console.log('[Auth] Refresh timer started');
  }, [attemptTokenRefresh]);

  const stopRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
      refreshTimerRef.current = null;
      console.log('[Auth] Refresh timer stopped');
    }
  }, []);

  // ── Initial auth check on mount ────────────────────────────────
  const checkAuth = useCallback(async () => {
    try {
      console.log('[Auth] Starting auth check...');
      // getValidIdToken refreshes automatically if expired
      const idToken = await getValidIdToken();
      const hasToken = !!idToken;
      console.log('[Auth] checkAuth: hasToken =', hasToken);

      if (hasToken && idToken) {
        const extractedUserId = extractUserIdFromToken(idToken);
        setUserId(extractedUserId);
        console.log('[Auth] Extracted userId:', extractedUserId);
        setIsAuthenticated(true);
        startRefreshTimer();
      } else {
        setUserId(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('[Auth] checkAuth error:', error);
      setIsAuthenticated(false);
      setUserId(null);
    } finally {
      setIsLoading(false);
    }
  }, [extractUserIdFromToken, startRefreshTimer]);

  useEffect(() => {
    console.log('[Auth] AuthProvider mounted, checking auth...');
    checkAuth();
    return () => stopRefreshTimer();
  }, []);

  // ── Re-validate tokens when the app returns to the foreground ──
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && isAuthenticated) {
        console.log('[Auth] App foregrounded – validating tokens');
        attemptTokenRefresh();
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [isAuthenticated, attemptTokenRefresh]);

  // ── clearTokens (debug helper) ─────────────────────────────────
  const clearTokens = async () => {
    console.log('[Auth] Clearing tokens...');
    await signOutLocal();
    setIsAuthenticated(false);
    setUserId(null);
    stopRefreshTimer();
    console.log('[Auth] Tokens cleared, redirecting to login');
  };

  // ── Sign in ────────────────────────────────────────────────────
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
      startRefreshTimer();
      router.replace('/(tabs)');
    } catch (error) {
      console.error('[Auth] Sign in failed:', error);
    }
  };

  // ── Sign out (full Cognito logout) ─────────────────────────────
  const signOut = async () => {
    try {
      console.log('[Auth] Signing out (full Hosted UI logout)…');

      // Clear user's jobs from AsyncStorage before logout
      if (userId) {
        const jobsKey = `@barbuddy:jobs:${userId}`;
        await AsyncStorage.removeItem(jobsKey);
        console.log('[Auth] Cleared jobs for user:', userId);
      }

      stopRefreshTimer();

      // signOutHostedUI revokes the refresh token, ends the browser
      // session, then clears all local tokens.
      await signOutHostedUI();

      setIsAuthenticated(false);
      setUserId(null);
      router.replace('/login' as any);
    } catch (error) {
      console.error('[Auth] Sign out error:', error);
      // Fallback – still clear local state
      await signOutLocal();
      setIsAuthenticated(false);
      setUserId(null);
      stopRefreshTimer();
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