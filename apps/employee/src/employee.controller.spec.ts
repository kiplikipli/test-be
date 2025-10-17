import { Test, TestingModule } from '@nestjs/testing';

import { AUTH_SERVICE, JwtTcpGuard, MessagePatterns, RolesGuard } from '@app/common';

import { CreateEmployeeProfileDto } from './dto/create-employee-profile.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { UpdateSelfProfileDto } from './dto/update-self-profile.dto';
import { EmployeeAdminController } from './employee-admin.controller';
import { EmployeeRpcController } from './employee-rpc.controller';
import { EmployeeSelfController } from './employee-self.controller';
import { EmployeeService } from './employee.service';
import { PhotoStorageService } from './storage/photo-storage.service';

describe('Employee module controllers', () => {
  let adminController: EmployeeAdminController;
  let selfController: EmployeeSelfController;
  let rpcController: EmployeeRpcController;

  const employeeServiceMock: jest.Mocked<EmployeeService> = {
    createProfile: jest.fn(),
    findAllProfiles: jest.fn(),
    findProfileById: jest.fn(),
    findProfileByWorkEmail: jest.fn(),
    updateProfile: jest.fn(),
    updateProfileByWorkEmail: jest.fn(),
    updateProfilePhoto: jest.fn(),
    removeProfile: jest.fn(),
  } as unknown as jest.Mocked<EmployeeService>;

  const photoStorageMock: jest.Mocked<PhotoStorageService> = {
    save: jest.fn(),
  } as unknown as jest.Mocked<PhotoStorageService>;

  const jwtGuardMock = { canActivate: jest.fn().mockResolvedValue(true) };
  const rolesGuardMock = { canActivate: jest.fn().mockResolvedValue(true) };
  const authClientMock = { send: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [EmployeeAdminController, EmployeeSelfController, EmployeeRpcController],
      providers: [
        { provide: EmployeeService, useValue: employeeServiceMock },
        { provide: PhotoStorageService, useValue: photoStorageMock },
        { provide: JwtTcpGuard, useValue: jwtGuardMock },
        { provide: RolesGuard, useValue: rolesGuardMock },
        { provide: AUTH_SERVICE, useValue: authClientMock },
      ],
    }).compile();

    adminController = moduleRef.get(EmployeeAdminController);
    selfController = moduleRef.get(EmployeeSelfController);
    rpcController = moduleRef.get(EmployeeRpcController);
  });

  it('should wire up all controllers', () => {
    expect(adminController).toBeDefined();
    expect(selfController).toBeDefined();
    expect(rpcController).toBeDefined();
  });

  it('should delegate admin profile creation to the service', async () => {
    const dto: CreateEmployeeProfileDto = {
      workEmail: 'test@example.com',
      name: 'Test User',
      phone: '555-5555',
      position: 'QA',
    };
    const expected = { id: '1', ...dto };
    employeeServiceMock.createProfile.mockResolvedValue(expected as never);

    const result = await adminController.create(dto);

    expect(employeeServiceMock.createProfile).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('should allow employees to update their own profiles', async () => {
    const dto: UpdateSelfProfileDto = { name: 'Updated' };
    const expected = { id: '1', workEmail: 'user@example.com', name: 'Updated' };
    employeeServiceMock.updateProfileByWorkEmail.mockResolvedValue(expected as never);

    const result = await selfController.updateProfile({ user: { email: 'user@example.com' } }, dto);

    expect(employeeServiceMock.updateProfileByWorkEmail).toHaveBeenCalledWith('user@example.com', dto);
    expect(result).toEqual(expected);
  });

  it('should handle photo uploads for employees', async () => {
    const expected = { id: '1', workEmail: 'user@example.com', photoUrl: 'photo-url' };
    photoStorageMock.save.mockResolvedValue('photo-url' as never);
    employeeServiceMock.updateProfilePhoto.mockResolvedValue(expected as never);

    const result = await selfController.uploadPhoto(
      { user: { email: 'user@example.com', id: 'abc' } },
      { buffer: Buffer.from('test'), originalname: 'photo.png' } as Express.Multer.File,
    );

    expect(photoStorageMock.save).toHaveBeenCalled();
    expect(employeeServiceMock.updateProfilePhoto).toHaveBeenCalledWith('user@example.com', 'photo-url');
    expect(result).toEqual(expected);
  });

  it('should expose the EMPLOYEE.GET_BY_ID pattern for RPC consumers', () => {
    expect(MessagePatterns.EMPLOYEE.GET_BY_ID).toBe('EMPLOYEE.GET_BY_ID');
    expect(typeof rpcController.getById).toBe('function');
  });

  it('should delegate admin updates to the service', async () => {
    const dto: UpdateEmployeeProfileDto = { position: 'Lead' };
    const expected = { id: '1', workEmail: 'user@example.com', position: 'Lead' };
    employeeServiceMock.updateProfile.mockResolvedValue(expected as never);

    const result = await adminController.update('1', dto);

    expect(employeeServiceMock.updateProfile).toHaveBeenCalledWith('1', dto);
    expect(result).toEqual(expected);
  });
});
