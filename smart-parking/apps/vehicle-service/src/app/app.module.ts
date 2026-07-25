import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as Joi from 'joi';
import { VehicleModule } from './vehicle/vehicle.module';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RequestLoggerMiddleware } from './middlewares/request-logger.middleware';
import { MetricsMiddleware } from './middlewares/metrics.middleware';
import { AuditModule } from './audit/audit.module';
import { AppRedisModule } from './redis/redis.module';

@Module({
  imports: [
    VehicleModule,
    HealthModule,
    MetricsModule,
    AuditModule,
    AppRedisModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: Number(process.env.THROTTLE_LIMIT_GLOBAL || 100000) }]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        VEHICLE_SERVICE_PORT: Joi.number().default(3003),
        VEHICLE_DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        INTERNAL_SERVICE_KEY: Joi.string().required(),
        CORS_ORIGINS: Joi.string().optional(),
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
    consumer
      .apply(RequestLoggerMiddleware, MetricsMiddleware)
      .forRoutes('*');
  }
}
