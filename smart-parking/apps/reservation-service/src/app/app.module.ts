import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as Joi from 'joi';
import { ScheduleModule } from '@nestjs/schedule';
import { ReservationModule } from './reservation/reservation.module';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RequestLoggerMiddleware } from './middlewares/request-logger.middleware';
import { MetricsMiddleware } from './middlewares/metrics.middleware';
import { AuditModule } from './audit/audit.module';
import { AppRedisModule } from './redis/redis.module';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ReservationModule,
    HealthModule,
    MetricsModule,
    AuditModule,
    AppRedisModule,
    KafkaModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        RESERVATION_SERVICE_PORT: Joi.number().default(3005),
        RESERVATION_DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        KAFKA_BROKERS: Joi.string().default('kafka:29092'),
        INTERNAL_SERVICE_KEY: Joi.string().required(),
        CORS_ORIGINS: Joi.string().optional(),
        PARKING_SERVICE_URL: Joi.string().required(),
        USER_SERVICE_URL: Joi.string().optional(),
        VEHICLE_SERVICE_URL: Joi.string().optional(),
        RESERVATION_EXPIRY_MINUTES: Joi.number().default(15),
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