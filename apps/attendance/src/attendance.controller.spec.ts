import { Test, TestingModule } from '@nestjs/testing';

import { AUTH_SERVICE, JwtTcpGuard, MessagePatterns, RolesGuard } from '@app/common';

import { AttendanceAdminController } from './attendance-admin.controller';
import { AttendanceHttpController } from './attendance-http.controller';
import { AttendanceRpcController } from './attendance-rpc.controller';
import { AttendanceService } from './attendance.service';

describe('Attendance Controllers', () => {
  let httpController: AttendanceHttpController;
  let adminController: AttendanceAdminController;
  let rpcController: AttendanceRpcController;

  const attendanceServiceMock: Partial<AttendanceService> = {
    clockIn: jest.fn(),
    clockOut: jest.fn(),
    getSummaryByEmployee: jest.fn().mockResolvedValue([]),
    getSummaryForAdmin: jest.fn().mockResolvedValue([]),
  };
  const jwtGuardMock = { canActivate: jest.fn().mockResolvedValue(true) };
  const rolesGuardMock = { canActivate: jest.fn().mockResolvedValue(true) };
  const authClientMock = { send: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceHttpController, AttendanceAdminController, AttendanceRpcController],
      providers: [
        { provide: AttendanceService, useValue: attendanceServiceMock },
        { provide: JwtTcpGuard, useValue: jwtGuardMock },
        { provide: RolesGuard, useValue: rolesGuardMock },
        { provide: AUTH_SERVICE, useValue: authClientMock },
      ],
    }).compile();

    httpController = module.get<AttendanceHttpController>(AttendanceHttpController);
    adminController = module.get<AttendanceAdminController>(AttendanceAdminController);
    rpcController = module.get<AttendanceRpcController>(AttendanceRpcController);
  });

  it('should bootstrap all controllers', () => {
    expect(httpController).toBeDefined();
    expect(adminController).toBeDefined();
    expect(rpcController).toBeDefined();
  });

  it('should expose the ATTENDANCE.QUERY_BY_PERSON pattern', () => {
    expect(MessagePatterns.ATTENDANCE.QUERY_BY_PERSON).toBe('ATTENDANCE.QUERY_BY_PERSON');
  });

  it('should delegate RPC queries to the attendance service', async () => {
    const payload = { employeeId: 'emp-1', from: '2024-01-01', to: '2024-01-31' };

    await expect(rpcController.queryByPerson(payload)).resolves.toEqual([]);
    expect(attendanceServiceMock.getSummaryByEmployee).toHaveBeenCalledWith('emp-1', {
      from: '2024-01-01',
      to: '2024-01-31',
    });
  });
});
