import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { connectAuthEmulator, getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';

const emulatorRequested = import.meta.env.VITE_FIREBASE_USE_EMULATOR === 'true';

if (emulatorRequested && !import.meta.env.DEV) {
  throw new Error('Firebase Emulator só pode ser utilizado no ambiente local de desenvolvimento.');
}

if (emulatorRequested && import.meta.env.VITE_FIREBASE_PROJECT_ID !== 'demo-watchflow') {
  throw new Error('O modo Emulator exige VITE_FIREBASE_PROJECT_ID=demo-watchflow.');
}

const useEmulator = emulatorRequested && import.meta.env.DEV;
const isWatchflowUtpEnv = import.meta.env.VITE_FIREBASE_PROJECT_ID === 'watchflow-utp';

const firebaseConfig = useEmulator
  ? {
      apiKey: 'demo-key',
      authDomain: 'demo-watchflow.firebaseapp.com',
      projectId: 'demo-watchflow',
      storageBucket: 'demo-watchflow.appspot.com',
      messagingSenderId: '000000000000',
      appId: '1:000000000000:web:000000000000000000000000',
    }
  : {
      apiKey: (isWatchflowUtpEnv && import.meta.env.VITE_FIREBASE_API_KEY) || 'AIzaSyDSy1sXCnXjvuF0fc7k4vhyfszobLS2FEU',
      authDomain: (isWatchflowUtpEnv && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || 'watchflow-utp.firebaseapp.com',
      projectId: 'watchflow-utp',
      storageBucket: (isWatchflowUtpEnv && import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || 'watchflow-utp.firebasestorage.app',
      messagingSenderId: (isWatchflowUtpEnv && import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || '710043004877',
      appId: (isWatchflowUtpEnv && import.meta.env.VITE_FIREBASE_APP_ID) || '1:710043004877:web:02180478180ee533fdde84',
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    };

export const isFirebaseConfigured = true;

const app: FirebaseApp | null = getApps()[0] ?? initializeApp(firebaseConfig);

let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

if (app) {
  try {
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);

    if (useEmulator) {
      connectAuthEmulator(authInstance, 'http://127.0.0.1:9099', { disableWarnings: true });
      connectFirestoreEmulator(dbInstance, '127.0.0.1', 8080);
      // Storage is intentionally disabled in the telemetry demo to prevent external writes.
      storageInstance = null;
    } else {
      storageInstance = getStorage(app);
    }
  } catch (error: unknown) {
    if (useEmulator) {
      throw error;
    }

    console.error(
      'Firebase não pôde ser inicializado. O WatchFlow permanecerá sem acesso ao backend.',
      error instanceof Error ? error.name : 'unknown',
    );
  }
}

export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;

export const analyticsPromise = app && !useEmulator
  ? isSupported()
      .then((supported) => supported ? getAnalytics(app) : null)
      .catch(() => null)
  : Promise.resolve(null);

export default app;
