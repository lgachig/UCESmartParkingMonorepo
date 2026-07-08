import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RabbitmqService } from '../rabbitmq/rabbitmq.service';
import { OutboxService } from './outbox.service';
import { N8nNotifierService } from '../n8n/n8n-notifier.service';

const EXCHANGE = 'smart-parking';

const EVENT_ROUTING_KEY_MAP: Record<string, string> = {
  PAYMENT_CREATED: 'payment.created',
  PAYMENT_COMPLETED: 'payment.completed',
  PAYMENT_FAILED: 'payment.failed',
};

const N8N_EVENTS = new Set(['PAYMENT_COMPLETED', 'PAYMENT_FAILED']);

@Injectable()
export class OutboxProcessorService {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private running = false;

  constructor(
    private readonly outbox: OutboxService,
    private readonly rabbitmq: RabbitmqService,
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
        const routingKey = EVENT_ROUTING_KEY_MAP[event.eventType];
        if (!routingKey) {
          await this.outbox.markFailed(
            event.id,
            event.retryCount,
            `No hay routing key mapeada para eventType=${event.eventType}`,
          );
          continue;
        }

        try {
          const channel = this.rabbitmq.getChannel();
          if (!channel) {
            throw new Error('RabbitMQ channel not available');
          }

          await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

          const content = Buffer.from(
            JSON.stringify({
              outboxEventId: event.id,
              eventType: event.eventType,
              aggregateId: event.aggregateId,
              ...(event.payload as Record<string, unknown>),
            }),
          );
          channel.publish(EXCHANGE, routingKey, content, { persistent: true });

          await this.outbox.markProcessed(event.id);

          if (N8N_EVENTS.has(event.eventType)) {
            await this.n8n.notify(
              event.eventType,
              event.aggregateId,
              event.payload as Record<string, unknown>,
            );
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
    } finally {
      this.running = false;
    }
  }
}