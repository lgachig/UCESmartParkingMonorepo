import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { AppRedisModule } from './redis/redis.module';
import { RealtimeModule } from './realtime/realtime.module';
import { KafkaModule } from './kafka/kafka.module';
import { RequestLoggerMiddleware } from './middlewares/request-logger.middleware';
import { MetricsMiddleware } from './middlewares/metrics.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        REALTIME_SERVICE_PORT: Joi.number().default(3008),
        REDIS_URL: Joi.string().required(),
        KAFKA_BROKERS: Joi.string().default('kafka:29092'),
        CORS_ORIGINS: Joi.string().optional(),
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: Number(process.env.THROTTLE_LIMIT_GLOBAL || 100000) }]),
    MetricsModule,
    AppRedisModule,
    HealthModule,
    RealtimeModule,
    KafkaModule,
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
    consumer.apply(RequestLoggerMiddleware, MetricsMiddleware).forRoutes('*');
  }
}