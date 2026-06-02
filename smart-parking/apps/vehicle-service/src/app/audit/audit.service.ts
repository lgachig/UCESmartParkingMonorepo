import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import type { VehicleAuditLogEntry } from '../interfaces/audit-log.interface';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) { }

  async log(data: VehicleAuditLogEntry) {
    return this.prisma.auditLog.create({ data });
  }
}
