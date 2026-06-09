import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { AppRedisModule } from '../redis/redis.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [
    TerminusModule,
    PrismaModule,
    AppRedisModule,
    KafkaModule,
  ],
  controllers: [HealthController],
})
export class HealthModule {}
