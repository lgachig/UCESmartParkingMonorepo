import client from './axios';

export interface LoginPayload { email: string; password: string; }
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: { id: string; email: string; role: string };
}

export const authApi = {
    async login(payload: LoginPayload): Promise<LoginResponse> {
        const { data } = await client.post<LoginResponse>('/auth/login', payload);
        return data;
    },
    async logout(): Promise<void> {
        await client.post('/auth/logout');
    },
};