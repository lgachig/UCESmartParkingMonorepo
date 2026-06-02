import { env, type UserRole } from './env';

export interface StoredUser {
  id: string;
  email: string;
  role: UserRole;
}

export const authStorage = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(env.storage.accessToken);
  },

  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(env.storage.refreshToken);
  },

  getUser(): StoredUser | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem(env.storage.user);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  },

  setSession(data: {
    accessToken: string;
    refreshToken: string;
    user: StoredUser;
  }) {
    localStorage.setItem(env.storage.accessToken, data.accessToken);
    localStorage.setItem(env.storage.refreshToken, data.refreshToken);
    localStorage.setItem(env.storage.user, JSON.stringify(data.user));
  },

  clear() {
    localStorage.removeItem(env.storage.accessToken);
    localStorage.removeItem(env.storage.refreshToken);
    localStorage.removeItem(env.storage.user);
  },
};
