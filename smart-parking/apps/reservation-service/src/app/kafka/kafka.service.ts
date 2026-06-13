import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Kafka, Producer } from 'kafkajs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka!: Kafka;
  private producer!: Producer;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {
    const brokersString = this.configService.get<string>('KAFKA_BROKERS') || 'kafka:29092';
    const brokers = brokersString.split(',');
    this.kafka = new Kafka({ clientId: 'reservation-service', brokers });
    this.producer = this.kafka.producer();
  }

  async onModuleInit() {
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Connected to Kafka successfully');
    } catch (err: any) {
      this.logger.error('Failed to connect to Kafka', err.stack);
    }
  }

  async onModuleDestroy() {
    if (this.isConnected) await this.producer.disconnect();
  }

  async emit(topic: string, message: any) {
    if (!this.isConnected) {
      this.logger.warn(`Kafka producer not connected. Cannot send to ${topic}`);
      return;
    }
    try {
      await this.producer.send({
        topic,
        messages: [{ value: JSON.stringify(message) }],
      });
      this.logger.log(`Published Kafka event to topic: ${topic}`);
    } catch (err) {
      this.logger.error(`Error emitting to topic ${topic}`, err);
    }
  }

  async ping(): Promise<boolean> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();
      await admin.listTopics();
      await admin.disconnect();
      return true;
    } catch {
      return false;
    }
  }
}