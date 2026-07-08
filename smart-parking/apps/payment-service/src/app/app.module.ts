import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuditModule } from './audit/audit.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { AppRedisModule } from './redis/redis.module';
import { RabbitmqModule } from './rabbitmq/rabbitmq.module';
import { PaymentModule } from './payment/payment.module';
import { RequestLoggerMiddleware } from './middlewares/request-logger.middleware';
import { MetricsMiddleware } from './middlewares/metrics.middleware';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    PaymentModule,
    HealthModule,
    MetricsModule,
    AuditModule,
    AppRedisModule,
    RabbitmqModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PAYMENT_SERVICE_PORT: Joi.number().default(3007),
        PAYMENT_DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        RABBITMQ_URL: Joi.string().default('amqp://guest:guest@rabbitmq:5672'),
        INTERNAL_SERVICE_KEY: Joi.string().required(),
        RESERVATION_SERVICE_URL: Joi.string().required(),
        KAFKA_BROKERS: Joi.string().default('kafka:29092'),
        USER_SERVICE_URL: Joi.string().required(),
        N8N_WEBHOOK_URL: Joi.string().optional(),
        CORS_ORIGINS: Joi.string().optional(),
        STRIPE_SECRET_KEY: Joi.string().optional().allow(''),
        STRIPE_PUBLIC_KEY: Joi.string().optional().allow(''),
        STRIPE_WEBHOOK_SECRET: Joi.string().optional().allow(''),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MetricsMiddleware,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware, MetricsMiddleware).forRoutes('*');
  }
}
