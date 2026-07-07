import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka } from 'kafkajs';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { MetricsService } from '../metrics/metrics.service';

const CHECKOUT_TOPIC = 'reservation.checkout';

interface ReservationCheckoutEvent {
    id: string;
    userId: string;
    slotId: string;
    vehicleId: string;
    checkInAt: string;
    checkOutAt: string;
    durationMinutes: number;
    timestamp: string;
}

@Injectable()
export class AiKafkaConsumerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(AiKafkaConsumerService.name);
    private kafka!: Kafka;
    private consumer!: Consumer;
    private isConnected = false;

    constructor(
        private readonly configService: ConfigService,
        private readonly recommendationsService: RecommendationsService,
        private readonly metrics: MetricsService,
    ) {
        const brokersString =
            this.configService.get<string>('KAFKA_BROKERS') || 'kafka:29092';

        this.kafka = new Kafka({
            clientId: 'ai-service-consumer',
            brokers: brokersString.split(','),
        });

        this.consumer = this.kafka.consumer({ groupId: 'ai-service-group' });
    }

    async onModuleInit() {
        try {
            await this.consumer.connect();
            this.isConnected = true;
            this.logger.log('Kafka Consumer connected');

            await this.consumer.subscribe({
                topic: CHECKOUT_TOPIC,
                fromBeginning: true,
            });

            await this.consumer.run({
                eachMessage: async ({ message }) => {
                    await this.handleCheckout(message.value);
                },
            });

            this.logger.log(`Subscribed to topic ${CHECKOUT_TOPIC}`);
        } catch (err: any) {
            this.logger.error('Failed to start Kafka Consumer', err?.stack);
        }
    }

    private async handleCheckout(raw: Buffer | null): Promise<void> {
        if (!raw) return;

        let event: ReservationCheckoutEvent;
        try {
            event = JSON.parse(raw.toString());
        } catch (err: any) {
            this.logger.error('Failed to parse reservation.checkout event', err?.stack);
            return;
        }

        try {
            await this.recommendationsService.recordUsage(event.userId, event.slotId);
            this.metrics.usageHistoryUpdatesTotal.inc({ status: 'success' });
            this.logger.log(
                `Usage history updated for user=${event.userId} slot=${event.slotId}`,
            );
        } catch (err: any) {
            this.metrics.usageHistoryUpdatesTotal.inc({ status: 'failed' });
            this.logger.error('Failed to update usage history', err?.stack);
        }
    }

    async onModuleDestroy() {
        if (this.isConnected) {
            await this.consumer.disconnect();
        }
    }
}