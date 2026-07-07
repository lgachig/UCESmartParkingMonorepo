import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as Joi from 'joi';
import { AuditModule } from './audit/audit.module';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RequestLoggerMiddleware } from './middlewares/request-logger.middleware';
import { MetricsMiddleware } from './middlewares/metrics.middleware';
import { AppRedisModule } from './redis/redis.module';
import { KafkaConsumerModule } from './kafka/kafka-consumer.module';

@Module({
  imports: [
    AuditModule,
    KafkaConsumerModule,
    HealthModule,
    MetricsModule,
    AppRedisModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        AUDIT_SERVICE_PORT: Joi.number().default(3012),
        AUDIT_DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        INTERNAL_SERVICE_KEY: Joi.string().required(),
        CORS_ORIGINS: Joi.string().optional(),
        KAFKA_BROKERS: Joi.string().default('kafka:29092'),
        JWT_SECRET: Joi.string().required(),
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
