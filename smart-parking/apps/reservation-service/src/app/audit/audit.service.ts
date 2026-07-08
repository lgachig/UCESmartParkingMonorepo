import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/reservation-client/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

type TxClient = Prisma.TransactionClient;

export interface ReservationAuditLogEntry {
  action: string;
  authUserId?: string;
  reservationId?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Si se pasa `tx`, la auditoría queda dentro de la misma transacción ACID
   * que el cambio de negocio (todo o nada). Si no se pasa, usa el cliente normal.
   */
  async log(data: ReservationAuditLogEntry, tx?: TxClient) {
    const client = tx ?? this.prisma;
    return client.auditLog.create({
      data: {
        action: data.action,
        authUserId: data.authUserId,
        reservationId: data.reservationId,
        metadata: data.metadata ?? {},
      },
    });
  }
}