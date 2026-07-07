import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
    readonly register = new client.Registry();

    readonly httpRequestsTotal = new client.Counter({
        name: 'ai_http_requests_total',
        help: 'Total HTTP requests handled by ai-service',
        labelNames: ['method', 'route', 'status'] as const,
        registers: [this.register],
    });

    readonly httpRequestDuration = new client.Histogram({
        name: 'ai_http_request_duration_seconds',
        help: 'HTTP request duration in seconds for ai-service',
        labelNames: ['method', 'route', 'status'] as const,
        buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
        registers: [this.register],
    });

    readonly circuitBreakerTrips = new client.Counter({
        name: 'ai_circuit_breaker_trips_total',
        help: 'Total times the circuit breaker toward an external dependency tripped open',
        labelNames: ['target'] as const,
        registers: [this.register],
    });

    readonly usageHistoryUpdatesTotal = new client.Counter({
        name: 'ai_usage_history_updates_total',
        help: 'Total usage history updates processed from reservation.checkout events',
        labelNames: ['status'] as const,
        registers: [this.register],
    });

    onModuleInit() {
        client.collectDefaultMetrics({
            register: this.register,
            prefix: 'ai_',
        });
    }

    async getMetrics(): Promise<string> {
        return this.register.metrics();
    }
}