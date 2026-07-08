import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface UpstreamStatus {
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

export interface OutboxSummaryResult {
    parking: OutboxSummaryCounts | null;
    reservation: OutboxSummaryCounts | null;
    payment: OutboxSummaryCounts | null;
}

@Injectable()
export class UpstreamHealthService {
    private readonly logger = new Logger(UpstreamHealthService.name);

    constructor(private readonly configService: ConfigService) { }

    private getServiceMap(): Record<string, string | undefined> {
        return {
            auth: this.configService.get<string>('AUTH_SERVICE_URL'),
            user: this.configService.get<string>('USER_SERVICE_URL'),
            vehicle: this.configService.get<string>('VEHICLE_SERVICE_URL'),
            parking: this.configService.get<string>('PARKING_SERVICE_URL'),
            reservation: this.configService.get<string>('RESERVATION_SERVICE_URL'),
            payment: this.configService.get<string>('PAYMENT_SERVICE_URL'),
            notification: this.configService.get<string>('NOTIFICATION_SERVICE_URL'),
            ai: this.configService.get<string>('AI_SERVICE_URL'),
            realtime: this.configService.get<string>('REALTIME_SERVICE_URL'),
            audit: this.configService.get<string>('AUDIT_SERVICE_URL'),
        };
    }

    async checkAll(): Promise<UpstreamStatus[]> {
        const services = this.getServiceMap();
        const results = await Promise.allSettled(
            Object.entries(services).map(([name, url]) => this.checkOne(name, url)),
        );
        return results.map((r) =>
            r.status === 'fulfilled' ? r.value : { name: 'unknown', up: false, error: 'check failed' },
        );
    }

    private async checkOne(name: string, url: string | undefined): Promise<UpstreamStatus> {
        if (!url) return { name, up: false, error: 'URL no configurada' };

        const cleanUrl = url.replace(/\/+$/, '');
        const endpoint = cleanUrl.endsWith('/api') ? `${cleanUrl}/health` : `${cleanUrl}/api/health`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        try {
            const res = await fetch(endpoint, { signal: controller.signal });
            const body = await res.json().catch(() => null);
            return {
                name,
                up: res.ok,
                details: body?.details ?? body?.info ?? undefined,
                error: res.ok ? undefined : body?.error ? JSON.stringify(body.error) : `HTTP ${res.status}`,
            };
        } catch (err) {
            this.logger.warn(`Health check falló para ${name} (${endpoint}): ${(err as Error).message}`);
            return { name, up: false, error: (err as Error).message };
        } finally {
            clearTimeout(timeout);
        }
    }

    async getRealtimeConnections(): Promise<number | null> {
        const url = this.configService.get<string>('REALTIME_SERVICE_URL');
        if (!url) return null;

        const cleanUrl = url.replace(/\/+$/, '');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        try {
            const res = await fetch(`${cleanUrl}/metrics`, { signal: controller.signal });
            if (!res.ok) return null;
            const text = await res.text();
            const match = text.match(/^realtime_active_connections\s+(\d+(?:\.\d+)?)/m);
            return match ? Number(match[1]) : null;
        } catch (err) {
            this.logger.warn(`No se pudo leer /metrics de realtime-service: ${(err as Error).message}`);
            return null;
        } finally {
            clearTimeout(timeout);
        }
    }

    async getOutboxSummary(): Promise<OutboxSummaryResult> {
        const serviceKey = this.configService.get<string>('INTERNAL_SERVICE_KEY');

        const [parking, reservation, payment] = await Promise.all([
            this.fetchOutboxSummary(this.configService.get<string>('PARKING_SERVICE_URL'), serviceKey),
            this.fetchOutboxSummary(this.configService.get<string>('RESERVATION_SERVICE_URL'), serviceKey),
            this.fetchOutboxSummary(this.configService.get<string>('PAYMENT_SERVICE_URL'), serviceKey),
        ]);

        return { parking, reservation, payment };
    }

    private async fetchOutboxSummary(
        url: string | undefined,
        serviceKey: string | undefined,
    ): Promise<OutboxSummaryCounts | null> {
        if (!url || !serviceKey) return null;

        const cleanUrl = url.replace(/\/+$/, '');
        const endpoint = `${cleanUrl}/api/internal/outbox/summary`;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);

        try {
            const res = await fetch(endpoint, {
                signal: controller.signal,
                headers: { 'x-service-key': serviceKey },
            });

            if (!res.ok) return null;

            const body = await res.json().catch(() => null);
            if (!body || typeof body !== 'object') return null;

            const raw = body as Partial<OutboxSummaryCounts> & { n8n?: { sent?: number; failed?: number } };

            return {
                pending: Number(raw.pending ?? 0),
                processed: Number(raw.processed ?? 0),
                failed: Number(raw.failed ?? 0),
                n8n: {
                    sent: Number(raw.n8n?.sent ?? 0),
                    failed: Number(raw.n8n?.failed ?? 0),
                },
            };
        } catch (err) {
            this.logger.warn(`No se pudo leer outbox summary (${endpoint}): ${(err as Error).message}`);
            return null;
        } finally {
            clearTimeout(timeout);
        }
    }
}