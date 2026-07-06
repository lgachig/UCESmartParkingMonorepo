import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { AppRedisModule } from '../redis/redis.module';
import { RabbitmqModule } from '../rabbitmq/rabbitmq.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
    imports: [TerminusModule, AppRedisModule, RabbitmqModule, KafkaModule],
    controllers: [HealthController],
})
export class HealthModule { }
