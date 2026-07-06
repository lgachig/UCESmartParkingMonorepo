import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    HealthCheckError,
} from '@nestjs/terminus';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppRedisService } from '../redis/redis.service';
import { RealtimeService } from '../realtime/realtime.service';
import { KafkaConsumerService } from '../kafka/kafka-consumer.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly redisService: AppRedisService,
        private readonly realtimeService: RealtimeService,
        private readonly kafkaConsumer: KafkaConsumerService,
    ) { }

    @ApiOperation({ summary: 'Realtime service health: WebSocket gateway + Redis' })
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
            async () => ({
                websocketGateway: {
                    status: 'up',
                    activeConnections: this.realtimeService.activeConnections,
                },
            }),
            async () => {
                if (!this.kafkaConsumer.connected) {
                    throw new HealthCheckError('Kafka consumer is down', {
                        kafka: { status: 'down' },
                    });
                }
                return { kafka: { status: 'up' } };
            },
        ]);
    }
}