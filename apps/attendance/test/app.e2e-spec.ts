import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AUTH_SERVICE, AuthenticatedUser, JwtTcpGuard, Role, RolesGuard } from '@app/common';

import { AttendanceAdminController } from '../src/attendance-admin.controller';
import { AttendanceHttpController } from '../src/attendance-http.controller';
import { AttendanceRpcController } from '../src/attendance-rpc.controller';
import { AttendanceService } from '../src/attendance.service';

describe('Attendance controllers (e2e)', () => {
  let app: INestApplication;

  const createAttendanceServiceMock = () => ({
    clockIn: jest.fn(),
    clockOut: jest.fn(),
    getSummaryByEmployee: jest.fn(),
    getSummaryForAdmin: jest.fn(),
  });

  const mockUser: AuthenticatedUser = {
    id: 'user-1',
    email: 'employee@example.com',
    roles: [Role.EMPLOYEE],
    employeeId: 'employee-123',
  };

  const createJwtGuardMock = () => ({
    canActivate: jest.fn((context) => {
      const request = context.switchToHttp().getRequest();
      if (request) {
        request.user = mockUser;
      }
      return true;
    }),
  });

  const createRolesGuardMock = () => ({
    canActivate: jest.fn().mockReturnValue(true),
  });

  let attendanceServiceMock: ReturnType<typeof createAttendanceServiceMock>;
  let jwtGuardMock: ReturnType<typeof createJwtGuardMock>;
  let rolesGuardMock: ReturnType<typeof createRolesGuardMock>;

  beforeEach(async () => {
    attendanceServiceMock = createAttendanceServiceMock();
    jwtGuardMock = createJwtGuardMock();
    rolesGuardMock = createRolesGuardMock();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceHttpController, AttendanceAdminController, AttendanceRpcController],
      providers: [
        { provide: AttendanceService, useValue: attendanceServiceMock },
        { provide: JwtTcpGuard, useValue: jwtGuardMock },
        { provide: RolesGuard, useValue: rolesGuardMock },
        { provide: AUTH_SERVICE, useValue: { send: jest.fn() } },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('POST /attendance/clock-in calls service with authenticated employee', async () => {
    attendanceServiceMock.clockIn.mockResolvedValue({} as never);

    await request(app.getHttpServer()).post('/attendance/clock-in').expect(201);

    expect(attendanceServiceMock.clockIn).toHaveBeenCalledWith(mockUser.employeeId);
  });

  it('POST /attendance/clock-out calls service with authenticated employee', async () => {
    attendanceServiceMock.clockOut.mockResolvedValue({} as never);

    await request(app.getHttpServer()).post('/attendance/clock-out').expect(201);

    expect(attendanceServiceMock.clockOut).toHaveBeenCalledWith(mockUser.employeeId);
  });

  it('GET /attendance/summary fetches employee summaries for provided range', async () => {
    const summary = [{ id: 'record-1' }];
    attendanceServiceMock.getSummaryByEmployee.mockResolvedValue(summary as never);

    const response = await request(app.getHttpServer())
      .get('/attendance/summary')
      .query({ from: '2024-01-01', to: '2024-01-31' })
      .expect(200);

    expect(response.body).toEqual(expect.any(Array));
    expect(attendanceServiceMock.getSummaryByEmployee).toHaveBeenCalledWith(mockUser.employeeId, {
      from: '2024-01-01',
      to: '2024-01-31',
    });
  });

  it('GET /admin/attendance delegates to admin summary service', async () => {
    const adminSummary = [{ id: 'record-2' }];
    attendanceServiceMock.getSummaryForAdmin.mockResolvedValue(adminSummary as never);

    const response = await request(app.getHttpServer())
      .get('/admin/attendance')
      .query({ employeeId: 'employee-789', from: '2024-02-01' })
      .expect(200);

    expect(response.body).toEqual(expect.any(Array));
    expect(attendanceServiceMock.getSummaryForAdmin).toHaveBeenCalledWith({
      employeeId: 'employee-789',
      from: '2024-02-01',
    });
  });
});
