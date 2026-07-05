import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from '../notifications/notification.service';
import { MetricsService } from '../metrics/metrics.service';

const TOPICS = ['reservation.created', 'reservation.cancelled', 'reservation.expired', 'system.alert'];

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(KafkaConsumerService.name);
    private kafka!: Kafka;
    private consumer!: Consumer;
    private isConnected = false;

    constructor(
        private readonly configService: ConfigService,
        private readonly notificationService: NotificationService,
        private readonly metrics: MetricsService,
    ) {
        const brokersString = this.configService.get<string>('KAFKA_BROKERS') || 'kafka:29092';
        this.kafka = new Kafka({
            clientId: 'notification-service-consumer',
            brokers: brokersString.split(','),
            retry: {
                initialRetryTime: 300,
                retries: Infinity,
            },
        });
        this.consumer = this.kafka.consumer({ groupId: 'notification-service-group' });
    }

    async onModuleInit() {
        try {
            await this.consumer.connect();
            this.logger.log('Kafka Consumer connected');
            this.isConnected = true;

            for (const topic of TOPICS) {
                await this.consumer.subscribe({ topic, fromBeginning: false });
            }

            await this.consumer.run({
                eachMessage: async (payload: EachMessagePayload) => {
                    await this.handleMessage(payload);
                },
            });
        } catch (err: any) {
            this.logger.error('Failed to start Kafka Consumer', err.stack);
        }
    }

    private async handleMessage({ topic, message }: EachMessagePayload): Promise<void> {
        const raw = message.value?.toString();
        if (!raw) {
            this.logger.warn(`[${topic}] Empty message discarded`);
            return;
        }

        let data: any;
        try {
            data = JSON.parse(raw);
        } catch {
            this.logger.warn(`[${topic}] Discarded malformed message (invalid JSON)`);
            return;
        }

        if (topic === 'system.alert') {
            if (!data.service || !data.severity || !data.message) {
                this.logger.warn(`[${topic}] Discarded alert missing service/severity/message`);
                return;
            }
            await this.notificationService.handleSystemAlert(data);
            this.metrics.eventsProcessedTotal.inc({ broker: 'kafka', event: topic });
            return;
        }

        if (!data.id) {
            this.logger.warn(`[${topic}] Discarded message without reservation identifier`);
            return;
        }

        if (topic === 'reservation.created') {
            await this.notificationService.handleReservationCreated(data);
            this.metrics.eventsProcessedTotal.inc({ broker: 'kafka', event: topic });
            return;
        }

        if (topic === 'reservation.cancelled') {
            await this.notificationService.handleReservationCancelled(data);
            this.metrics.eventsProcessedTotal.inc({ broker: 'kafka', event: topic });
            return;
        }

        if (topic === 'reservation.expired') {
            await this.notificationService.handleReservationExpired(data);
            this.metrics.eventsProcessedTotal.inc({ broker: 'kafka', event: topic });
        }
    }

    async onModuleDestroy() {
        await this.consumer.disconnect();
    }

    ping(): boolean {
        return this.isConnected;
    }

}