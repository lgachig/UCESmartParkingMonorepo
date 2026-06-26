import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

export interface PaymentAuditLogEntry {
  action: string;
  authUserId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: PaymentAuditLogEntry) {
    return this.prisma.auditLog.create({
      data: {
        action: data.action,
        authUserId: data.authUserId,
        metadata: (data.metadata ?? {}) as object,
      },
    });
  }
}
