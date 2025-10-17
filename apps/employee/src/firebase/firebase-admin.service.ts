import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { EmployeeProfile } from '../entities/employee.entity';
import { ProfileDiff } from '../entities/profile-change-log.entity';

@Injectable()
export class FirebaseAdminService {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private readonly serverKey?: string;

  constructor(private readonly configService: ConfigService) {
    this.serverKey = this.configService.get<string>('FIREBASE_SERVER_KEY');
    if (!this.serverKey) {
      this.logger.warn('FIREBASE_SERVER_KEY is not configured. Notifications will be skipped.');
    }
  }

  async notifyProfileUpdated(profile: EmployeeProfile, diff: ProfileDiff): Promise<void> {
    if (!this.serverKey) {
      return;
    }

    const changedFields = Object.keys(diff).join(', ') || 'profile';

    try {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${this.serverKey}`,
        },
        body: JSON.stringify({
          to: '/topics/admin-alerts',
          notification: {
            title: 'Employee profile updated',
            body: `${profile.name} updated: ${changedFields}`,
          },
          data: {
            employeeId: profile.id,
            workEmail: profile.workEmail,
            changedFields,
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Firebase responded with status ${response.status}: ${errorBody}`);
      }
    } catch (error) {
      this.logger.error('Failed to send Firebase notification', error as Error);
      throw error;
    }
  }
}
