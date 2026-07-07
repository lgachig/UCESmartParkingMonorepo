import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KafkaModule } from './kafka/kafka.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NOTIFICATION_SERVICE_PORT: Joi.number().default(3011),
        KAFKA_BROKERS: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        INTERNAL_SERVICE_KEY: Joi.string().required(),
        AUTH_SERVICE_URL: Joi.string().required(),
        PARKING_SERVICE_URL: Joi.string().required(),
        EMAILJS_SERVICE_ID: Joi.string().required(),
        EMAILJS_TEMPLATE_ID: Joi.string().required(),
        EMAILJS_PUBLIC_KEY: Joi.string().required(),
        EMAILJS_PRIVATE_KEY: Joi.string().required(),
        RESERVATION_SERVICE_URL: Joi.string().required(),
        RABBITMQ_URL: Joi.string().required(),
      }),
    }),
    KafkaModule,
    RabbitmqModule,
    HealthModule,
    MetricsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }