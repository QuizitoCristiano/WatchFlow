import { registerLocalDevice } from '@/services/deviceService';
import { auth, db, isFirebaseConfigured } from '@/services/config';
import type { Integration, IntegrationStatus, IntegrationType } from '@/types';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp, 
  query, 
  orderBy 
} from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'wf_local_integrations';

const getStoredLocalIntegrations = (): Integration[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [
      {
        id: 'int_local_node_exporter',
        userId: 'usr_local_dev_001',
        name: 'Node Exporter (Host Local)',
        type: 'node_exporter',
        baseUrl: 'http://localhost:5173/api/system-metrics',
        status: 'online',
        version: '1.9.0',
        lastSync: new Date().toISOString() as any,
        createdAt: new Date().toISOString() as any,
      }
    ];
  } catch {
    return [];
  }
};

const saveStoredLocalIntegrations = (list: Integration[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
};

const getAuthenticatedUid = (uid: string): string => {
  if (!isFirebaseConfigured || !auth) return uid;
  const authenticatedUid = auth.currentUser?.uid;
  if (!authenticatedUid) return uid;
  return authenticatedUid;
};

export interface ProvisionedCollectorConfig {
  token: string;
  deviceId: string;
  ingestUrl: string;
}

export async function provisionCollectorCredential(
  userId: string,
  integrationId: string,
): Promise<ProvisionedCollectorConfig> {
  const uid = getAuthenticatedUid(userId);
  const currentUser = auth?.currentUser;
  if (!currentUser || currentUser.uid !== uid) {
    throw new Error('Sessão Firebase não está disponível para provisionar o coletor.');
  }
  if (!integrationId.trim()) throw new Error('Identificador de integração inválido.');

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
  });
  let result: unknown;
  try {
    result = await response.json() as unknown;
  } catch {
    throw new Error(`O endpoint de provisionamento respondeu com HTTP ${response.status}.`);
  }
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
  if (!['node_exporter', 'telegraf', 'zabbix_agent'].includes(input.type)) {
    throw new Error('Selecione um tipo de agente válido.');
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

  return { name, type: input.type, baseUrl: endpoint.toString() };
}

const getIntegrationsCollection = (uid: string) => {
  if (!isFirebaseConfigured || !db) return null;
  return collection(db, 'users', uid, 'integrations');
};

/**
 * Escuta em tempo real todas as integrações do usuário (Firestore ou Local)
 */
export const subscribeToIntegrations = (
  userId: string, 
  callback: (integrations: Integration[]) => void,
  onError?: (error: Error) => void
) => {
  if (isFirebaseConfigured && db) {
    const q = query(getIntegrationsCollection(userId)!, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const integrations = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Integration[];
      callback(integrations);
    }, (err) => {
      if (onError) onError(err);
      else console.error('Erro na subscrição de integrações:', err);
    });
  }

  // Fallback Local
  const emitLocal = () => {
    callback(getStoredLocalIntegrations());
  };

  emitLocal();
  const interval = setInterval(emitLocal, 3000);
  window.addEventListener('storage', emitLocal);

  return () => {
    clearInterval(interval);
    window.removeEventListener('storage', emitLocal);
  };
};

/**
 * Adiciona uma nova integração
 */
export const addIntegration = async (
  userId: string,
  input: { name: string; type: IntegrationType; baseUrl: string },
) => {
  const uid = getAuthenticatedUid(userId);
  const data = validateIntegrationInput(input);

  if (isFirebaseConfigured && db) {
    const newIntegration = {
      ...data,
      userId: uid,
      status: 'pending' as const,
      lastSync: null,
      createdAt: serverTimestamp(),
      lastAttemptAt: null,
      lastSuccessAt: null,
      lastError: null,
      attemptsLast24h: 0,
      successesLast24h: 0,
    };

    return addDoc(getIntegrationsCollection(uid)!, newIntegration);
  }

  // Local
  const list = getStoredLocalIntegrations();
  const newLocal: Integration = {
    ...data,
    id: `int_${Date.now()}`,
    userId: uid,
    status: 'online',
    lastSync: new Date().toISOString() as any,
    createdAt: new Date().toISOString() as any,
  };
  list.unshift(newLocal);
  saveStoredLocalIntegrations(list);
  window.dispatchEvent(new Event('storage'));

  // Dispara Auto-Discovery local
  try {
    await registerLocalDevice(uid);
  } catch (err) {
    console.warn(err);
  }

  return { id: newLocal.id };
};

/**
 * Testa a conexão com o endpoint da integração
 */
export const testAndSyncIntegration = async (
  userId: string, 
  integrationId: string, 
  baseUrl: string
) => {
  if (isFirebaseConfigured && db) {
    const integrationDocRef = doc(db, 'users', userId, 'integrations', integrationId);
    await updateDoc(integrationDocRef, { status: 'syncing' });

    try {
      const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
      const targetUrl = cleanUrl.endsWith('/metrics') ? cleanUrl : `${cleanUrl}/metrics`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      await fetch(targetUrl, { 
        method: 'GET',
        mode: 'no-cors',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      await updateDoc(integrationDocRef, {
        status: 'online',
        lastSync: serverTimestamp(),
      });
      return true;
    } catch {
      await updateDoc(integrationDocRef, {
        status: 'offline',
        lastSync: serverTimestamp(),
      });
      return false;
    }
  }

  // Local (Auto-Discovery em Ação!)
  const list = getStoredLocalIntegrations();
  const item = list.find(i => i.id === integrationId);
  if (item) {
    item.status = 'online';
    item.lastSync = new Date().toISOString() as any;
    saveStoredLocalIntegrations(list);
    window.dispatchEvent(new Event('storage'));

    try {
      await registerLocalDevice(userId);
    } catch (e) {
      console.error('Erro no auto-discovery:', e);
    }
  }
  return true;
};

/**
 * Remove uma integração
 */
export const deleteIntegration = async (userId: string, integrationId: string) => {
  if (isFirebaseConfigured && db) {
    const uid = getAuthenticatedUid(userId);
    const docRef = doc(db, 'users', uid, 'integrations', integrationId);
    return await deleteDoc(docRef);
  }

  const list = getStoredLocalIntegrations().filter(i => i.id !== integrationId);
  saveStoredLocalIntegrations(list);
  window.dispatchEvent(new Event('storage'));
};
