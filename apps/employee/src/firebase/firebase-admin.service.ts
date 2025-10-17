import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { FIREBASE_FIRESTORE } from './firebase.tokens';

import { EmployeeProfile } from '../entities/employee.entity';
import { ProfileDiff } from '../entities/profile-change-log.entity';

type FirestoreLike = {
  collection(collectionPath: string): {
    add<T>(data: T): Promise<unknown>;
  };
};

@Injectable()
export class FirebaseAdminService {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private readonly collectionName: string;

  constructor(
    private readonly configService: ConfigService,
    @Optional()
    @Inject(FIREBASE_FIRESTORE)
    private readonly firestore: FirestoreLike | null,
  ) {
    this.collectionName = this.configService.get<string>('FIREBASE_NOTIFICATIONS_COLLECTION', 'employeeProfileUpdates');

    if (!this.firestore) {
      this.logger.warn('Firebase Firestore is not configured. Profile update notifications will be skipped.');
    }
  }

  async notifyProfileUpdated(profile: EmployeeProfile, diff: ProfileDiff): Promise<void> {
    if (!this.firestore) {
      return;
    }

    const changedFieldNames = Object.keys(diff);
    const profileSnapshot = {
      id: profile.id,
      workEmail: profile.workEmail ?? null,
      name: profile.name,
      phone: profile.phone ?? null,
      position: profile.position ?? null,
      photoUrl: profile.photoUrl ?? null,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };

    try {
      await this.firestore.collection(this.collectionName).add({
        type: 'employeeProfileUpdated',
        employeeId: profile.id,
        workEmail: profile.workEmail ?? null,
        name: profile.name,
        changedFields: changedFieldNames,
        diff,
        profile: profileSnapshot,
        triggeredAt: new Date(),
      });
    } catch (error) {
      this.logger.error('Failed to write notification to Firestore', error as Error);
      throw error;
    }
  }
}
