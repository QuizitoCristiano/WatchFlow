import { auth, db, isFirebaseConfigured } from '@/services/config';
import type { Integration, IntegrationType } from '@/types';
import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';

function localIntegrationsKey(userId: string): string {
  return `wf_local_integrations:${userId}`;
}

function assertUserScope(userId: string): void {
  if (!userId) throw new Error('Usuário não autenticado.');
  if (isFirebaseConfigured && auth?.currentUser?.uid !== userId) {
    throw new Error('A sessão não corresponde ao proprietário das integrações.');
  }
}

function readLocalIntegrations(userId: string): Integration[] {
  try {
    const raw = localStorage.getItem(localIntegrationsKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is Integration =>
          typeof item === 'object' && item !== null &&
          'userId' in item && item.userId === userId)
      : [];
  } catch {
    return [];
  }
}

function writeLocalIntegrations(userId: string, integrations: Integration[]): void {
  localStorage.setItem(localIntegrationsKey(userId), JSON.stringify(integrations));
  window.dispatchEvent(new Event('wf_integrations_updated'));
}

export interface ProvisionedCollectorConfig {
  token: string;
  deviceId: string;
  ingestUrl: string;
}

export async function provisionCollectorCredential(
  userId: string,
  integrationId: string,
): Promise<ProvisionedCollectorConfig> {
  assertUserScope(userId);
  const currentUser = auth?.currentUser;
  if (!currentUser || currentUser.uid !== userId) {
    throw new Error('Sessão Firebase não está disponível para provisionar o coletor.');
  }
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(integrationId)) {
    throw new Error('Identificador de integração inválido.');
  }

  const idToken = await currentUser.getIdToken();
  const response = await fetch('/api/collector/provision', {
    method: 'POST',
    cache: 'no-store',
    headers: {
      authorization: `Bearer ${idToken}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({ integrationId }),
    signal: AbortSignal.timeout(10_000),
  });

  const result: unknown = await response.json().catch(() => null);
  const data = typeof result === 'object' && result !== null
    ? result as Record<string, unknown>
    : {};
  if (!response.ok) {
    throw new Error(typeof data.error === 'string'
      ? data.error
      : `Falha ao provisionar o coletor (HTTP ${response.status}).`);
  }
  if (
    typeof data.token !== 'string' ||
    !/^[A-Za-z0-9_-]{43}$/.test(data.token) ||
    typeof data.deviceId !== 'string' ||
    typeof data.ingestUrl !== 'string'
  ) {
    throw new Error('Resposta inválida do endpoint de provisionamento.');
  }

  return {
    token: data.token,
    deviceId: data.deviceId,
    ingestUrl: new URL(data.ingestUrl, window.location.origin).toString(),
  };
}

export function validateIntegrationInput(input: {
  name: string;
  type: IntegrationType;
  baseUrl: string;
}): { name: string; type: IntegrationType; baseUrl: string } {
  const name = input.name.trim();
  if (!name || name.length > 100) {
    throw new Error('Informe um nome com até 100 caracteres.');
  }
  if (input.type !== 'node_exporter') {
    throw new Error('O MVP do WatchFlow aceita somente Node Exporter.');
  }

  let endpoint: URL;
  try {
    endpoint = new URL(input.baseUrl.trim());
  } catch {
    throw new Error('Informe uma URL válida, incluindo http:// ou https://.');
  }
  if (endpoint.protocol !== 'http:' && endpoint.protocol !== 'https:') {
    throw new Error('O endpoint deve usar HTTP ou HTTPS.');
  }
  if (endpoint.username || endpoint.password || endpoint.hash || endpoint.search) {
    throw new Error('A URL não pode conter credenciais, parâmetros ou fragmentos.');
  }
  if (endpoint.href.length > 2048) throw new Error('A URL excede o limite permitido.');
  if (input.type === 'node_exporter') {
    const effectivePort = endpoint.port || (endpoint.protocol === 'https:' ? '443' : '80');
    if (!['9100', '443'].includes(effectivePort)) {
      throw new Error('Node Exporter deve usar a porta TCP 9100 ou um proxy HTTPS na porta 443.');
    }
    if (effectivePort === '443' && endpoint.protocol !== 'https:') {
      throw new Error('A porta 443 exige HTTPS.');
    }
  }

  return { name, type: input.type, baseUrl: endpoint.toString() };
}

const getIntegrationsCollection = (uid: string) => {
  if (!isFirebaseConfigured || !db) return null;
  return collection(db, 'users', uid, 'integrations');
};

export const subscribeToIntegrations = (
  userId: string,
  callback: (integrations: Integration[]) => void,
  onError?: (error: Error) => void,
) => {
  assertUserScope(userId);

  if (isFirebaseConfigured && db) {
    const integrationsQuery = query(getIntegrationsCollection(userId)!, orderBy('createdAt', 'desc'));
    return onSnapshot(integrationsQuery, (snapshot) => {
      callback(snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      })).filter((item) => item.userId === userId) as Integration[]);
    }, (error) => onError?.(error));
  }

  const emitLocal = () => callback(readLocalIntegrations(userId));
  emitLocal();
  window.addEventListener('storage', emitLocal);
  window.addEventListener('wf_integrations_updated', emitLocal);
  return () => {
    window.removeEventListener('storage', emitLocal);
    window.removeEventListener('wf_integrations_updated', emitLocal);
  };
};

export const addIntegration = async (
  userId: string,
  input: { name: string; type: IntegrationType; baseUrl: string },
) => {
  assertUserScope(userId);
  const data = validateIntegrationInput(input);

  if (isFirebaseConfigured && db) {
    const currentUser = auth?.currentUser;
    if (!currentUser || currentUser.uid !== userId) {
      throw new Error('Sessão autenticada inválida.');
    }
    return addDoc(getIntegrationsCollection(userId)!, {
      ...data,
      userId,
      status: 'pending',
      lastSync: null,
      createdAt: serverTimestamp(),
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastError: null,
      attemptsLast24h: 0,
      successesLast24h: 0,
    });
  }

  const integration: Integration = {
    ...data,
    id: `int_${crypto.randomUUID()}`,
    userId,
    status: 'pending',
    createdAt: new Date().toISOString() as Integration['createdAt'],
    lastSync: null,
  };
  writeLocalIntegrations(userId, [integration, ...readLocalIntegrations(userId)]);
  return { id: integration.id };
};

export const deleteIntegration = async (userId: string, integrationId: string) => {
  assertUserScope(userId);
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(integrationId)) {
    throw new Error('Identificador de integração inválido.');
  }

  if (isFirebaseConfigured && db) {
    const currentUser = auth?.currentUser;
    if (!currentUser || currentUser.uid !== userId) throw new Error('Sessão autenticada inválida.');
    return deleteDoc(doc(db, 'users', userId, 'integrations', integrationId));
  }

  writeLocalIntegrations(
    userId,
    readLocalIntegrations(userId).filter((integration) => integration.id !== integrationId),
  );
};
