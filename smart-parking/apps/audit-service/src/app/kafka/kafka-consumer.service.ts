import {
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Consumer, Kafka } from 'kafkajs';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { MetricsService } from '../metrics/metrics.service';

const ALL_BUSINESS_TOPICS = /^(?!__).+/;

@Injectable()
export class AuditKafkaConsumerService
    implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(AuditKafkaConsumerService.name);
    private kafka!: Kafka;
    private consumer!: Consumer;
    private isConnected = false;

    constructor(
        private readonly configService: ConfigService,
        private readonly prisma: PrismaService,
        private readonly metrics: MetricsService,
    ) {
        const brokersString =
            this.configService.get<string>('KAFKA_BROKERS') || 'kafka:29092';

        this.kafka = new Kafka({
            clientId: 'audit-service-consumer',
            brokers: brokersString.split(','),
        });

        this.consumer = this.kafka.consumer({ groupId: 'audit-service-group' });
    }

    async onModuleInit() {
        try {
            await this.consumer.connect();
            this.isConnected = true;
            this.logger.log('Kafka Consumer connected');

            await this.consumer.subscribe({
                topic: ALL_BUSINESS_TOPICS,
                fromBeginning: true,
            });

            await this.consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    await this.persistEvent(topic, partition, message);
                },
            });

            this.logger.log(
                'Subscribed to ALL topics (regex, current + future) for immutable audit trail',
            );
        } catch (err: any) {
            this.logger.error('Failed to start Kafka Consumer', err?.stack);
        }
    }

    private async persistEvent(
        topic: string,
        partition: number,
        message: { value: Buffer | null; offset: string },
    ): Promise<void> {
        const raw = message.value?.toString() ?? '';

        let parsed: any = undefined;
        let parseError: string | undefined;
        try {
            parsed = raw ? JSON.parse(raw) : null;
        } catch (err: any) {
            parseError = err?.message ?? 'Unknown parse error';
        }

        const sourceService = this.inferSourceService(topic);
        const userId =
            parsed && typeof parsed === 'object'
                ? parsed.userId ?? parsed.authUserId ?? parsed.ownerId ?? null
                : null;

        try {
            if (parseError) {
                await this.prisma.auditRecord.create({
                    data: {
                        sourceService,
                        action: topic,
                        userId,
                        rawPayload: {
                            topic,
                            partition,
                            offset: message.offset,
                            raw,
                            parseError,
                        },
                    },
                });
                this.logger.warn(
                    `[${topic}] Unparseable message recorded raw (offset=${message.offset}): ${parseError}`,
                );
                this.metrics.eventsAuditedTotal.inc({ topic, status: 'raw' });
            } else {
                await this.prisma.auditRecord.create({
                    data: {
                        sourceService,
                        action: topic,
                        userId,
                        newValue: parsed ?? undefined,
                        rawPayload: { topic, partition, offset: message.offset },
                    },
                });
                this.logger.log(`[${topic}] Event recorded (offset=${message.offset})`);
                this.metrics.eventsAuditedTotal.inc({ topic, status: 'recorded' });
            }
        } catch (err: any) {
            this.metrics.eventsAuditedTotal.inc({ topic, status: 'failed' });
            this.logger.error(
                `[${topic}] Failed to persist event (offset=${message.offset})`,
                err?.stack,
            );
            throw err;
        }
    }

    private inferSourceService(topic: string): string {
        const [domain] = topic.split('.');
        return domain || 'unknown';
    }

    async onModuleDestroy() {
        if (this.isConnected) {
            await this.consumer.disconnect();
        }
    }
}