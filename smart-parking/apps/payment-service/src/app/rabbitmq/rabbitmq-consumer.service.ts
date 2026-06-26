import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { PaymentsService } from '../payment/payments.service';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';

const EXCHANGE = 'smart-parking';
const CHECKOUT_ROUTING_KEY = 'reservation.checkout';
const QUEUE = 'payment-service.checkout';
const DLQ = 'payment-service.checkout.dlq';
const DLX = 'smart-parking.dlx';
const RETRY_QUEUE = 'payment-service.checkout.retry';
const PAYMENT_COMPLETED_KEY = 'payment.completed';
const PAYMENT_FAILED_KEY = 'payment.failed';
const MAX_RETRIES = 3;

interface CheckoutEventPayload {
  reservationId: string;
  userId?: string;
}

@Injectable()
export class RabbitmqConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqConsumerService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isShuttingDown = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    await this.disconnect();
  }

  private get url(): string {
    return (
      this.configService.get<string>('RABBITMQ_URL') ||
      'amqp://guest:guest@rabbitmq:5672'
    );
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
      await this.channel.bindQueue(QUEUE, EXCHANGE, CHECKOUT_ROUTING_KEY);

      await this.channel.assertQueue(RETRY_QUEUE, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': EXCHANGE,
          'x-dead-letter-routing-key': CHECKOUT_ROUTING_KEY,
        },
      });

      this.logger.log('RabbitMQ consumer connected — DLQ ready');

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
        let payload: CheckoutEventPayload;

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

        const retryCount: number =
          (msg.properties.headers?.['x-retry-count'] as number) ?? 0;

        try {
          await this.handleCheckoutEvent(payload);
          this.channel?.ack(msg);
        } catch (err) {
          const error = err as Error;
          this.logger.error(
            `Error processing checkout (attempt ${retryCount + 1}/${MAX_RETRIES}) ` +
            `for reservation ${payload.reservationId}: ${error.message}`,
            {
              retryCount,
              reservationId: payload.reservationId,
              originalMessage: raw,
              stack: error.stack,
            },
          );

          if (retryCount < MAX_RETRIES) {
            // Exponential backoff: 5s, 25s, 125s
            const delayMs = Math.pow(5, retryCount + 1) * 1000;
            this.scheduleRetry(raw, retryCount + 1, delayMs, msg.properties);
            this.channel?.ack(msg); // ack original — retry queue takes over
          } else {
            this.logger.error(
              `Max retries (${MAX_RETRIES}) exceeded for reservation ` +
              `${payload.reservationId} — sending to DLQ`,
              { originalMessage: raw },
            );
            this.channel?.nack(msg, false, false); // → DLQ
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

    this.logger.warn(
      `Scheduling retry ${retryCount}/${MAX_RETRIES} in ${delayMs}ms`,
    );

    this.channel.sendToQueue(
      RETRY_QUEUE,
      Buffer.from(raw),
      {
        persistent: true,
        expiration: String(delayMs),
        headers: {
          ...originalProperties.headers,
          'x-retry-count': retryCount,
        },
      },
    );
  }

  private async handleCheckoutEvent(
    payload: CheckoutEventPayload,
  ): Promise<void> {
    const { reservationId } = payload;
    this.logger.log(`Processing checkout event for reservation ${reservationId}`);

    const existing = await this.prisma.payment.findFirst({
      where: {
        reservationId,
        status: { in: ['PENDING', 'COMPLETED'] },
      },
    });

    if (existing) {
      this.logger.warn(
        `Payment already exists for reservation ${reservationId} ` +
        `(id: ${existing.id}, status: ${existing.status}). Skipping.`,
      );
      return;
    }

    let paymentResult: Awaited<ReturnType<PaymentsService['createFromReservation']>>;

    try {
      paymentResult = await this.paymentsService.createFromReservation(reservationId);
    } catch (err) {
      this.logger.error(
        `Failed to create payment record for reservation ${reservationId}`,
        err,
      );
      await this.publishEvent(PAYMENT_FAILED_KEY, {
        reservationId,
        reason: (err as Error).message,
      });
      throw err;
    }

    const payment = paymentResult;

    if (payment.fee.amount === 0) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' },
      });

      await this.audit.log({
        action: 'PAYMENT_COMPLETED_FREE',
        authUserId: payment.userId,
        metadata: { paymentId: payment.id, reservationId, amount: 0 },
      });

      await this.publishEvent(PAYMENT_COMPLETED_KEY, {
        paymentId: payment.id,
        reservationId,
        userId: payment.userId,
        amount: 0,
        currency: payment.currency,
        free: true,
      });

      this.logger.log(`Free payment completed for reservation ${reservationId}`);
      return;
    }

    let sessionResult: Awaited<ReturnType<StripeService['createCheckoutSession']>>;

    try {
      sessionResult = await this.stripeService.createCheckoutSession({
        paymentId: payment.id,
        reservationId,
        amount: payment.fee.amount,
        currency: payment.currency,
        userId: payment.userId,
      });
    } catch (err) {
      this.logger.error(
        `Failed to create Stripe session for payment ${payment.id}`,
        err,
      );
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
      await this.publishEvent(PAYMENT_FAILED_KEY, {
        paymentId: payment.id,
        reservationId,
        reason: (err as Error).message,
      });
      throw err;
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { stripeSessionId: sessionResult.sessionId },
    });

    await this.audit.log({
      action: 'STRIPE_SESSION_CREATED',
      authUserId: payment.userId,
      metadata: {
        paymentId: payment.id,
        reservationId,
        stripeSessionId: sessionResult.sessionId,
        checkoutUrl: sessionResult.url,
      },
    });

    await this.publishEvent('payment.awaiting_stripe', {
      paymentId: payment.id,
      reservationId,
      userId: payment.userId,
      amount: payment.fee.amount,
      currency: payment.currency,
      stripeSessionId: sessionResult.sessionId,
      stripeCheckoutUrl: sessionResult.url,
    });

    this.logger.log(
      `Stripe Checkout Session created for payment ${payment.id}: ${sessionResult.url}`,
    );
  }

  private async publishEvent(routingKey: string, data: unknown): Promise<void> {
    if (!this.channel) {
      this.logger.error(
        `Cannot publish ${routingKey}: RabbitMQ channel not available`,
      );
      return;
    }
    const content = Buffer.from(JSON.stringify(data));
    this.channel.publish(EXCHANGE, routingKey, content, { persistent: true });
    this.logger.log(`Published event: ${routingKey}`);
  }
}