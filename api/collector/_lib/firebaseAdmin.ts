import { cert, getApps, initializeApp } from 'firebase-admin/app';
import type { ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpError } from './errors.ts';
import { createFirestoreCollectorRepository } from './firestoreRepository.ts';
import { createCollectorService } from './service.ts';

let cached: ReturnType<typeof createContext> | null = null;

function createContext() {
  const serviceAccountValue = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const pepper = process.env.COLLECTOR_TOKEN_PEPPER;
  if (!serviceAccountValue || !pepper || pepper.length < 32) {
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
    serviceAccount = {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsed.private_key.replace(/\\n/g, '\n'),
    };
  } catch {
    throw new HttpError(503, 'Credencial de servidor inválida.');
  }

  const app = getApps().find((candidate) => candidate.name === 'watchflow-ingestion') ??
    initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    }, 'watchflow-ingestion');
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const repository = createFirestoreCollectorRepository(firestore);

  return {
    pepper,
    service: createCollectorService(repository, pepper),
    verifyIdToken: async (idToken: string) => {
      const decoded = await auth.verifyIdToken(idToken, true);
      return { uid: decoded.uid };
    },
  };
}

export function getCollectorServerContext(): ReturnType<typeof createContext> {
  cached ??= createContext();
  return cached;
}
