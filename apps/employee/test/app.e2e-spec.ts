import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AUTH_SERVICE, JwtTcpGuard, RolesGuard } from '@app/common';

import { EmployeeController } from '../src/employee.controller';
import { EmployeeService } from '../src/employee.service';

describe('EmployeeController (e2e)', () => {
  let app: INestApplication;

  const employeeServiceMock: Partial<EmployeeService> = {
    findAll: jest.fn().mockResolvedValue([]),
    create: jest.fn(),
    findOne: jest.fn(),
  };
  const jwtGuardMock = { canActivate: jest.fn().mockResolvedValue(true) };
  const rolesGuardMock = { canActivate: jest.fn().mockResolvedValue(true) };
  const authClientMock = { send: jest.fn() };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        { provide: EmployeeService, useValue: employeeServiceMock },
        { provide: JwtTcpGuard, useValue: jwtGuardMock },
        { provide: RolesGuard, useValue: rolesGuardMock },
        { provide: AUTH_SERVICE, useValue: authClientMock },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/employees (GET)', async () => {
    await request(app.getHttpServer()).get('/employees').expect(200);
    expect(employeeServiceMock.findAll).toHaveBeenCalled();
  });
});
