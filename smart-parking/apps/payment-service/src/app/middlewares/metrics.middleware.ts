import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly metricsService: MetricsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
      const durationSeconds =
        Number(process.hrtime.bigint() - start) / 1_000_000_000;
      const route = req.route?.path ?? req.originalUrl;
      const labels = {
        method: req.method,
        route,
        status: String(res.statusCode),
      };
      this.metricsService.httpRequestsTotal.inc(labels);
      this.metricsService.httpRequestDuration.observe(labels, durationSeconds);
    });
    next();
  }
}
