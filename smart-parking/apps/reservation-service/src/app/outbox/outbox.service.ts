import { Injectable } from '@nestjs/common';
import { Prisma } from '@generated/reservation-client/client';
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

  /**
   * Eventos cuyo envío a n8n falló (o nunca se ha intentado con éxito) y aún
   * tienen reintentos disponibles. Solo tiene sentido reintentar n8n para
   * eventos que YA se publicaron correctamente en Kafka (status PROCESSED),
   * porque los que siguen PENDING/FAILED en Kafka se reintentan en el loop
   * principal y disparan n8n de nuevo al procesarse.
   */
  async findN8nRetryBatch(limit = 50) {
    return this.prisma.outboxEvent.findMany({
      where: {
        status: 'PROCESSED',
        n8nStatus: 'FAILED',
        n8nRetryCount: { lt: 5 },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async markN8nSent(id: string) {
    return this.prisma.outboxEvent.update({
      where: { id },
      data: { n8nStatus: 'SENT', n8nSentAt: new Date(), n8nError: null },
    });
  }

  async markN8nFailed(id: string, n8nRetryCount: number, errorMessage: string) {
    return this.prisma.outboxEvent.update({
      where: { id },
      data: {
        n8nStatus: 'FAILED',
        n8nRetryCount: n8nRetryCount + 1,
        n8nError: errorMessage.slice(0, 1000),
      },
    });
  }

  async getSummary(): Promise<{
    pending: number;
    processed: number;
    failed: number;
    n8n: { sent: number; failed: number };
  }> {
    const [groups, n8nGroups] = await Promise.all([
      this.prisma.outboxEvent.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.outboxEvent.groupBy({
        by: ['n8nStatus'],
        where: { n8nStatus: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const summary = { pending: 0, processed: 0, failed: 0, n8n: { sent: 0, failed: 0 } };

    for (const group of groups) {
      if (group.status === 'PENDING') {
        summary.pending = group._count._all;
      } else if (group.status === 'PROCESSED') {
        summary.processed = group._count._all;
      } else if (group.status === 'FAILED') {
        summary.failed = group._count._all;
      }
    }

    for (const group of n8nGroups) {
      if (group.n8nStatus === 'SENT') {
        summary.n8n.sent = group._count._all;
      } else if (group.n8nStatus === 'FAILED') {
        summary.n8n.failed = group._count._all;
      }
    }

    return summary;
  }
}
