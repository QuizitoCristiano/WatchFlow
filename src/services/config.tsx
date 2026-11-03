import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
export const isFirebaseConfigured = Boolean(apiKey && apiKey.trim() !== "" && apiKey !== "sua_api_key_aqui");

const firebaseConfig = {
  apiKey: isFirebaseConfigured ? apiKey : "dummy-local-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "localhost",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "watchflow-dev",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "watchflow-dev.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "0000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:0000000000:web:local",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Se não houver apps inicializados
const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

let authInstance: any = null;
let dbInstance: any = null;
let storageInstance: any = null;

if (isFirebaseConfigured) {
  try {
    authInstance = getAuth(app);
    dbInstance = getFirestore(app);
    storageInstance = getStorage(app);
  } catch (err) {
    console.warn("⚠️ [WatchFlow] Firebase não pôde ser inicializado com as chaves fornecidas. Usando fallback local.", err);
  }
}

export const auth = authInstance;
export const db = dbInstance;
export const storage = storageInstance;

export const analyticsPromise = isSupported().then((supported) => {
  if (supported && isFirebaseConfigured) {
    try {
      return getAnalytics(app);
    } catch {
      return null;
    }
  }
  return null;
});

export default app;
