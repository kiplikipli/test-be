import { Test, TestingModule } from '@nestjs/testing';

import { AUTH_SERVICE, JwtTcpGuard, MessagePatterns, RolesGuard } from '@app/common';

import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';

describe('AttendanceController', () => {
  let attendanceController: AttendanceController;

  const attendanceServiceMock: Partial<AttendanceService> = {
    clockIn: jest.fn(),
    clockOut: jest.fn(),
    findSummary: jest.fn(),
  };
  const jwtGuardMock = { canActivate: jest.fn().mockResolvedValue(true) };
  const rolesGuardMock = { canActivate: jest.fn().mockResolvedValue(true) };
  const authClientMock = { send: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        { provide: AttendanceService, useValue: attendanceServiceMock },
        { provide: JwtTcpGuard, useValue: jwtGuardMock },
        { provide: RolesGuard, useValue: rolesGuardMock },
        { provide: AUTH_SERVICE, useValue: authClientMock },
      ],
    }).compile();

    attendanceController = app.get<AttendanceController>(AttendanceController);
  });

  it('should be defined', () => {
    expect(attendanceController).toBeDefined();
  });

  it('should expose the ATTENDANCE.QUERY_BY_PERSON pattern', () => {
    expect(MessagePatterns.ATTENDANCE.QUERY_BY_PERSON).toBe('ATTENDANCE.QUERY_BY_PERSON');
  });
});
