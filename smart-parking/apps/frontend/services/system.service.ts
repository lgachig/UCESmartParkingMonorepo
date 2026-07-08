import { systemApi } from '@/lib/api';

export interface ServiceStatus {
    name: string;
    up: boolean;
    details?: Record<string, { status: string }>;
    error?: string;
}

export interface SystemStatus {
    generatedAt: string;
    overallStatus: 'operational' | 'degraded';
    services: ServiceStatus[];
    summary: { total: number; up: number; down: number; downNames: string[] };
    realtime: { connected: boolean; activeConnections: number | null };
}

export const systemService = {
    async getStatus(): Promise<SystemStatus> {
        const { data } = await systemApi.get<SystemStatus>('/system/status');
        return data;
    },
};