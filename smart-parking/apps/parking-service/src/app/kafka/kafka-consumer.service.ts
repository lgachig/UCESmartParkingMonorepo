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
    this.kafka = new Kafka({
      clientId: 'parking-service-consumer',
      brokers,
    });
    this.consumer = this.kafka.consumer({ groupId: 'parking-service-group' });
  }

  async onModuleInit() {
    try {
      const topics = [
        'slot.created',
        'slot.updated',
        'slot.deleted',
        'slot.reserved',
        'slot.occupied',
        'slot.released',
        'slot.maintenance',
        'slot.enabled',
      ];

      const admin = this.kafka.admin();
      try {
        await admin.connect();
        const existingTopics = await admin.listTopics();
        const missingTopics = topics.filter((t) => !existingTopics.includes(t));
        if (missingTopics.length > 0) {
          this.logger.log(`Creating missing Kafka topics: ${missingTopics.join(', ')}`);
          await admin.createTopics({
            topics: missingTopics.map((topic) => ({
              topic,
              numPartitions: 1,
              replicationFactor: 1,
            })),
            waitForLeaders: true,
          });
        }
      } catch (adminErr) {
        this.logger.warn('Failed to pre-create Kafka topics via Admin client', adminErr);
      } finally {
        await admin.disconnect();
      }

      await this.consumer.connect();
      this.isConnected = true;
      this.logger.log('Kafka Consumer connected successfully');

      for (const topic of topics) {
        await this.consumer.subscribe({ topic, fromBeginning: false });
      }

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          this.logger.log(
            `[Consumer] Received event on topic "${topic}" [partition ${partition}]: ${message.value?.toString()}`,
          );
        },
      });
    } catch (err: any) {
      this.logger.error('Failed to start Kafka Consumer', err.stack);
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.consumer.disconnect();
    }
  }
}
