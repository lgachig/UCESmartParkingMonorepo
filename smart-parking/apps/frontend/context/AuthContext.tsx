'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { authStorage, type StoredUser } from '@/lib/auth-storage';
import { getHomeRouteForRole } from '@/lib/env';
import { authService } from '@/services/auth.service';

interface AuthContextValue {
  user: StoredUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = authStorage.getUser();
    setUser(stored);
    if (stored && authStorage.getAccessToken()) {
      authService
        .getProfile()
        .then((profile) => {
          const nextUser: StoredUser = {
            id: profile.userId,
            email: profile.email,
            role: profile.role,
          };
          authStorage.setSession({
            accessToken: authStorage.getAccessToken()!,
            refreshToken: authStorage.getRefreshToken()!,
            user: nextUser,
          });
          setUser(nextUser);
        })
        .catch(() => {
          authStorage.clear();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await authService.login(email, password);
      authStorage.setSession(result);
      setUser(result.user);
      router.push(getHomeRouteForRole(result.user.role));
    },
    [router],
  );

  const register = useCallback(
    async (payload: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    }) => {
      await authService.register({
        ...payload,
        role: 'STUDENT',
      });
      await login(payload.email, payload.password);
    },
    [login],
  );

  const logout = useCallback(async () => {
    await authService.logout();
    authStorage.clear();
    setUser(null);
    router.push('/login');
  }, [router]);

  const refreshProfile = useCallback(async () => {
    const profile = await authService.getProfile();
    const nextUser: StoredUser = {
      id: profile.userId,
      email: profile.email,
      role: profile.role,
    };
    authStorage.setSession({
      accessToken: authStorage.getAccessToken()!,
      refreshToken: authStorage.getRefreshToken()!,
      user: nextUser,
    });
    setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user && !!authStorage.getAccessToken(),
      login,
      register,
      logout,
      refreshProfile,
    }),
    [user, isLoading, login, register, logout, refreshProfile],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
