import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as Joi from 'joi';
import { AiModule } from './ai/ai.module';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RequestLoggerMiddleware } from './middlewares/request-logger.middleware';
import { MetricsMiddleware } from './middlewares/metrics.middleware';

@Module({
  imports: [
    AiModule,
    HealthModule,
    MetricsModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        AI_SERVICE_PORT: Joi.number().default(3013),
        CORS_ORIGINS: Joi.string().optional(),
        JWT_SECRET: Joi.string().required(),
        AI_PROVIDER_API_KEY: Joi.string().required(),
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