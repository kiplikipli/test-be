import { Logger, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { FirebaseAdminService } from './firebase-admin.service';
import { FIREBASE_FIRESTORE } from './firebase.tokens';

const firestoreProvider: Provider = {
  provide: FIREBASE_FIRESTORE,
  inject: [ConfigService],
  useFactory: async (configService: ConfigService) => {
    const projectId = configService.get<string>('FIREBASE_PROJECT_ID');
    const clientEmail = configService.get<string>('FIREBASE_CLIENT_EMAIL');
    const privateKey = configService.get<string>('FIREBASE_PRIVATE_KEY');

    if (!projectId || !clientEmail || !privateKey) {
      const logger = new Logger('FirebaseModule');
      logger.warn('Firebase credentials are not fully configured. Firestore notifications will be disabled.');
      return null;
    }

    const sanitizedPrivateKey = privateKey.replace(/\\n/g, '\n');

    try {
      const appModule = await import('firebase-admin/app');
      const firestoreModule = await import('firebase-admin/firestore');

      const credential = appModule.cert({
        projectId,
        clientEmail,
        privateKey: sanitizedPrivateKey,
      });
      const appName = 'employee-service';
      const app = appModule.getApps().find((existingApp) => existingApp.name === appName)
        ? appModule.getApp(appName)
        : appModule.initializeApp({ credential }, appName);

      return firestoreModule.getFirestore(app);
    } catch (error) {
      if (error instanceof Error) {
        const logger = new Logger('FirebaseModule');

        if ('code' in error && (error as NodeJS.ErrnoException).code === 'ERR_MODULE_NOT_FOUND') {
          logger.warn('firebase-admin package is not installed. Firestore notifications will be disabled.');
          return null;
        }

        if (error.message.includes('Cannot find module')) {
          logger.warn('firebase-admin package is not installed. Firestore notifications will be disabled.');
          return null;
        }
      }

      throw error;
    }
  },
};

@Module({
  imports: [ConfigModule],
  providers: [FirebaseAdminService, firestoreProvider],
  exports: [FirebaseAdminService],
})
export class FirebaseModule {}
