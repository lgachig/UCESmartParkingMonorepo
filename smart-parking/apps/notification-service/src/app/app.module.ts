import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { KafkaModule } from './kafka/kafka.module';

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
        SMTP_HOST: Joi.string().required(),
        SMTP_PORT: Joi.number().required(),
        SMTP_USER: Joi.string().required(),
        SMTP_PASS: Joi.string().required(),
        SMTP_FROM: Joi.string().required(),
      }),
    }),
    KafkaModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }