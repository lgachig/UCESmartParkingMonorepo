import { systemApi } from '@/lib/api';

export interface ServiceStatus {
    name: string;
    up: boolean;
    details?: Record<string, { status: string }>;
    error?: string;
}

export interface OutboxSummaryCounts {
    pending: number;
    processed: number;
    failed: number;
    n8n: { sent: number; failed: number };
}

export interface OutboxSummary {
    parking: OutboxSummaryCounts | null;
    reservation: OutboxSummaryCounts | null;
    payment: OutboxSummaryCounts | null;
}

export interface SystemStatus {
    generatedAt: string;
    overallStatus: 'operational' | 'degraded';
    services: ServiceStatus[];
    summary: { total: number; up: number; down: number; downNames: string[] };
    realtime: { connected: boolean; activeConnections: number | null };
    outbox: OutboxSummary;
}

export const systemService = {
    async getStatus(): Promise<SystemStatus> {
        const { data } = await systemApi.get<SystemStatus>('/system/status');
        return data;
    },
};
