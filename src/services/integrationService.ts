import { db } from '@/services/config';
import type { Integration, IntegrationStatus } from '@/types';
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

// Referência para a subcoleção de integrações do usuário
const getIntegrationsRef = (userId: string) => 
  collection(db, 'users', userId, 'integrations');

/**
 * Escuta em tempo real (Realtime Listener) todas as integrações do usuário.
 */
export const subscribeToIntegrations = (
  userId: string, 
  callback: (integrations: Integration[]) => void
) => {
  const q = query(getIntegrationsRef(userId), orderBy('createdAt', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const integrations = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Integration[];

    callback(integrations);
  });
};

/**
 * Adiciona uma nova integração e já dispara a primeira sincronização
 */
export const addIntegration = async (
  userId: string, 
  data: Omit<Integration, 'id' | 'userId' | 'createdAt' | 'lastSync' | 'status'>
) => {
  const newIntegration = {
    ...data,
    userId,
    status: 'syncing' as IntegrationStatus,
    lastSync: serverTimestamp(),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(getIntegrationsRef(userId), newIntegration);
  
  // Testa a conexão logo após cadastrar
  testAndSyncIntegration(userId, docRef.id, data.baseUrl);

  return docRef;
};

/**
 * Testa a conexão com o endpoint da integração e atualiza o status
 */
export const testAndSyncIntegration = async (
  userId: string, 
  integrationId: string, 
  baseUrl: string
) => {
  const integrationDocRef = doc(db, 'users', userId, 'integrations', integrationId);

  // Coloca em estado de sincronização
  await updateDoc(integrationDocRef, { status: 'syncing' });

  try {
    // Normaliza a URL para não duplicar /metrics
    const cleanUrl = baseUrl.trim().replace(/\/+$/, '');
    const targetUrl = cleanUrl.endsWith('/metrics') ? cleanUrl : `${cleanUrl}/metrics`;

    // Timeout de 4 segundos caso o servidor não responda
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    // mode: 'no-cors' permite validar se a porta/servidor está respondendo sem ser bloqueado pelo browser
    await fetch(targetUrl, { 
      method: 'GET',
      mode: 'no-cors',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    // Se chegou até aqui sem estourar catch/timeout, o serviço está online!
    await updateDoc(integrationDocRef, {
      status: 'online',
      lastSync: serverTimestamp(),
    });

    return true;
  } catch (error) {
    console.error('Erro ao conectar com a integração:', error);

    await updateDoc(integrationDocRef, {
      status: 'offline',
      lastSync: serverTimestamp(),
    });

    return false;
  }
};

/**
 * Remove uma integração
 */
export const deleteIntegration = async (userId: string, integrationId: string) => {
  const docRef = doc(db, 'users', userId, 'integrations', integrationId);
  return await deleteDoc(docRef);
};