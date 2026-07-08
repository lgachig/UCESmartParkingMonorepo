import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AppRedisModule } from '../redis/redis.module';
import { AuthModule } from '../auth/auth.module';
import { OutboxModule } from '../outbox/outbox.module';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { InternalReservationsController } from './internal-reservations.controller';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    AppRedisModule,
    AuthModule,
    OutboxModule,
    HttpModule.register({ timeout: 5000 }),
  ],
  controllers: [ReservationsController, InternalReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationModule {}