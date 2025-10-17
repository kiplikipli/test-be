import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AuthController } from '../src/auth.controller';
import { AuthService } from '../src/auth.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  const authServiceMock: Partial<AuthService> = {
    login: jest.fn().mockResolvedValue({
      accessToken: 'test-token',
      user: { id: '1', email: 'tester@example.com', roles: [], employeeId: null },
    }),
    validateToken: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/auth/login (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'tester@example.com', password: 'password' })
      .expect(201);

    expect(response.body).toEqual({
      accessToken: 'test-token',
      user: { id: '1', email: 'tester@example.com', roles: [], employeeId: null },
    });
  });
});
