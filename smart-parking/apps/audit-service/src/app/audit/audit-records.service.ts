import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { QueryAuditRecordsDto } from './dto/query-audit-records.dto';

@Injectable()
export class AuditRecordsService {
  constructor(private readonly prisma: PrismaService) { }

  async findAll(query: QueryAuditRecordsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;

    const where = {
      ...(query.sourceService && { sourceService: query.sourceService }),
      ...(query.userId && { userId: query.userId }),
      ...(query.action && { action: query.action }),
      ...((query.from || query.to) && {
        createdAt: {
          ...(query.from && { gte: new Date(query.from) }),
          ...(query.to && { lte: new Date(query.to) }),
        },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditRecord.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    return this.prisma.auditRecord.findUnique({ where: { id } });
  }

}
