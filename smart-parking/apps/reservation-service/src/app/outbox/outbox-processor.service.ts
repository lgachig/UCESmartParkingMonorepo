import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KafkaService } from '../kafka/kafka.service';
import { OutboxService } from './outbox.service';

const EVENT_TOPIC_MAP: Record<string, string> = {
  RESERVATION_CREATED: 'reservation.created',
  RESERVATION_CANCELLED: 'reservation.cancelled',
  RESERVATION_CHECKIN: 'reservation.checkin',
  RESERVATION_CHECKOUT: 'reservation.checkout',
  RESERVATION_EXPIRED: 'reservation.expired',
};

@Injectable()
export class OutboxProcessorService {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private running = false;

  constructor(
    private readonly outbox: OutboxService,
    private readonly kafka: KafkaService,
  ) {}

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processPendingEvents() {
    // Evita solapamiento si un ciclo anterior sigue corriendo
    if (this.running) return;
    this.running = true;

    try {
      const events = await this.outbox.findPendingBatch(50);
      if (events.length === 0) return;

      for (const event of events) {
        const topic = EVENT_TOPIC_MAP[event.eventType];
        if (!topic) {
          await this.outbox.markFailed(
            event.id,
            event.retryCount,
            `No hay topic mapeado para eventType=${event.eventType}`,
          );
          continue;
        }

        try {
          // idempotencia: el consumidor debe deduplicar por payload.id + eventType,
          // aquí incluimos siempre el outboxEventId para que el consumer lo use como clave.
          await this.kafka.emitStrict(topic, {
            outboxEventId: event.id,
            eventType: event.eventType,
            aggregateId: event.aggregateId,
            ...(event.payload as Record<string, unknown>),
          });
          await this.outbox.markProcessed(event.id);
        } catch (err: any) {
          this.logger.error(
            `Error publicando outbox event ${event.id} (${event.eventType})`,
            err?.stack,
          );
          await this.outbox.markFailed(
            event.id,
            event.retryCount,
            err?.message ?? 'unknown error',
          );
        }
      }

      this.logger.log(`Outbox: procesados ${events.length} evento(s)`);
    } finally {
      this.running = false;
    }
  }
}
