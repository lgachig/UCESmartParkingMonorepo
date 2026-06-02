import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AppRedisService } from '../redis/redis.service';

describe('UsersService', () => {
  let service: UsersService;

  const prismaMock = {
    userProfile: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const auditMock = { log: jest.fn() };
  const redisMock = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: AuditService, useValue: auditMock },
        { provide: AppRedisService, useValue: redisMock },
      ],
    }).compile();

    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  it('should throw when profile is not found', async () => {
    redisMock.get.mockResolvedValue(null);
    prismaMock.userProfile.findFirst.mockResolvedValue(null);

    await expect(service.findById('missing-id')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('should audit profile creation', async () => {
    const profile = {
      id: 'profile-id',
      authUserId: 'auth-id',
      firstName: 'Luis',
    };
    prismaMock.userProfile.create.mockResolvedValue(profile);

    const result = await service.create({
      authUserId: 'auth-id',
      firstName: 'Luis',
    });

    expect(result).toEqual(profile);
    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_CREATED', profileId: 'profile-id' }),
    );
  });

  it('should audit profile update for me', async () => {
    redisMock.get.mockResolvedValue(null);
    prismaMock.userProfile.findFirst.mockResolvedValue({
      id: 'profile-id',
      authUserId: 'auth-id',
    });
    prismaMock.userProfile.update.mockResolvedValue({
      id: 'profile-id',
      firstName: 'Updated',
    });

    await service.updateMe('auth-id', { firstName: 'Updated' });

    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'PROFILE_UPDATED' }),
    );
  });
});
