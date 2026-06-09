import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { FacultiesService } from './faculties.service';
import { FacultiesController } from './faculties.controller';
import { ZonesService } from './zones.service';
import { ZonesController } from './zones.controller';
import { SlotsService } from './slots.service';
import { SlotsController } from './slots.controller';
import { StatisticsController } from './statistics.controller';
import { InternalSlotsController } from './internal-slots.controller';
import { AppRedisModule } from '../redis/redis.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    PrismaModule,
    AppRedisModule,
    AuthModule,
  ],
  controllers: [
    FacultiesController,
    ZonesController,
    SlotsController,
    StatisticsController,
    InternalSlotsController,
  ],
  providers: [
    FacultiesService,
    ZonesService,
    SlotsService,
  ],
  exports: [
    FacultiesService,
    ZonesService,
    SlotsService,
  ],
})
export class ParkingModule {}
