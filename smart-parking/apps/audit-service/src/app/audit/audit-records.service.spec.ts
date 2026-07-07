import { Test, TestingModule } from '@nestjs/testing';
import { AuditRecordsService } from './audit-records.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';

describe('AuditRecordsService', () => {
  let service: AuditRecordsService;

  const prismaMock = {
    auditRecord: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditRecordsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get(AuditRecordsService);
    jest.clearAllMocks();
  });

  it('builds a where clause from sourceService, action and date range filters', async () => {
    prismaMock.auditRecord.findMany.mockResolvedValue([]);
    prismaMock.auditRecord.count.mockResolvedValue(0);

    await service.findAll({
      sourceService: 'reservation-service',
      action: 'reservation.cancelled',
      from: '2026-07-01T00:00:00.000Z',
      to: '2026-07-06T00:00:00.000Z',
      page: 2,
      limit: 10,
    });

    expect(prismaMock.auditRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          sourceService: 'reservation-service',
          action: 'reservation.cancelled',
          createdAt: {
            gte: new Date('2026-07-01T00:00:00.000Z'),
            lte: new Date('2026-07-06T00:00:00.000Z'),
          },
        },
        skip: 10,
        take: 10,
      }),
    );
  });

  it('builds a where clause from the userId filter (USP-111)', async () => {
    prismaMock.auditRecord.findMany.mockResolvedValue([]);
    prismaMock.auditRecord.count.mockResolvedValue(0);

    await service.findAll({ userId: 'u-123' });

    expect(prismaMock.auditRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'u-123' } }),
    );
  });

  it('defaults to page 1 / limit 25 when no pagination is given', async () => {
    prismaMock.auditRecord.findMany.mockResolvedValue([]);
    prismaMock.auditRecord.count.mockResolvedValue(0);

    const result = await service.findAll({});

    expect(prismaMock.auditRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {}, skip: 0, take: 25 }),
    );
    expect(result).toEqual({ items: [], total: 0, page: 1, limit: 25, totalPages: 0 });
  });

  it('exposes no update/delete methods (USP-109: immutable by design)', () => {
    expect((service as any).update).toBeUndefined();
    expect((service as any).delete).toBeUndefined();
    expect((service as any).remove).toBeUndefined();
  });

});
