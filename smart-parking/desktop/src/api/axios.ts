import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3006/api';

const client = axios.create({ baseURL: API_URL, timeout: 15000 });

client.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

client.interceptors.response.use(
    (res) => {
        if (res.data && typeof res.data === 'object' && 'success' in res.data && 'data' in res.data) {
            res.data = res.data.data;
        }
        return res;
    },
    async (error) => {
        const isAuthEndpoint = error?.config?.url?.includes('/auth/login') || error?.config?.url?.includes('/auth/refresh');
        if (error?.response?.status === 401 && !error.config._retry && !isAuthEndpoint) {
            const refreshed = await tryRefreshToken();
            if (refreshed) {
                error.config._retry = true;
                error.config.headers.Authorization = `Bearer ${refreshed}`;
                return client.request(error.config);
            }
        }
        return Promise.reject(error);
    },
);

async function tryRefreshToken(): Promise<string | null> {
    try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) return null;
        const { data: rawData } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const data = rawData?.data ?? rawData;
        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        return data.accessToken;
    } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return null;
    }
}

export default client;