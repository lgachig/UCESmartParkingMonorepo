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

@Module({
  imports: [PrismaModule, AppRedisModule, AuditModule, AuthModule, ThrottlerModule.forRoot([{ttl: 60000,limit: 10,},]),],
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
