import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { SlotEventPayload } from '../realtime/dto/slot-event.dto';
import { MetricsService } from '../metrics/metrics.service';

const SLOT_TOPICS = [
    'slot.created',
    'slot.updated',
    'slot.deleted',
    'slot.reserved',
    'slot.occupied',
    'slot.released',
    'slot.maintenance',
    'slot.enabled',
];

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(KafkaConsumerService.name);
    private kafka!: Kafka;
    private consumer!: Consumer;
    private isConnected = false;

    constructor(
        private readonly configService: ConfigService,
        private readonly realtimeGateway: RealtimeGateway,
        private readonly metrics: MetricsService,
    ) {
        const brokersString = this.configService.get<string>('KAFKA_BROKERS') || 'kafka:29092';
        this.kafka = new Kafka({
            clientId: 'realtime-service-consumer',
            brokers: brokersString.split(','),
            retry: {
                initialRetryTime: 300,
                retries: Infinity,
            },
        });
        this.consumer = this.kafka.consumer({ groupId: 'realtime-service-group' });
    }

    async onModuleInit() {
        try {
            await this.consumer.connect();
            this.isConnected = true;
            this.logger.log('Kafka Consumer connected');

            for (const topic of SLOT_TOPICS) {
                await this.consumer.subscribe({ topic, fromBeginning: false });
            }

            this.consumer.on(this.consumer.events.CRASH, ({ payload }) => {
                this.isConnected = false;
                this.logger.error(`Kafka consumer crashed (restarting=${payload.restart})`, payload.error);
            });

            this.consumer.on(this.consumer.events.CONNECT, () => {
                this.isConnected = true;
                this.logger.log('Kafka consumer (re)connected');
            });

            await this.consumer.run({
                eachMessage: async (payload: EachMessagePayload) => {
                    this.handleMessage(payload);
                },
            });
        } catch (err: any) {
            this.logger.error('Failed to start Kafka Consumer', err.stack);
        }
    }

    private handleMessage({ topic, message }: EachMessagePayload): void {
        const raw = message.value?.toString();

        if (!raw) {
            this.logger.warn(`[${topic}] Empty message discarded`);
            this.metrics.kafkaEventsProcessedTotal.inc({ topic, status: 'discarded' });
            return;
        }

        let data: any;
        try {
            data = JSON.parse(raw);
        } catch {
            this.logger.warn(`[${topic}] Discarded malformed message (invalid JSON)`);
            this.metrics.kafkaEventsProcessedTotal.inc({ topic, status: 'discarded' });
            return;
        }

        if (!data.id) {
            this.logger.warn(`[${topic}] Discarded message without slot identifier`);
            this.metrics.kafkaEventsProcessedTotal.inc({ topic, status: 'discarded' });
            return;
        }

        const eventPayload: SlotEventPayload = {
            eventType: topic,
            id: data.id,
            number: data.number,
            status: data.status,
            previousStatus: data.previousStatus,
            zoneId: data.zoneId,
            facultyId: data.facultyId,
            timestamp: data.timestamp ?? new Date().toISOString(),
            latitude: data.latitude,
            longitude: data.longitude,
        };
        try {
            this.realtimeGateway.emitSlotEvent(eventPayload);
            this.metrics.kafkaEventsProcessedTotal.inc({ topic, status: 'processed' });
        } catch (err) {
            this.logger.error(`[${topic}] Error relaying event for slot ${data.id}`, err);
            this.metrics.kafkaEventsProcessedTotal.inc({ topic, status: 'error' });
        }
    }

    get connected(): boolean {
        return this.isConnected;
    }

    async onModuleDestroy() {
        if (this.isConnected) await this.consumer.disconnect();
    }
}