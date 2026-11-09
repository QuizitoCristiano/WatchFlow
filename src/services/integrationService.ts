import { registerLocalDevice } from '@/services/deviceService';
import { db, isFirebaseConfigured } from '@/services/config';
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

const getIntegrationsRef = (userId: string) => {
  if (!isFirebaseConfigured || !db) return null;
  return collection(db, 'users', userId, 'integrations');
};

/**
 * Escuta em tempo real todas as integrações do usuário (Firestore ou Local)
 */
export const subscribeToIntegrations = (
  userId: string, 
  callback: (integrations: Integration[]) => void
) => {
  if (isFirebaseConfigured && db) {
    const q = query(getIntegrationsRef(userId)!, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const integrations = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Integration[];
      callback(integrations);
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
  data: Omit<Integration, 'id' | 'userId' | 'createdAt' | 'lastSync' | 'status'>
) => {
  if (isFirebaseConfigured && db) {
    const newIntegration = {
      ...data,
      userId,
      status: 'syncing' as IntegrationStatus,
      lastSync: serverTimestamp(),
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(getIntegrationsRef(userId)!, newIntegration);
    testAndSyncIntegration(userId, docRef.id, data.baseUrl);
    return docRef;
  }

  // Local
  const list = getStoredLocalIntegrations();
  const newLocal: Integration = {
    ...data,
    id: `int_${Date.now()}`,
    userId,
    status: 'online',
    lastSync: new Date().toISOString() as any,
    createdAt: new Date().toISOString() as any,
  };
  list.unshift(newLocal);
  saveStoredLocalIntegrations(list);
  window.dispatchEvent(new Event('storage'));
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

    // AUTO-DISCOVERY: Registra e conecta o host descoberto na tela de Dispositivos!
    try {
      await registerLocalDevice(userId);
      console.log('✨ [Auto-Discovery] Host detectado e registrado com sucesso a partir da integração:', item.name);
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
    const docRef = doc(db, 'users', userId, 'integrations', integrationId);
    return await deleteDoc(docRef);
  }

  const list = getStoredLocalIntegrations().filter(i => i.id !== integrationId);
  saveStoredLocalIntegrations(list);
  window.dispatchEvent(new Event('storage'));
};
