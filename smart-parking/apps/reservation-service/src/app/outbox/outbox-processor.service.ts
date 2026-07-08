import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { KafkaService } from '../kafka/kafka.service';
import { OutboxService } from './outbox.service';
import { N8nNotifierService } from '../n8n/n8n-notifier.service';

const EVENT_TOPIC_MAP: Record<string, string> = {
  RESERVATION_CREATED: 'reservation.created',
  RESERVATION_CANCELLED: 'reservation.cancelled',
  RESERVATION_CHECKIN: 'reservation.checkin',
  RESERVATION_CHECKOUT: 'reservation.checkout',
  RESERVATION_EXPIRED: 'reservation.expired',
};

const N8N_EVENTS = new Set(['RESERVATION_CREATED', 'RESERVATION_CANCELLED']);

@Injectable()
export class OutboxProcessorService {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private running = false;

  constructor(
    private readonly outbox: OutboxService,
    private readonly kafka: KafkaService,
    private readonly n8n: N8nNotifierService,
  ) { }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async processPendingEvents() {
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
          await this.kafka.emitStrict(topic, {
            outboxEventId: event.id,
            eventType: event.eventType,
            aggregateId: event.aggregateId,
            ...(event.payload as Record<string, unknown>),
          });
          await this.outbox.markProcessed(event.id);

          if (N8N_EVENTS.has(event.eventType)) {
            await this.notifyN8nAndTrack(event.id, event.eventType, event.aggregateId, event.n8nRetryCount, event.payload as Record<string, unknown>);
          }
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

      await this.retryFailedN8n();
    } finally {
      this.running = false;
    }
  }

  /**
   * Envía la notificación a n8n y registra el resultado (SENT/FAILED) en el
   * propio evento de outbox, sin afectar su status principal (que ya quedó
   * en PROCESSED porque Kafka sí tuvo éxito). Nunca relanza el error: un
   * fallo de n8n no debe hacer que el outbox marque el evento como FAILED
   * ni que se reintente publicar en Kafka de nuevo.
   */
  private async notifyN8nAndTrack(
    id: string,
    eventType: string,
    aggregateId: string,
    n8nRetryCount: number,
    payload: Record<string, unknown>,
  ) {
    try {
      await this.n8n.notify(eventType, aggregateId, payload);
      await this.outbox.markN8nSent(id);
    } catch (err: any) {
      await this.outbox.markN8nFailed(id, n8nRetryCount, err?.message ?? 'unknown error');
    }
  }

  /**
   * Reintenta la notificación a n8n para eventos que ya se publicaron bien en
   * Kafka (status=PROCESSED) pero cuya llamada a n8n falló antes. Corre en
   * cada tick del mismo cron, separado del flujo principal.
   */
  private async retryFailedN8n() {
    const pending = await this.outbox.findN8nRetryBatch(50);
    if (pending.length === 0) return;

    for (const event of pending) {
      await this.notifyN8nAndTrack(
        event.id,
        event.eventType,
        event.aggregateId,
        event.n8nRetryCount,
        event.payload as Record<string, unknown>,
      );
    }

    this.logger.log(`n8n: reintentados ${pending.length} evento(s)`);
  }
}