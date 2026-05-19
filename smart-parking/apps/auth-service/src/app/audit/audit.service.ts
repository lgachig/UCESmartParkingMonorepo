import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

interface AuditLogEntry {
  action: string;
  userId?: string;
  email?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: any;
}

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async log(data: AuditLogEntry) {
    return this.prisma.auditLog.create({
      data,
    });
  }
}