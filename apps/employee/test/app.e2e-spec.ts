import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { AUTH_SERVICE, JwtTcpGuard, RolesGuard } from '@app/common';

import { EmployeeAdminController } from '../src/employee-admin.controller';
import { EmployeeRpcController } from '../src/employee-rpc.controller';
import { EmployeeSelfController } from '../src/employee-self.controller';
import { EmployeeService } from '../src/employee.service';
import { PhotoStorageService } from '../src/storage/photo-storage.service';

describe('Employee controllers (e2e)', () => {
  let app: INestApplication;

  const employeeServiceMock: Partial<EmployeeService> = {
    createProfile: jest.fn().mockImplementation((dto) => ({ id: '1', ...dto })),
    findAllProfiles: jest.fn().mockResolvedValue([]),
    findProfileById: jest.fn().mockImplementation((id: string) => ({ id })),
    updateProfile: jest.fn().mockImplementation((id: string, dto) => ({ id, ...dto })),
    removeProfile: jest.fn().mockResolvedValue({ success: true }),
    findProfileByWorkEmail: jest.fn().mockImplementation((email: string) => ({ email })),
    updateProfileByWorkEmail: jest
      .fn()
      .mockImplementation((email: string, dto) => ({ email, ...dto })),
    updateProfilePhoto: jest
      .fn()
      .mockImplementation((email: string, photoUrl: string) => ({ email, photoUrl })),
  };
  const photoStorageServiceMock: Partial<PhotoStorageService> = {
    save: jest.fn().mockResolvedValue('http://example.com/photo.jpg'),
  };
  const jwtGuardMock = {
    canActivate: jest.fn().mockImplementation((context) => {
      const request = context.switchToHttp().getRequest();
      request.user = { id: 'employee-1', email: 'employee@example.com' };
      return true;
    }),
  };
  const rolesGuardMock = { canActivate: jest.fn().mockResolvedValue(true) };
  const authClientMock = { send: jest.fn() };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [
        EmployeeAdminController,
        EmployeeSelfController,
        EmployeeRpcController,
      ],
      providers: [
        { provide: EmployeeService, useValue: employeeServiceMock },
        { provide: PhotoStorageService, useValue: photoStorageServiceMock },
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
    jest.clearAllMocks();
  });

  it('/employees (GET)', async () => {
    await request(app.getHttpServer()).get('/employees').expect(200);
    expect(employeeServiceMock.findAllProfiles).toHaveBeenCalled();
  });

  it('/employees (POST)', async () => {
    const payload = { workEmail: 'employee@example.com' };
    await request(app.getHttpServer()).post('/employees').send(payload).expect(201);
    expect(employeeServiceMock.createProfile).toHaveBeenCalledWith(payload);
  });

  it('/employees/:id (GET)', async () => {
    await request(app.getHttpServer()).get('/employees/123').expect(200);
    expect(employeeServiceMock.findProfileById).toHaveBeenCalledWith('123');
  });

  it('/employees/:id (PATCH)', async () => {
    const payload = { firstName: 'John' };
    await request(app.getHttpServer()).patch('/employees/123').send(payload).expect(200);
    expect(employeeServiceMock.updateProfile).toHaveBeenCalledWith('123', payload);
  });

  it('/employees/:id (DELETE)', async () => {
    await request(app.getHttpServer()).delete('/employees/123').expect(200);
    expect(employeeServiceMock.removeProfile).toHaveBeenCalledWith('123');
  });

  it('/employees/me (GET)', async () => {
    await request(app.getHttpServer()).get('/employees/me').expect(200);
    expect(employeeServiceMock.findProfileByWorkEmail).toHaveBeenCalledWith(
      'employee@example.com',
    );
  });

  it('/employees/me (PATCH)', async () => {
    const payload = { preferredName: 'Sam' };
    await request(app.getHttpServer()).patch('/employees/me').send(payload).expect(200);
    expect(employeeServiceMock.updateProfileByWorkEmail).toHaveBeenCalledWith(
      'employee@example.com',
      payload,
    );
  });

  it('/employees/me/photo (POST)', async () => {
    const fileContent = Buffer.from('avatar');
    await request(app.getHttpServer())
      .post('/employees/me/photo')
      .attach('file', fileContent, 'avatar.png')
      .expect(201);
    expect(photoStorageServiceMock.save).toHaveBeenCalled();
    expect(employeeServiceMock.updateProfilePhoto).toHaveBeenCalledWith(
      'employee@example.com',
      'http://example.com/photo.jpg',
    );
  });
});
