import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { AppRedisModule } from '../redis/redis.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
    imports: [TerminusModule, AppRedisModule, RealtimeModule, KafkaModule],
    controllers: [HealthController],
})

export class HealthModule { }