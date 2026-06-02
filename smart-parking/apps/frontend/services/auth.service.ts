import { authApi } from '@/lib/api';
import { authStorage } from '@/lib/auth-storage';
import type {
  AuthProfile,
  AuthTokens,
  ForgotPasswordResult,
  LoginResult,
  MessageResult,
  RegisterPayload,
} from '@/interfaces/auth.interface';

export const authService = {
  async login(email: string, password: string): Promise<LoginResult> {
    const { data } = await authApi.post<LoginResult>('/auth/login', {
      email,
      password,
    });
    return data;
  },

  async register(payload: RegisterPayload): Promise<MessageResult> {
    const { data } = await authApi.post<MessageResult>(
      '/auth/register',
      payload,
    );
    return data;
  },

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const { data } = await authApi.post<AuthTokens>('/auth/refresh', {
      refreshToken,
    });
    return data;
  },

  async logout(): Promise<void> {
    try {
      await authApi.post('/auth/logout');
    } catch {
      // Clear local session even if server call fails
    }
  },

  async getProfile(): Promise<AuthProfile> {
    const { data } = await authApi.get<AuthProfile>('/auth/profile');
    return data;
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResult> {
    const { data } = await authApi.post<ForgotPasswordResult>(
      '/auth/forgot-password',
      { email },
    );
    return data;
  },

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<MessageResult> {
    const { data } = await authApi.post<MessageResult>('/auth/reset-password', {
      token,
      newPassword,
    });
    return data;
  },

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<MessageResult> {
    const { data } = await authApi.post<MessageResult>(
      '/auth/change-password',
      { currentPassword, newPassword },
    );
    return data;
  },
};
