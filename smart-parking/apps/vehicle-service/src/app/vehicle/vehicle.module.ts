import { Module } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuditModule, AuthModule],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehicleModule {}
