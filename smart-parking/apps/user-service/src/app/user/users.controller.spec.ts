import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ServiceKeyGuard } from '../auth/guards/service-key.guard';

describe('UsersController', () => {
  let controller: UsersController;
  const usersServiceMock = {
    findMe: jest.fn(),
    updateMe: jest.fn(),
    findAll: jest.fn(),
    search: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(ServiceKeyGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(UsersController);
    jest.clearAllMocks();
  });

  it('should return authenticated profile from /me', async () => {
    usersServiceMock.findMe.mockResolvedValue({ firstName: 'Luis' });

    const result = await controller.findMe({
      user: { userId: 'auth-id' },
    });

    expect(usersServiceMock.findMe).toHaveBeenCalledWith('auth-id');
    expect(result).toEqual({ firstName: 'Luis' });
  });
});
