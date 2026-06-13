import { Controller, Get, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(private readonly configService: ConfigService) {}

  @ApiOperation({ summary: 'Gateway health + upstream status' })
  @Get()
  async check() {
    const services = {
      auth: this.configService.get<string>('AUTH_SERVICE_URL'),
      user: this.configService.get<string>('USER_SERVICE_URL'),
      vehicle: this.configService.get<string>('VEHICLE_SERVICE_URL'),
      parking: this.configService.get<string>('PARKING_SERVICE_URL'),
      reservation: this.configService.get<string>('RESERVATION_SERVICE_URL'),
    };

    const results = await Promise.allSettled(
      Object.entries(services).map(async ([name, url]) => {
        const res = await fetch(`${url}/health`).catch(() => null);
        return { name, up: res?.ok ?? false };
      }),
    );

    const upstreams = results.map((r) =>
      r.status === 'fulfilled' ? r.value : { name: 'unknown', up: false },
    );

    const allUp = upstreams.every((u) => u.up);

    return {
      status: allUp ? 'ok' : 'degraded',
      gateway: 'up',
      upstreams: Object.fromEntries(upstreams.map((u) => [u.name, u.up ? 'up' : 'down'])),
    };
  }
}
