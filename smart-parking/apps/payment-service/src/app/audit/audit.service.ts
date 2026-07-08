import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/payment-client/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

type TxClient = Prisma.TransactionClient;

export interface PaymentAuditLogEntry {
  action: string;
  authUserId?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: PaymentAuditLogEntry, tx?: TxClient) {
    const client = tx ?? this.prisma;
    return client.auditLog.create({
      data: {
        action: data.action,
        authUserId: data.authUserId,
        metadata: (data.metadata ?? {}) as object,
      },
    });
  }
}
