import { initializeApp, getApps } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import type { FirebaseStorage } from 'firebase/storage';

// Garante que o projeto ativo watchflow-utp seja sempre utilizado mesmo se a Vercel tiver variáveis antigas salvas no painel
const isWatchflowUtpEnv = import.meta.env.VITE_FIREBASE_PROJECT_ID === 'watchflow-utp';

const apiKey = (isWatchflowUtpEnv && import.meta.env.VITE_FIREBASE_API_KEY) || 'AIzaSyDSy1sXCnXjvuF0fc7k4vhyfszobLS2FEU';
const authDomain = (isWatchflowUtpEnv && import.meta.env.VITE_FIREBASE_AUTH_DOMAIN) || 'watchflow-utp.firebaseapp.com';
const projectId = 'watchflow-utp';
const storageBucket = (isWatchflowUtpEnv && import.meta.env.VITE_FIREBASE_STORAGE_BUCKET) || 'watchflow-utp.firebasestorage.app';
const messagingSenderId = (isWatchflowUtpEnv && import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID) || '710043004877';
const appId = (isWatchflowUtpEnv && import.meta.env.VITE_FIREBASE_APP_ID) || '1:710043004877:web:02180478180ee533fdde84';

export const isFirebaseConfigured = true;

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app: FirebaseApp | null = getApps()[0] ?? initializeApp(firebaseConfig);

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
