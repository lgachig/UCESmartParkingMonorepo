import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitmqService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    await this.disconnect();
  }

  private get url(): string {
    return this.configService.get<string>('RABBITMQ_URL') || 'amqp://guest:guest@rabbitmq:5672';
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      this.logger.log('RabbitMQ connected');

      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed, scheduling reconnect');
        this.scheduleReconnect();
      });

      this.connection.on('error', (err) => {
        this.logger.error('RabbitMQ connection error', err);
      });
    } catch (err) {
      this.logger.error('Failed to connect to RabbitMQ', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
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

  getChannel(): amqp.Channel | null {
    return this.channel;
  }

  async ping(): Promise<boolean> {
    try {
      if (!this.connection || !this.channel) {
        await this.connect();
      }
      return !!this.channel;
    } catch {
      return false;
    }
  }
}
