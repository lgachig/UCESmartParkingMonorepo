import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { KafkaService } from '../kafka/kafka.service';
import { AppRedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { OutboxService } from '../outbox/outbox.service';

describe('ReservationsService', () => {
  let service: ReservationsService;

  const prismaMock = {
    reservation: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    auditLog: { create: jest.fn() },
  };
  const auditMock = { log: jest.fn() };
  const kafkaMock = { emit: jest.fn() };
  const outboxMock = {

    createEvent: jest.fn(),

    markAsProcessed: jest.fn(),

    markAsFailed: jest.fn(),

  };
  const redisMock = {
    acquireLock: jest.fn(),
    releaseLock: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  };
  const configMock = {
    get: jest.fn((key: string) => {
      const map: Record<string, any> = {
        PARKING_SERVICE_URL: 'http://parking:3004',
        INTERNAL_SERVICE_KEY: 'secret',
        RESERVATION_EXPIRY_MINUTES: 15,
      };
      return map[key];
    }),
  };
  const httpMock = { get: jest.fn(), patch: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
        { provide: KafkaService, useValue: kafkaMock },
        { provide: OutboxService, useValue: outboxMock },
        { provide: AppRedisService, useValue: redisMock }, ,
        { provide: ConfigService, useValue: configMock },
        { provide: HttpService, useValue: httpMock },
      ],
    }).compile();
    service = module.get(ReservationsService);
    jest.clearAllMocks();
  });

  it('should throw ConflictException when user already has active reservation', async () => {
    prismaMock.reservation.findFirst.mockResolvedValue({ id: 'existing', status: 'PENDING' });
    await expect(
      service.create('user-id', { slotId: 'slot-id', vehicleId: 'vehicle-id' }),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw ConflictException when Redis lock cannot be acquired', async () => {
    prismaMock.reservation.findFirst.mockResolvedValue(null);
    redisMock.acquireLock.mockResolvedValue(false);
    await expect(
      service.create('user-id', { slotId: 'slot-id', vehicleId: 'vehicle-id' }),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw NotFoundException when reservation not found', async () => {
    prismaMock.reservation.findUnique.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toThrow(NotFoundException);
  });

  it('should throw BadRequestException when cancelling a completed reservation', async () => {
    prismaMock.reservation.findUnique.mockResolvedValue({ id: 'r1', userId: 'u1', status: 'COMPLETED', slotId: 's1' });
    await expect(service.cancel('r1', 'u1')).rejects.toThrow(BadRequestException);
  });

  it('should emit reservation.created Kafka event on successful creation', async () => {
    prismaMock.reservation.findFirst.mockResolvedValue(null);
    redisMock.acquireLock.mockResolvedValue(true);
    const { of } = await import('rxjs');
    httpMock.get.mockReturnValue(of({ data: { data: true } }));
    httpMock.patch.mockReturnValue(of({ data: {} }));
    prismaMock.reservation.create.mockResolvedValue({
      id: 'r1', reservationCode: 'ABC123', status: 'PENDING',
      expiresAt: new Date(), slotId: 'slot-id', vehicleId: 'vehicle-id',
    });
    await service.create('user-id', { slotId: 'slot-id', vehicleId: 'vehicle-id' });
    expect(kafkaMock.emit).toHaveBeenCalledWith('reservation.created', expect.any(Object));
  });
});