import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import * as Joi from 'joi';
import { MongooseModule } from '@nestjs/mongoose';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RequestLoggerMiddleware } from './middlewares/request-logger.middleware';
import { MetricsMiddleware } from './middlewares/metrics.middleware';

@Module({
  imports: [
    RecommendationsModule,
    HealthModule,
    MetricsModule,
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        AI_SERVICE_PORT: Joi.number().default(3009),
        AI_DATABASE_URL: Joi.string().required(),
        CORS_ORIGINS: Joi.string().optional(),
        JWT_SECRET: Joi.string().required(),
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('AI_DATABASE_URL'),
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