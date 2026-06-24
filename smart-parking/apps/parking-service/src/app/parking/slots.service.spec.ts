import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ParkingSlotService } from './slots.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AppRedisService } from '../redis/redis.service';
import { KafkaService } from '../kafka/kafka.service';

describe('ParkingSlotService', () => {
  let service: ParkingSlotService;

  const prismaMock = {
    parkingSlot: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    faculty: { findFirst: jest.fn(), findUnique: jest.fn() },
  };
  const auditMock = { log: jest.fn() };
  const redisMock = { get: jest.fn(), set: jest.fn(), delete: jest.fn() };
  const kafkaMock = { emit: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ParkingSlotService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
        { provide: AppRedisService, useValue: redisMock },
        { provide: KafkaService, useValue: kafkaMock },
      ],
    }).compile();
    service = module.get(ParkingSlotService);
    jest.clearAllMocks();
  });

  it('should throw NotFoundException when slot does not exist', async () => {
    redisMock.get.mockResolvedValue(null);
    prismaMock.parkingSlot.findFirst.mockResolvedValue(null);
    await expect(service.findById('missing-id')).rejects.toThrow(NotFoundException);
  });

  it('should return cached slot status from Redis', async () => {
    redisMock.get.mockResolvedValue('AVAILABLE');
    const result = await service.getSlotStatus('slot-id');
    expect(result).toBe('AVAILABLE');
    expect(prismaMock.parkingSlot.findFirst).not.toHaveBeenCalled();
  });

  it('should emit Kafka event on slot creation', async () => {
    prismaMock.faculty.findFirst.mockResolvedValue({ id: 'fac-id', isActive: true });
    prismaMock.parkingSlot.findUnique.mockResolvedValue(null);
    prismaMock.parkingSlot.create.mockResolvedValue({ id: 'slot-id', facultyId: 'fac-id' });
    await service.create({ facultyId: 'fac-id', identifier: 'A-01', latitude: 0, longitude: 0 }, 'admin-id');
    expect(kafkaMock.emit).toHaveBeenCalledWith('slot.created', expect.any(Object));
  });
});