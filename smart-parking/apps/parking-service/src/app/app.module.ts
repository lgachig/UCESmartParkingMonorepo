import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as Joi from 'joi';
import { ParkingModule } from './parking/parking.module';
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
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ParkingModule,
    HealthModule,
    MetricsModule,
    AuditModule,
    AppRedisModule,
    KafkaModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PARKING_SERVICE_PORT: Joi.number().default(3004),
        PARKING_DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        N8N_WEBHOOK_URL: Joi.string().optional(),
        REDIS_URL: Joi.string().required(),
        KAFKA_BROKERS: Joi.string().default('kafka:29092'),
        INTERNAL_SERVICE_KEY: Joi.string().required(),
        CORS_ORIGINS: Joi.string().optional(),
      }),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    MetricsMiddleware,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware, MetricsMiddleware)
      .forRoutes('*');
  }
}
