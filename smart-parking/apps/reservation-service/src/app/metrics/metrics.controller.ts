import { Controller, Get, Header } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @ApiOperation({ summary: 'Get Prometheus metrics' })
  @ApiResponse({ status: 200, description: 'Prometheus metrics string' })
  @Get()
  @Header('Content-Type', 'text/plain')
  getMetrics() {
    return this.metricsService.getMetrics();
  }
}