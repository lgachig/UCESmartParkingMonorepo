import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
    changePassword: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get(AuthController);
    jest.clearAllMocks();
  });

  it('should delegate login to AuthService', async () => {
    authServiceMock.login.mockResolvedValue({ accessToken: 'token' });

    const result = await controller.login({
      email: 'test@test.com',
      password: 'Password1!',
    });

    expect(authServiceMock.login).toHaveBeenCalled();
    expect(result).toEqual({ accessToken: 'token' });
  });
});
