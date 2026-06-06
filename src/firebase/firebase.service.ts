import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { readFileSync } from 'fs';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private app: admin.app.App;

  onModuleInit() {
    if (admin.apps.length > 0) {
      this.app = admin.apps[0]!;
      return;
    }

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    let credential: admin.credential.Credential;

    if (serviceAccountJson) {
      const parsed = JSON.parse(serviceAccountJson);
      credential = admin.credential.cert(parsed);
      this.logger.log('Firebase initialized with inline JSON credentials');
    } else if (serviceAccountPath) {
      const fileContent = readFileSync(serviceAccountPath, 'utf-8');
      const parsed = JSON.parse(fileContent);
      credential = admin.credential.cert(parsed);
      this.logger.log(`Firebase initialized with credentials from ${serviceAccountPath}`);
    } else {
      credential = admin.credential.applicationDefault();
      this.logger.warn(
        'No FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON set. Using application default credentials.',
      );
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_PROJECT_ID;
    this.app = admin.initializeApp({ credential, projectId: projectId || undefined });
  }

  get db(): admin.firestore.Firestore {
    return this.app.firestore();
  }

  get auth(): admin.auth.Auth {
    return this.app.auth();
  }
}
