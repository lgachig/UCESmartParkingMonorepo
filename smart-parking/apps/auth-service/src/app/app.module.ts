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

@Module({
  imports: [PrismaModule, AppRedisModule, AuditModule, AuthModule, ThrottlerModule.forRoot([{ttl: 60000,limit: 10,},]),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        PORT: Joi.number().default(3000),
        JWT_SECRET:Joi.string().required(),
        JWT_REFRESH_SECRET:Joi.string().required(),
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),}),}),],
  controllers: [AppController],
  providers: [AppService, {
    provide: APP_GUARD,
    useClass: ThrottlerGuard,
  },],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
