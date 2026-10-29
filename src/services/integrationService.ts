import { auth, db } from '@/services/config';
import type { Integration, IntegrationType } from '@/types';
import { 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  onSnapshot, 
  serverTimestamp,
  query,
  orderBy 
} from 'firebase/firestore';

const getAuthenticatedUid = (uid: string): string => {
  const authenticatedUid = auth.currentUser?.uid;
  if (!authenticatedUid) throw new Error('Faça login antes de acessar integrações.');
  if (authenticatedUid !== uid) throw new Error('Não é permitido acessar integrações de outro usuário.');
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
  const currentUser = auth.currentUser;
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
  if (endpoint.href.length > 2048) {
    throw new Error('A URL do endpoint excede o limite de 2048 caracteres.');
  }
  if (endpoint.username || endpoint.password || endpoint.hash || endpoint.search) {
    throw new Error('A URL não pode conter credenciais, parâmetros ou fragmento.');
  }
  if (input.type === 'node_exporter' && !['/', '/metrics'].includes(endpoint.pathname)) {
    throw new Error('Para Node Exporter, use a raiz do host ou o endpoint /metrics.');
  }
  if (input.type === 'node_exporter') endpoint.pathname = '/metrics';

  return { name, type: input.type, baseUrl: endpoint.toString() };
}

/**
 * Integrações pertencem exclusivamente à sessão Firebase Auth atual.
 */
const getIntegrationsCollection = (userId: string) =>
  collection(db, 'users', userId, 'integrations');

/**
 * Escuta em tempo real as integrações do usuário autenticado.
 */
export const subscribeToIntegrations = (
  userId: string, 
  callback: (integrations: Integration[]) => void,
  onError: (error: Error) => void,
) => {
  const q = query(getIntegrationsCollection(getAuthenticatedUid(userId)), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const integrations = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Integration[];

    callback(integrations);
  }, onError);
};

/**
 * Salva somente a configuração. A confirmação de conectividade/coleta deve vir do
 * coletor local, não de uma requisição do navegador hospedado remotamente.
 */
export const addIntegration = async (
  userId: string,
  input: { name: string; type: IntegrationType; baseUrl: string },
) => {
  const uid = getAuthenticatedUid(userId);
  const data = validateIntegrationInput(input);
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

  return addDoc(getIntegrationsCollection(uid), newIntegration);
};

/**
 * Remove uma integração
 */
export const deleteIntegration = async (userId: string, integrationId: string) => {
  const uid = getAuthenticatedUid(userId);
  if (!integrationId.trim()) throw new Error('Identificador de integração inválido.');
  const docRef = doc(db, 'users', uid, 'integrations', integrationId);
  return await deleteDoc(docRef);
};