import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
    readonly register = new client.Registry();

    readonly httpRequestsTotal = new client.Counter({
        name: 'realtime_http_requests_total',
        help: 'Total HTTP requests handled by realtime-service',
        labelNames: ['method', 'route', 'status'] as const,
        registers: [this.register],
    });

    readonly httpRequestDuration = new client.Histogram({
        name: 'realtime_http_request_duration_seconds',
        help: 'HTTP request duration in seconds for realtime-service',
        labelNames: ['method', 'route', 'status'] as const,
        buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
        registers: [this.register],
    });

    readonly activeConnectionsGauge = new client.Gauge({
        name: 'realtime_active_connections',
        help: 'Active WebSocket connections currently held by this realtime-service instance',
        registers: [this.register],
    });

    readonly kafkaEventsProcessedTotal = new client.Counter({
        name: 'realtime_kafka_events_processed_total',
        help: 'Total number of Kafka slot.* events processed by realtime-service',
        labelNames: ['topic', 'status'] as const,
        registers: [this.register],
    });

    onModuleInit() {
        client.collectDefaultMetrics({
            register: this.register,
            prefix: 'realtime_',
        });
    }

    async getMetrics(): Promise<string> {
        return this.register.metrics();
    }
}