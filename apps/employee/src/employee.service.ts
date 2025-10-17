import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateEmployeeProfileDto } from './dto/create-employee-profile.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { UpdateSelfProfileDto } from './dto/update-self-profile.dto';
import { EmployeeProfile } from './entities/employee.entity';
import { ProfileChangeLog, ProfileDiff } from './entities/profile-change-log.entity';
import { FirebaseAdminService } from './firebase/firebase-admin.service';

@Injectable()
export class EmployeeService {
  private readonly logger = new Logger(EmployeeService.name);

  constructor(
    @InjectRepository(EmployeeProfile)
    private readonly employeeRepository: Repository<EmployeeProfile>,
    @InjectRepository(ProfileChangeLog)
    private readonly changeLogRepository: Repository<ProfileChangeLog>,
    private readonly firebaseAdminService: FirebaseAdminService,
  ) {}

  createProfile(dto: CreateEmployeeProfileDto): Promise<EmployeeProfile> {
    const entity = this.employeeRepository.create(dto);
    return this.employeeRepository.save(entity);
  }

  findAllProfiles(): Promise<EmployeeProfile[]> {
    return this.employeeRepository.find({ order: { name: 'ASC' } });
  }

  async findProfileById(id: string): Promise<EmployeeProfile> {
    const employee = await this.employeeRepository.findOne({ where: { id } });
    if (!employee) {
      throw new NotFoundException('Employee profile not found');
    }
    return employee;
  }

  async findProfileByWorkEmail(workEmail: string): Promise<EmployeeProfile | null> {
    return this.employeeRepository.findOne({ where: { workEmail } });
  }

  async updateProfile(id: string, dto: UpdateEmployeeProfileDto): Promise<EmployeeProfile> {
    const profile = await this.findProfileById(id);
    return this.applyProfileUpdate(profile, dto);
  }

  async updateProfileByWorkEmail(
    workEmail: string,
    dto: UpdateSelfProfileDto | UpdateEmployeeProfileDto,
  ): Promise<EmployeeProfile> {
    const profile = await this.employeeRepository.findOne({ where: { workEmail } });
    if (!profile) {
      throw new NotFoundException('Employee profile not found');
    }
    return this.applyProfileUpdate(profile, dto);
  }

  async updateProfilePhoto(workEmail: string, photoUrl: string): Promise<EmployeeProfile> {
    return this.updateProfileByWorkEmail(workEmail, { photoUrl });
  }

  async removeProfile(id: string): Promise<void> {
    const profile = await this.findProfileById(id);
    await this.employeeRepository.remove(profile);
  }

  private async applyProfileUpdate(
    profile: EmployeeProfile,
    dto: Partial<UpdateEmployeeProfileDto | UpdateSelfProfileDto>,
  ): Promise<EmployeeProfile> {
    const sanitizedUpdates = this.filterUndefined(dto);
    const diff = this.calculateDiff(profile, sanitizedUpdates);

    if (Object.keys(diff).length === 0) {
      return profile;
    }

    Object.assign(profile, sanitizedUpdates);
    const updatedProfile = await this.employeeRepository.save(profile);

    await this.logChange(updatedProfile, diff);
    await this.notifyFirebase(updatedProfile, diff);

    return updatedProfile;
  }

  private filterUndefined<T extends Record<string, unknown>>(values: T): Partial<T> {
    return Object.entries(values).reduce<Partial<T>>((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key as keyof T] = value as T[keyof T];
      }
      return acc;
    }, {});
  }

  private calculateDiff(
    profile: EmployeeProfile,
    updates: Partial<EmployeeProfile>,
  ): ProfileDiff {
    const diff: ProfileDiff = {};

    for (const [key, newValue] of Object.entries(updates)) {
      const currentValue = (profile as Record<string, unknown>)[key];
      if (newValue === currentValue) {
        continue;
      }

      diff[key] = {
        before: this.normalizeValue(currentValue),
        after: this.normalizeValue(newValue),
      };
    }

    return diff;
  }

  private normalizeValue(value: unknown): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    return String(value);
  }

  private async logChange(profile: EmployeeProfile, diff: ProfileDiff): Promise<void> {
    const changeLog = this.changeLogRepository.create({
      employee: profile,
      employeeId: profile.id,
      diff,
    });
    await this.changeLogRepository.save(changeLog);
  }

  private async notifyFirebase(profile: EmployeeProfile, diff: ProfileDiff): Promise<void> {
    try {
      await this.firebaseAdminService.notifyProfileUpdated(profile, diff);
    } catch (error) {
      this.logger.error('Failed to publish Firebase notification', error as Error);
    }
  }
}
