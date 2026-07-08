import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpstreamHealthService } from './upstream-health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly upstreamHealthService: UpstreamHealthService) { }

  @ApiOperation({ summary: 'Gateway health + upstream status (todos los microservicios)' })
  @Get()
  async check() {
    const upstreams = await this.upstreamHealthService.checkAll();
    const allUp = upstreams.every((u) => u.up);
    return {
      status: allUp ? 'ok' : 'degraded',
      gateway: 'up',
      upstreams: Object.fromEntries(upstreams.map((u) => [u.name, u.up ? 'up' : 'down'])),
    };
  }
}