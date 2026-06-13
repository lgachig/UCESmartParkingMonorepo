import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Consumer } from 'kafkajs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaConsumerService.name);
  private kafka!: Kafka;
  private consumer!: Consumer;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    const brokersString = this.configService.get<string>('KAFKA_BROKERS') || 'kafka:29092';
    const brokers = brokersString.split(',');
    this.kafka = new Kafka({ clientId: 'reservation-service-consumer', brokers });
    this.consumer = this.kafka.consumer({ groupId: 'reservation-service-group' });
  }

  async onModuleInit() {
    const topics = [
      'reservation.created',
      'reservation.cancelled',
      'reservation.checkin',
      'reservation.checkout',
      'reservation.expired',
    ];

    try {
      const admin = this.kafka.admin();
      try {
        await admin.connect();
        const existing = await admin.listTopics();
        const missing = topics.filter((t) => !existing.includes(t));
        if (missing.length > 0) {
          await admin.createTopics({
            topics: missing.map((topic) => ({
              topic,
              numPartitions: 1,
              replicationFactor: 1,
            })),
            waitForLeaders: true,
          });
          this.logger.log(`Created Kafka topics: ${missing.join(', ')}`);
        }
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
        eachMessage: async ({ topic, partition, message }) => {
          this.logger.log(
            `[Consumer] topic="${topic}" partition=${partition}: ${message.value?.toString()}`,
          );
        },
      });
    } catch (err: any) {
      this.logger.error('Failed to start Kafka Consumer', err.stack);
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) await this.consumer.disconnect();
  }
}