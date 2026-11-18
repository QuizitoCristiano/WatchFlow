import { cert, getApps, initializeApp } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpError } from './errors.ts';
import { createFirestoreCollectorRepository } from './firestoreRepository.ts';
import { createCollectorService } from './service.ts';

const APP_NAME = 'watchflow-ingestion';
const DEMO_PROJECT_ID = 'demo-watchflow';

let cached: ReturnType<typeof createContext> | null = null;

function createContext() {
  const pepper = process.env.COLLECTOR_TOKEN_PEPPER;
  if (!pepper || pepper.length < 32) {
    throw new HttpError(503, 'Ingestão não configurada no servidor.');
  }

  const useEmulator = process.env.FIREBASE_USE_EMULATOR === 'true';
  let app;

  if (useEmulator) {
    if (
      process.env.NODE_ENV === 'production' ||
      process.env.VERCEL_ENV === 'production' ||
      process.env.FIREBASE_PROJECT_ID !== DEMO_PROJECT_ID
    ) {
      throw new HttpError(503, 'Configuração do Firebase Emulator inválida para este ambiente.');
    }

    // Fixar os hosts locais evita que o Admin SDK alcance serviços Firebase externos.
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';

    app = getApps().find((candidate) => candidate.name === APP_NAME) ??
      initializeApp({ projectId: DEMO_PROJECT_ID }, APP_NAME);
  } else {
    const serviceAccountValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountValue) {
      throw new HttpError(503, 'Ingestão não configurada no servidor.');
    }

    let serviceAccount: ServiceAccount;
    try {
      const parsed: unknown = JSON.parse(serviceAccountValue);
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('project_id' in parsed) ||
        !('client_email' in parsed) ||
        !('private_key' in parsed) ||
        typeof parsed.project_id !== 'string' ||
        typeof parsed.client_email !== 'string' ||
        typeof parsed.private_key !== 'string'
      ) {
        throw new Error('Invalid service account shape');
      }

      if (
        process.env.FIREBASE_PROJECT_ID &&
        process.env.FIREBASE_PROJECT_ID !== parsed.project_id
      ) {
        throw new Error('Firebase project ID mismatch');
      }

      serviceAccount = {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key.replace(/\\n/g, '\n'),
      };
    } catch {
      throw new HttpError(503, 'Credencial de servidor inválida.');
    }

    app = getApps().find((candidate) => candidate.name === APP_NAME) ??
      initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.projectId,
      }, APP_NAME);
  }

  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const repository = createFirestoreCollectorRepository(firestore);

  return {
    pepper,
    service: createCollectorService(repository, pepper),
    verifyIdToken: async (idToken: string) => {
      const decoded = await auth.verifyIdToken(idToken, !useEmulator);
      return { uid: decoded.uid };
    },
  };
}

export function getCollectorServerContext(): ReturnType<typeof createContext> {
  cached ??= createContext();
  return cached;
}
