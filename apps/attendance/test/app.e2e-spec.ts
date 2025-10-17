import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AUTH_SERVICE, JwtTcpGuard, RolesGuard } from '@app/common';

import { AttendanceController } from '../src/attendance.controller';
import { AttendanceService } from '../src/attendance.service';

describe('AttendanceController (e2e)', () => {
  let app: INestApplication;

  const attendanceServiceMock: Partial<AttendanceService> = {
    clockIn: jest.fn(),
    clockOut: jest.fn(),
    findSummary: jest.fn().mockResolvedValue([]),
  };
  const jwtGuardMock = { canActivate: jest.fn().mockResolvedValue(true) };
  const rolesGuardMock = { canActivate: jest.fn().mockResolvedValue(true) };
  const authClientMock = { send: jest.fn() };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AttendanceController],
      providers: [
        { provide: AttendanceService, useValue: attendanceServiceMock },
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

  it('/attendance/:employeeId (GET)', async () => {
    await request(app.getHttpServer()).get('/attendance/123').expect(200);
    expect(attendanceServiceMock.findSummary).toHaveBeenCalledWith('123');
  });
});
