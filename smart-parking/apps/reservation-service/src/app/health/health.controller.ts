import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, PrismaHealthIndicator, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AppRedisService } from '../redis/redis.service';
import { KafkaService } from '../kafka/kafka.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator,
    private prismaService: PrismaService,
    private redisService: AppRedisService,
    private kafkaService: KafkaService,
  ) {}

  @Get()
  @HealthCheck()
  async check() {
    return this.health.check([
      async () => this.prismaIndicator.pingCheck('database', this.prismaService),
      async () => {
        const isUp = await this.redisService.ping();
        if (!isUp) throw new HealthCheckError('Redis is down', { redis: { status: 'down' } });
        return { redis: { status: 'up' } };
      },
      async () => {
        const isUp = await this.kafkaService.ping();
        if (!isUp) throw new HealthCheckError('Kafka is down', { kafka: { status: 'down' } });
        return { kafka: { status: 'up' } };
      },
    ]);
  }
}