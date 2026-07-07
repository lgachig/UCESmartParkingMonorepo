import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { env } from './env';
import { authStorage } from './auth-storage';

type ApiEnvelope<T> = {
  success: boolean;
  timestamp: string;
  data: T;
};

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function unwrapResponse<T>(payload: unknown): T {
  if (
    payload &&
    typeof payload === 'object' &&
    'success' in payload &&
    (payload as ApiEnvelope<T>).success === true &&
    'data' in payload
  ) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

let refreshPromise: Promise<void> | null = null;

async function refreshAccessToken(): Promise<void> {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token');
  }
  const response = await axios.post(
    `${env.authApiUrl}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  );
  const tokens = unwrapResponse<{ accessToken: string; refreshToken: string }>(
    response.data,
  );
  const user = authStorage.getUser();
  if (!user) {
    throw new Error('No user session');
  }
  authStorage.setSession({ ...tokens, user });
}

function attachAuthInterceptors(instance: AxiosInstance) {
  instance.interceptors.request.use((config) => {
    const token = authStorage.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => {
      response.data = unwrapResponse(response.data);
      return response;
    },
    async (error) => {
      const original = error.config as RetryConfig | undefined;
      if (
        error.response?.status === 401 &&
        original &&
        !original._retry &&
        !original.url?.includes('/auth/login') &&
        !original.url?.includes('/auth/refresh')
      ) {
        original._retry = true;
        try {
          refreshPromise ??= refreshAccessToken().finally(() => {
            refreshPromise = null;
          });
          await refreshPromise;
          const token = authStorage.getAccessToken();
          if (token) {
            original.headers.Authorization = `Bearer ${token}`;
          }
          return instance(original);
        } catch {
          authStorage.clear();
        }
      }
      throw error;
    },
  );
}

function createApi(baseURL: string, attachAuth = false): AxiosInstance {
  const instance = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
  });

  if (attachAuth) {
    attachAuthInterceptors(instance);
  } else {
    instance.interceptors.response.use((response) => {
      response.data = unwrapResponse(response.data);
      return response;
    });
  }

  return instance;
}

export const authApi = createApi(env.authApiUrl, true);
export const userApi = createApi(env.userApiUrl, true);
export const vehicleApi = createApi(env.vehicleApiUrl, true);
export const parkingApi = createApi(env.parkingApiUrl, true);
export const reservationApi = createApi(env.reservationApiUrl, true);
export const paymentApi = createApi(env.paymentApiUrl, true);
export const aiApi = createApi(env.aiApiUrl, true);