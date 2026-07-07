import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
    readonly register = new client.Registry();

    readonly emailsSentTotal = new client.Counter({
        name: 'notification_emails_sent_total',
        help: 'Total de emails enviados exitosamente',
        labelNames: ['type'] as const,
        registers: [this.register],
    });

    readonly emailsFailedTotal = new client.Counter({
        name: 'notification_emails_failed_total',
        help: 'Total de fallos al enviar emails',
        labelNames: ['type'] as const,
        registers: [this.register],
    });

    readonly eventsProcessedTotal = new client.Counter({
        name: 'notification_events_processed_total',
        help: 'Total de eventos procesados por broker',
        labelNames: ['broker', 'event'] as const,
        registers: [this.register],
    });

    onModuleInit() {
        client.collectDefaultMetrics({ register: this.register, prefix: 'notification_' });
    }

    async getMetrics(): Promise<string> {
        return this.register.metrics();
    }
}