import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateEmployeeProfileDto } from './dto/create-employee-profile.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { EmployeeService } from './employee.service';
import { EmployeeProfile } from './entities/employee.entity';
import { ProfileChangeLog } from './entities/profile-change-log.entity';
import { FirebaseAdminService } from './firebase/firebase-admin.service';

type RepositoryMock<T> = Partial<Record<keyof Repository<T>, jest.Mock>> & {
  [key: string]: jest.Mock;
};

describe('EmployeeService', () => {
  let service: EmployeeService;
  let employeeRepo: RepositoryMock<EmployeeProfile>;
  let changeLogRepo: RepositoryMock<ProfileChangeLog>;
  let firebaseService: FirebaseAdminService;

  beforeEach(async () => {
    employeeRepo = {
      create: jest.fn((value) => value),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    } as unknown as RepositoryMock<EmployeeProfile>;

    changeLogRepo = {
      create: jest.fn((value) => value),
      save: jest.fn(),
    } as unknown as RepositoryMock<ProfileChangeLog>;

    const moduleRef = await Test.createTestingModule({
      providers: [
        EmployeeService,
        { provide: FirebaseAdminService, useValue: { notifyProfileUpdated: jest.fn() } },
        { provide: getRepositoryToken(EmployeeProfile), useValue: employeeRepo },
        { provide: getRepositoryToken(ProfileChangeLog), useValue: changeLogRepo },
      ],
    }).compile();

    service = moduleRef.get(EmployeeService);
    employeeRepo = moduleRef.get(getRepositoryToken(EmployeeProfile));
    changeLogRepo = moduleRef.get(getRepositoryToken(ProfileChangeLog));
    firebaseService = moduleRef.get(FirebaseAdminService);
  });

  describe('createProfile', () => {
    it('should create and save a profile', async () => {
      const dto: CreateEmployeeProfileDto = {
        workEmail: 'worker@example.com',
        name: 'Worker',
        phone: '123',
        position: 'Engineer',
      };
      const savedProfile = { ...dto, id: '1' } as EmployeeProfile;
      employeeRepo.save.mockResolvedValue(savedProfile);

      const result = await service.createProfile(dto);

      expect(employeeRepo.create).toHaveBeenCalledWith(dto);
      expect(employeeRepo.save).toHaveBeenCalled();
      expect(result).toEqual(savedProfile);
    });
  });

  describe('updateProfile', () => {
    const existingProfile: EmployeeProfile = {
      id: '1',
      workEmail: 'worker@example.com',
      name: 'Worker',
      phone: '123',
      position: 'Engineer',
      photoUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as EmployeeProfile;

    beforeEach(() => {
      employeeRepo.findOne.mockResolvedValue(existingProfile);
      employeeRepo.save.mockImplementation(async (value) => ({ ...value, updatedAt: new Date() }));
    });

    it('should persist changes, log them and notify firebase', async () => {
      const dto: UpdateEmployeeProfileDto = { name: 'Updated Worker' };

      const result = await service.updateProfile(existingProfile.id, dto);

      expect(employeeRepo.save).toHaveBeenCalledWith(expect.objectContaining({ name: 'Updated Worker' }));
      expect(changeLogRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          employee: expect.any(Object),
          employeeId: existingProfile.id,
          diff: expect.objectContaining({ name: expect.any(Object) }),
        }),
      );
      expect(changeLogRepo.save).toHaveBeenCalled();
      expect(firebaseService.notifyProfileUpdated).toHaveBeenCalled();
      expect(result.name).toBe('Updated Worker');
    });

    it('should ignore updates that do not change values', async () => {
      const result = await service.updateProfile(existingProfile.id, { name: existingProfile.name });

      expect(employeeRepo.save).not.toHaveBeenCalled();
      expect(changeLogRepo.save).not.toHaveBeenCalled();
      expect(firebaseService.notifyProfileUpdated).not.toHaveBeenCalled();
      expect(result).toBe(existingProfile);
    });
  });
});
