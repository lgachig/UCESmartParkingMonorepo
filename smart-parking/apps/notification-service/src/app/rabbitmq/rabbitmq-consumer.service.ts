import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { NotificationService } from '../notifications/notification.service';

const EXCHANGE = 'smart-parking';
const QUEUE = 'notification-service.payment-events';
const DLQ = 'notification-service.payment-events.dlq';
const DLX = 'smart-parking.dlx';
const RETRY_QUEUE = 'notification-service.payment-events.retry';
const PAYMENT_COMPLETED_KEY = 'payment.completed';
const PAYMENT_FAILED_KEY = 'payment.failed';
const MAX_RETRIES = 3;

@Injectable()
export class RabbitmqConsumerService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(RabbitmqConsumerService.name);
    private connection: amqp.Connection | null = null;
    private channel: amqp.Channel | null = null;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private isShuttingDown = false;

    constructor(
        private readonly configService: ConfigService,
        private readonly notificationService: NotificationService,
    ) { }

    async onModuleInit() {
        await this.connect();
    }

    async onModuleDestroy() {
        this.isShuttingDown = true;
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        await this.disconnect();
    }

    private get url(): string {
        return this.configService.get<string>('RABBITMQ_URL') || 'amqp://guest:guest@rabbitmq:5672';
    }

    async connect(): Promise<void> {
        if (this.isShuttingDown) return;
        try {
            this.connection = await amqp.connect(this.url);
            this.channel = await this.connection.createChannel();
            await this.channel.prefetch(1);

            await this.channel.assertExchange(DLX, 'direct', { durable: true });
            await this.channel.assertQueue(DLQ, { durable: true });
            await this.channel.bindQueue(DLQ, DLX, QUEUE);

            await this.channel.assertExchange(EXCHANGE, 'topic', { durable: true });

            await this.channel.assertQueue(QUEUE, {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': DLX,
                    'x-dead-letter-routing-key': QUEUE,
                },
            });
            await this.channel.bindQueue(QUEUE, EXCHANGE, PAYMENT_COMPLETED_KEY);
            await this.channel.bindQueue(QUEUE, EXCHANGE, PAYMENT_FAILED_KEY);

            await this.channel.assertQueue(RETRY_QUEUE, {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': EXCHANGE,
                    'x-dead-letter-routing-key': PAYMENT_COMPLETED_KEY,
                },
            });

            this.logger.log('RabbitMQ consumer connected — notification-service payment events');

            this.connection.on('close', () => {
                if (!this.isShuttingDown) {
                    this.logger.warn('RabbitMQ connection closed, reconnecting…');
                    this.scheduleReconnect();
                }
            });

            this.connection.on('error', (err) => {
                this.logger.error('RabbitMQ connection error', err);
            });

            await this.startConsuming();
        } catch (err) {
            this.logger.error('Failed to connect RabbitMQ consumer', err);
            this.scheduleReconnect();
        }
    }

    private scheduleReconnect() {
        if (this.reconnectTimer || this.isShuttingDown) return;
        this.reconnectTimer = setTimeout(async () => {
            this.reconnectTimer = null;
            await this.connect();
        }, 5000);
    }

    async disconnect(): Promise<void> {
        try {
            await this.channel?.close();
            await this.connection?.close();
        } catch {
            // ignore shutdown errors
        } finally {
            this.channel = null;
            this.connection = null;
        }
    }

    private async startConsuming(): Promise<void> {
        if (!this.channel) return;

        await this.channel.consume(
            QUEUE,
            async (msg) => {
                if (!msg) return;

                const raw = msg.content.toString();
                const routingKey = msg.fields.routingKey;
                let payload: any;

                try {
                    payload = JSON.parse(raw);
                } catch {
                    this.logger.error('Invalid message format — sending to DLQ', { raw });
                    this.channel?.nack(msg, false, false);
                    return;
                }

                if (!payload?.reservationId) {
                    this.logger.error('Message missing reservationId — sending to DLQ', { raw });
                    this.channel?.nack(msg, false, false);
                    return;
                }

                const retryCount: number = (msg.properties.headers?.['x-retry-count'] as number) ?? 0;

                try {
                    if (routingKey === PAYMENT_COMPLETED_KEY) {
                        await this.notificationService.handlePaymentCompleted(payload);
                    } else if (routingKey === PAYMENT_FAILED_KEY) {
                        await this.notificationService.handlePaymentFailed(payload);
                    } else {
                        this.logger.warn(`Unrecognized routing key ${routingKey}, discarding`);
                    }
                    this.channel?.ack(msg);
                } catch (err) {
                    const error = err as Error;
                    this.logger.error(
                        `Error processing ${routingKey} (attempt ${retryCount + 1}/${MAX_RETRIES}) ` +
                        `for reservation ${payload.reservationId}: ${error.message}`,
                    );

                    if (retryCount < MAX_RETRIES) {
                        const delayMs = Math.pow(5, retryCount + 1) * 1000;
                        this.scheduleRetry(raw, retryCount + 1, delayMs, msg.properties);
                        this.channel?.ack(msg);
                    } else {
                        this.logger.error(
                            `Max retries (${MAX_RETRIES}) exceeded for reservation ` +
                            `${payload.reservationId} — sending to DLQ`,
                        );
                        this.channel?.nack(msg, false, false);
                    }
                }
            },
            { noAck: false },
        );

        this.logger.log(`Listening on queue: ${QUEUE}`);
    }

    private scheduleRetry(
        raw: string,
        retryCount: number,
        delayMs: number,
        originalProperties: amqp.MessageProperties,
    ): void {
        if (!this.channel) return;
        this.logger.warn(`Scheduling retry ${retryCount}/${MAX_RETRIES} in ${delayMs}ms`);
        this.channel.sendToQueue(RETRY_QUEUE, Buffer.from(raw), {
            persistent: true,
            expiration: String(delayMs),
            headers: { ...originalProperties.headers, 'x-retry-count': retryCount },
        });
    }
}