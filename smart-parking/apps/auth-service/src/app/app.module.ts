import { MiddlewareConsumer, Module, NestModule, } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../infrastructure/database/prisma.module';
import { AuthModule } from './auth/auth.module';
import { RequestLoggerMiddleware } from './middlewares/request-logger.middleware';
import { ThrottlerModule, } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, } from '@nestjs/throttler';
import { AuditModule } from './audit/audit.module';
import { AppRedisModule } from './redis/redis.module';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { HealthModule } from './health/health.module';
import { UserClientModule } from './user-client/user-client.module';
import { MetricsModule } from './metrics/metrics.module';
import { MetricsMiddleware } from './middlewares/metrics.middleware';
import { KafkaModule } from './kafka/kafka.module';


@Module({
  imports: [PrismaModule, HealthModule, MetricsModule, UserClientModule, AppRedisModule, AuditModule, KafkaModule, AuthModule, ThrottlerModule.forRoot([{ ttl: 60000, limit: Number(process.env.THROTTLE_LIMIT_GLOBAL || 100000), },]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        JWT_SECRET: Joi.string().required(),
        JWT_REFRESH_SECRET: Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        USER_SERVICE_URL: Joi.string().required().default('http://localhost:3001'),
        INTERNAL_SERVICE_KEY: Joi.string().required(),
        CORS_ORIGINS: Joi.string().optional(),
        FRONTEND_URL: Joi.string().optional(),
      }),
    }),],
  controllers: [AppController],
  providers: [AppService, MetricsMiddleware, {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware, MetricsMiddleware)
      .forRoutes('*');
  }
}
