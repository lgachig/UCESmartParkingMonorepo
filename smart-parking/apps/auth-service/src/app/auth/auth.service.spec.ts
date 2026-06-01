import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { AuditService } from '../audit/audit.service';
import { AppRedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { UserClientService } from '../user-client/user-client.service';

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const auditMock = { log: jest.fn() };
  const redisMock = {
    blacklistToken: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
  };
  const jwtMock = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
    decode: jest.fn(),
  };
  const userClientMock = { createProfile: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
        { provide: AuditService, useValue: auditMock },
        { provide: AppRedisService, useValue: redisMock },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) =>
              key === 'JWT_SECRET' ? 'secret' : 'refresh-secret',
            ),
          },
        },
        { provide: UserClientService, useValue: userClientMock },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  it('should reject login when user is not found', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({ email: 'missing@test.com', password: 'Password1!' }),
    ).rejects.toThrow(UnauthorizedException);

    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'LOGIN_FAILED_USER_NOT_FOUND' }),
    );
  });

  it('should audit logout', async () => {
    jwtMock.decode.mockReturnValue({
      sub: 'user-id',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    const result = await service.logout('token', 'user-id', 'test@test.com');

    expect(result).toEqual({ message: 'Logout successful' });
    expect(auditMock.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'USER_LOGOUT', userId: 'user-id' }),
    );
  });
});
