import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RedisModule } from '@nestjs-modules/ioredis';
import * as Joi from 'joi';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { ProxyModule } from './proxy/proxy.module';
import { RequestLoggerMiddleware } from './middlewares/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        GATEWAY_PORT: Joi.number().default(3006),
        JWT_SECRET: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        AUTH_SERVICE_URL: Joi.string().required(),
        USER_SERVICE_URL: Joi.string().required(),
        PAYMENT_SERVICE_URL: Joi.string().required(),
        VEHICLE_SERVICE_URL: Joi.string().required(),
        PARKING_SERVICE_URL: Joi.string().required(),
        RESERVATION_SERVICE_URL: Joi.string().required(),
        CORS_ORIGINS: Joi.string().optional(),
        THROTTLE_TTL: Joi.number().default(60000),
        THROTTLE_LIMIT: Joi.number().default(200),
      }),
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'single',
        url: cfg.get<string>('REDIS_URL'),
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),
    HealthModule,
    MetricsModule,
    ProxyModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}