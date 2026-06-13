import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface ReservationAuditLogEntry {
  action: string;
  authUserId?: string;
  reservationId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: ReservationAuditLogEntry) {
    return this.prisma.auditLog.create({
      data: {
        action: data.action,
        authUserId: data.authUserId,
        reservationId: data.reservationId,
        metadata: data.metadata ?? {},
      },
    });
  }
}