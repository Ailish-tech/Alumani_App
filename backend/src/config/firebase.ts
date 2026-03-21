import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import admin from 'firebase-admin';

dotenv.config();

let firebaseApp: admin.app.App | null = null;

/**
 * Initialize Firebase Admin SDK.
 * In development mode (NODE_ENV=development), Firebase is optional —
 * the auth middleware will use mock mode instead.
 */
export function initializeFirebase(): admin.app.App | null {
  if (firebaseApp) return firebaseApp;

  const isDev = process.env.NODE_ENV === 'development';
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (serviceAccountPath && fs.existsSync(path.resolve(serviceAccountPath))) {
    try {
      const serviceAccount = JSON.parse(
        fs.readFileSync(path.resolve(serviceAccountPath), 'utf-8')
      );
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
      });
      console.log('✅ Firebase Admin SDK initialized with service account');
      return firebaseApp;
    } catch (error) {
      console.error('❌ Failed to initialize Firebase Admin SDK:', error);
      if (!isDev) {
        throw error;
      }
    }
  }

  if (isDev) {
    console.log('⚠️  Firebase not configured — running in MOCK AUTH mode');
    return null;
  }

  throw new Error(
    'Firebase service account file not found. Set FIREBASE_SERVICE_ACCOUNT_PATH in .env'
  );
}

export function getFirebaseAdmin(): typeof admin {
  return admin;
}

export default initializeFirebase;

