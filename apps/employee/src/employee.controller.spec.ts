import { Test, TestingModule } from '@nestjs/testing';

import { AUTH_SERVICE, JwtTcpGuard, MessagePatterns, RolesGuard } from '@app/common';

import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';

describe('EmployeeController', () => {
  let employeeController: EmployeeController;

  const employeeServiceMock: Partial<EmployeeService> = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
  };
  const jwtGuardMock = { canActivate: jest.fn().mockResolvedValue(true) };
  const rolesGuardMock = { canActivate: jest.fn().mockResolvedValue(true) };
  const authClientMock = { send: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeController],
      providers: [
        { provide: EmployeeService, useValue: employeeServiceMock },
        { provide: JwtTcpGuard, useValue: jwtGuardMock },
        { provide: RolesGuard, useValue: rolesGuardMock },
        { provide: AUTH_SERVICE, useValue: authClientMock },
      ],
    }).compile();

    employeeController = app.get<EmployeeController>(EmployeeController);
  });

  it('should be defined', () => {
    expect(employeeController).toBeDefined();
  });

  it('should expose the EMPLOYEE.GET_BY_ID pattern', () => {
    expect(MessagePatterns.EMPLOYEE.GET_BY_ID).toBe('EMPLOYEE.GET_BY_ID');
  });
});
