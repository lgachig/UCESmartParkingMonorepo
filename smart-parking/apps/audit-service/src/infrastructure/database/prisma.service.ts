import {
  INestApplication,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@generated/audit-client/client';

const IMMUTABLE_ERROR =
  'audit_records is insert-only (USP-109): records can never be updated or deleted, by design.';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit
{
  constructor() {
    const connectionString = process.env.AUDIT_DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        'AUDIT_DATABASE_URL is required to initialize PrismaClient',
      );
    }

    super({
      adapter: new PrismaPg({
        connectionString,
      }),
    });
  }

  async onModuleInit() {
    await this.$connect();
    this.lockAuditRecordsAgainstMutation();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }

  /**
   * Defense in depth for immutability (USP-109): even if a future code path
   * accidentally calls one of these, it fails loudly instead of silently
   * mutating an already-created audit record. This is on top of (not a
   * replacement for) the DB-level trigger created in the initial migration,
   * and on top of simply never exposing update/delete controllers.
   */
  private lockAuditRecordsAgainstMutation() {
    const blockedMethods = [
      'update',
      'updateMany',
      'delete',
      'deleteMany',
      'upsert',
    ] as const;

    for (const method of blockedMethods) {
      (this.auditRecord as unknown as Record<string, unknown>)[method] =
        () => {
          throw new Error(IMMUTABLE_ERROR);
        };
    }
  }
}
