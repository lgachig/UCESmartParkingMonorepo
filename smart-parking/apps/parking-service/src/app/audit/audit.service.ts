import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/parking-client/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

type TxClient = Prisma.TransactionClient;

export interface ParkingAuditLogEntry {
  action: string;
  authUserId?: string;
  slotId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: ParkingAuditLogEntry, tx?: TxClient) {
    const client = tx ?? this.prisma;
    return client.auditLog.create({
      data: {
        action: data.action,
        authUserId: data.authUserId,
        slotId: data.slotId,
        metadata: data.metadata ?? {},
      },
    });
  }
}
