import { Module } from '@nestjs/common';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AuditRecordsController } from './audit-records.controller';
import { AuditRecordsService } from './audit-records.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [AuditRecordsController],
  providers: [AuditRecordsService],
})
export class AuditModule {}
