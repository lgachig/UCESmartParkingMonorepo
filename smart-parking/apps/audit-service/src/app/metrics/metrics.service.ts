import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  readonly register = new client.Registry();

  readonly httpRequestsTotal = new client.Counter({
    name: 'audit_http_requests_total',
    help: 'Total HTTP requests handled by audit-service',
    labelNames: ['method', 'route', 'status'] as const,
    registers: [this.register],
  });

  readonly httpRequestDuration = new client.Histogram({
    name: 'audit_http_request_duration_seconds',
    help: 'HTTP request duration in seconds for audit-service',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [this.register],
  });

  readonly eventsAuditedTotal = new client.Counter({
    name: 'audit_events_consumed_total',
    help: 'Total Kafka events persisted to the audit trail, per topic',
    labelNames: ['topic', 'status'] as const,
    registers: [this.register],
  });

  onModuleInit() {
    client.collectDefaultMetrics({
      register: this.register,
      prefix: 'audit_',
    });
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }
}
