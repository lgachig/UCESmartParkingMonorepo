import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckError,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AppRedisService } from '../redis/redis.service';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator,
    private prismaService: PrismaService,
    private redisService: AppRedisService,
    private rabbitmqService: RabbitmqService,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return this.health.check([
      async () =>
        this.prismaIndicator.pingCheck('database', this.prismaService),
      async () => {
        const isUp = await this.redisService.ping();
        if (!isUp) {
          throw new HealthCheckError('Redis is down', { redis: { status: 'down' } });
        }
        return { redis: { status: 'up' } };
      },
      async () => {
        const isUp = await this.rabbitmqService.ping();
        if (!isUp) {
          throw new HealthCheckError('RabbitMQ is down', {
            rabbitmq: { status: 'down' },
          });
        }
        return { rabbitmq: { status: 'up' } };
      },
    ]);
  }
}
