import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface ParkingAuditLogEntry {
  action: string;
  authUserId?: string;
  slotId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: ParkingAuditLogEntry) {
    return this.prisma.auditLog.create({
      data: {
        action: data.action,
        authUserId: data.authUserId,
        slotId: data.slotId,
        metadata: data.metadata ?? {},
      },
    });
  }
}
