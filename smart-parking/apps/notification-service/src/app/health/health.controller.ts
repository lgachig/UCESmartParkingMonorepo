import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckError,
    HealthCheckService,
} from '@nestjs/terminus';
import { AppRedisService } from '../redis/redis.service';
import { RabbitmqConsumerService } from '../rabbitmq/rabbitmq-consumer.service';
import { KafkaConsumerService } from '../kafka/kafka-consumer.service';

@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly redisService: AppRedisService,
        private readonly rabbitmqService: RabbitmqConsumerService,
        private readonly kafkaService: KafkaConsumerService,
    ) { }

    @Get()
    @HealthCheck()
    async check() {
        return this.health.check([
            async () => {
                const isUp = await this.redisService.ping();
                if (!isUp) {
                    throw new HealthCheckError('Redis is down', { redis: { status: 'down' } });
                }
                return { redis: { status: 'up' } };
            },
            async () => {
                const isUp = this.rabbitmqService.ping();
                if (!isUp) {
                    throw new HealthCheckError('RabbitMQ is down', { rabbitmq: { status: 'down' } });
                }
                return { rabbitmq: { status: 'up' } };
            },
            async () => {
                const isUp = this.kafkaService.ping();
                if (!isUp) {
                    throw new HealthCheckError('Kafka is down', { kafka: { status: 'down' } });
                }
                return { kafka: { status: 'up' } };
            },
        ]);
    }
}