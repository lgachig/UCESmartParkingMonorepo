import { Injectable, OnModuleInit, OnModuleDestroy, Logger, Inject, forwardRef } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { ConfigService } from '@nestjs/config';
import { SlotsService } from '../parking/slots.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka!: Kafka;
  private consumer!: Consumer;
  private isConnected = false;

  constructor(
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => SlotsService))
    private readonly slotsService: SlotsService,
  ) {
    const brokersString = this.configService.get<string>('KAFKA_BROKERS') || 'kafka:29092';
    this.kafka = new Kafka({
      clientId: 'parking-service-consumer',
      brokers: brokersString.split(','),
    });
    this.consumer = this.kafka.consumer({ groupId: 'parking-service-group' });
  }

  async onModuleInit() {
    try {
      const topics = [
        'slot.created', 'slot.updated', 'slot.deleted',
        'slot.reserved', 'slot.occupied', 'slot.released',
        'slot.maintenance', 'slot.enabled',
        'reservation.cancelled', 'reservation.expired', 'reservation.checkout',
      ];

      const admin = this.kafka.admin();
      try {
        await admin.connect();
        const existing = await admin.listTopics();
        const missing = topics.filter((t) => !existing.includes(t));
        if (missing.length > 0) {
          await admin.createTopics({
            topics: missing.map((topic) => ({ topic, numPartitions: 1, replicationFactor: 1 })),
            waitForLeaders: true,
          });
          this.logger.log(`Created Kafka topics: ${missing.join(', ')}`);
        }
      } catch (e) {
        this.logger.warn('Kafka admin topic creation failed (non-fatal)', e);
      } finally {
        await admin.disconnect();
      }

      await this.consumer.connect();
      this.isConnected = true;
      this.logger.log('Kafka Consumer connected');

      for (const topic of topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
      }

      await this.consumer.run({
        eachMessage: async ({ topic, message }) => {
          const raw = message.value?.toString();
          if (!raw) return;
          let payload: any;
          try { payload = JSON.parse(raw); } catch { return; }
          this.logger.log(`[Consumer] topic="${topic}"`);
          try { await this.handleEvent(topic, payload); } catch (err) {
            this.logger.error(`[Consumer] Error on topic "${topic}"`, err);
          }
        },
      });
    } catch (err: any) {
      this.logger.error('Failed to start Kafka Consumer', err.stack);
    }
  }

  private async handleEvent(topic: string, payload: any): Promise<void> {
    switch (topic) {
      case 'reservation.cancelled':
      case 'reservation.expired':
      case 'reservation.checkout': {
        const slotId: string | undefined = payload.slotId;
        if (!slotId) { this.logger.warn(`[${topic}] Missing slotId`); return; }
        try {
          await this.slotsService.release(slotId, 'SYSTEM');
          this.logger.log(`[${topic}] Slot ${slotId} → AVAILABLE`);
        } catch (err: any) {
          this.logger.warn(`[${topic}] Could not release slot ${slotId}: ${err.message}`);
        }
        break;
      }
      default:
        this.logger.log(`[${topic}] No additional action needed`);
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) await this.consumer.disconnect();
  }
}