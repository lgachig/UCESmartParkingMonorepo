import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  readonly register = new client.Registry();

  readonly httpRequestsTotal = new client.Counter({
    name: 'auth_http_requests_total',
    help: 'Total HTTP requests handled by auth-service',
    labelNames: ['method', 'route', 'status'] as const,
    registers: [this.register],
  });

  readonly httpRequestDuration = new client.Histogram({
    name: 'auth_http_request_duration_seconds',
    help: 'HTTP request duration in seconds for auth-service',
    labelNames: ['method', 'route', 'status'] as const,
    buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
    registers: [this.register],
  });

  onModuleInit() {
    client.collectDefaultMetrics({
      register: this.register,
      prefix: 'auth_',
    });
  }

  async getMetrics(): Promise<string> {
    return this.register.metrics();
  }

  getContentType(): string {
    return this.register.contentType;
  }
}
