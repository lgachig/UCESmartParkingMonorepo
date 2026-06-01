import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

interface AuditLogEntry {
  action: string;
  authUserId?: string;
  profileId?: string;
  metadata?: any;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) { }

  async log(data: AuditLogEntry) {
    return this.prisma.auditLog.create({ data });
  }
}
