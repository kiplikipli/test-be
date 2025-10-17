import { Test, TestingModule } from '@nestjs/testing';

import { MessagePatterns } from '@app/common';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let authController: AuthController;

  const authServiceMock: Partial<AuthService> = {
    login: jest.fn(),
    validateToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    authController = app.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  it('should expose the AUTH.VALIDATE pattern', () => {
    expect(MessagePatterns.AUTH.VALIDATE).toBe('AUTH.VALIDATE');
  });
});
