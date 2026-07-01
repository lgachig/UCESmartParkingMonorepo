import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Consumer } from 'kafkajs';
import { PaymentsService } from '../payment/payments.service';
import { StripeService } from '../stripe/stripe.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';

const TOPIC = 'reservation.checkout';

interface CheckoutEventPayload {
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
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka!: Kafka;
  private consumer!: Consumer;
  private isConnected = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {
    const brokersString =
      this.configService.get<string>('KAFKA_BROKERS') || 'kafka:29092';
    const brokers = brokersString.split(',');
    this.kafka = new Kafka({ clientId: 'payment-service-consumer', brokers });
    this.consumer = this.kafka.consumer({ groupId: 'payment-service-group' });
  }

  async onModuleInit() {
    try {
      const admin = this.kafka.admin();
      try {
        await admin.connect();
        const existing = await admin.listTopics();
        if (!existing.includes(TOPIC)) {
          await admin.createTopics({
            topics: [{ topic: TOPIC, numPartitions: 1, replicationFactor: 1 }],
            waitForLeaders: true,
          });
          this.logger.log(`Created Kafka topic: ${TOPIC}`);
        }
      } finally {
        await admin.disconnect();
      }

      await this.consumer.connect();
      this.isConnected = true;
      this.logger.log('Kafka consumer connected');

      await this.consumer.subscribe({ topic: TOPIC, fromBeginning: false });

      await this.consumer.run({
        eachMessage: async ({ message }) => {
          const raw = message.value?.toString();
          if (!raw) return;

          let payload: CheckoutEventPayload;
          try {
            payload = JSON.parse(raw);
          } catch {
            this.logger.error('Invalid Kafka message format', raw);
            return;
          }

          const reservationId = payload.id;
          if (!reservationId) {
            this.logger.error('Kafka message missing reservation id', raw);
            return;
          }

          await this.handleCheckoutEvent(reservationId, payload.userId);
        },
      });

      this.logger.log(`Listening on Kafka topic: ${TOPIC}`);
    } catch (err) {
      this.logger.error('Failed to start Kafka consumer', err);
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.consumer.disconnect();
    }
  }

  private async handleCheckoutEvent(
    reservationId: string,
    userId: string,
  ): Promise<void> {
    this.logger.log(`Processing checkout event for reservation ${reservationId}`);

    const existing = await this.prisma.payment.findFirst({
      where: { reservationId, status: { in: ['PENDING', 'COMPLETED'] } },
    });
    if (existing) {
      this.logger.warn(
        `Payment already exists for reservation ${reservationId} — skipping`,
      );
      return;
    }

    let payment: Awaited<ReturnType<PaymentsService['createFromReservation']>>;
    try {
      payment = await this.paymentsService.createFromReservation(reservationId);
    } catch (err) {
      this.logger.error(
        `Failed to create payment for reservation ${reservationId}`,
        err,
      );
      return;
    }

    if (payment.fee.amount === 0) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'COMPLETED' },
      });
      await this.audit.log({
        action: 'PAYMENT_COMPLETED_FREE',
        authUserId: userId,
        metadata: { paymentId: payment.id, reservationId, amount: 0 },
      });
      this.logger.log(`Free payment completed for reservation ${reservationId}`);
      return;
    }

    try {
      const session = await this.stripeService.createCheckoutSession({
        paymentId: payment.id,
        reservationId,
        amount: payment.fee.amount,
        currency: payment.currency,
        userId,
      });

      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { stripeSessionId: session.sessionId },
      });

      await this.audit.log({
        action: 'STRIPE_SESSION_CREATED',
        authUserId: userId,
        metadata: {
          paymentId: payment.id,
          reservationId,
          stripeSessionId: session.sessionId,
          checkoutUrl: session.url,
        },
      });

      this.logger.log(
        `Stripe session created for payment ${payment.id}: ${session.url}`,
      );
    } catch (err) {
      this.logger.error(
        `Failed to create Stripe session for payment ${payment.id}`,
        err,
      );
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
    }
  }
}