import type { UserRole } from '@/lib/env';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult extends AuthTokens {
  user: AuthUser;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}

export interface AuthProfile {
  userId: string;
  email: string;
  role: UserRole;
}

export interface ForgotPasswordResult {
  message: string;
  resetUrl?: string;
}

export interface MessageResult {
  message: string;
}
