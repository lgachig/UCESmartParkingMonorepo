import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/payment-client/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';

type TxClient = Prisma.TransactionClient;

@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Debe llamarse SIEMPRE dentro de una transacción (tx) junto con el cambio
   * de negocio, para garantizar atomicidad (cambio + evento o ninguno de los dos).
   */
  async record(
    tx: TxClient,
    eventType: string,
    aggregateId: string,
    payload: Record<string, unknown>,
  ) {
    return tx.outboxEvent.create({
      data: {
        eventType,
        aggregateId,
        payload,
      },
    });
  }

  async findPendingBatch(limit = 50) {
    return this.prisma.outboxEvent.findMany({
      where: {
        OR: [
          { status: 'PENDING' },
          { status: 'FAILED', retryCount: { lt: 5 } },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async markProcessed(id: string) {
    return this.prisma.outboxEvent.update({
      where: { id },
      data: { status: 'PROCESSED', processedAt: new Date(), errorMessage: null },
    });
  }

  async markFailed(id: string, retryCount: number, errorMessage: string) {
    return this.prisma.outboxEvent.update({
      where: { id },
      data: {
        status: 'FAILED',
        retryCount: retryCount + 1,
        errorMessage: errorMessage.slice(0, 1000),
      },
    });
  }

  async getSummary(): Promise<{ pending: number; processed: number; failed: number }> {
    const groups = await this.prisma.outboxEvent.groupBy({
      by: ['status'],
      _count: { _all: true },
    });

    const summary = { pending: 0, processed: 0, failed: 0 };

    for (const group of groups) {
      if (group.status === 'PENDING') {
        summary.pending = group._count._all;
      } else if (group.status === 'PROCESSED') {
        summary.processed = group._count._all;
      } else if (group.status === 'FAILED') {
        summary.failed = group._count._all;
      }
    }

    return summary;
  }
}
