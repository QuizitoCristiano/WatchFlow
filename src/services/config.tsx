import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

export const isFirebaseConfigured = Boolean(
  apiKey?.trim() &&
  authDomain?.trim() &&
  projectId?.trim() &&
  storageBucket?.trim() &&
  appId?.trim(),
);

const firebaseConfig = {
  apiKey: apiKey ?? '',
  authDomain: authDomain ?? '',
  projectId: projectId ?? '',
  storageBucket: storageBucket ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: appId ?? '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app: FirebaseApp | null = isFirebaseConfigured
  ? (getApps()[0] ?? initializeApp(firebaseConfig))
  : null;

let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

if (app) {
  try {
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    storageInstance = getStorage(app);
  } catch (error: unknown) {
    console.error(
      'Firebase não pôde ser inicializado. O WatchFlow permanecerá sem acesso ao backend.',
      error instanceof Error ? error.name : 'unknown',
    );
  }
}

export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;

export const analyticsPromise = app
  ? isSupported()
      .then((supported) => supported ? getAnalytics(app) : null)
      .catch(() => null)
  : Promise.resolve(null);

export default app;
