import { auth, db, isFirebaseConfigured } from '@/services/config';
import type { Device } from '@/types';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

function localDevicesKey(userId: string): string {
  return `wf_local_devices:${userId}`;
}

function assertUserScope(userId: string): void {
  if (!userId) throw new Error('Usuário não autenticado.');
  if (isFirebaseConfigured && auth?.currentUser?.uid !== userId) {
    throw new Error('A sessão não corresponde ao proprietário dos dispositivos.');
  }
}

function readLocalDevices(userId: string): Device[] {
  try {
    const raw = localStorage.getItem(localDevicesKey(userId));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is Device =>
          typeof item === 'object' && item !== null &&
          'userId' in item && item.userId === userId)
      : [];
  } catch {
    return [];
  }
}

function writeLocalDevices(userId: string, devices: Device[]): void {
  localStorage.setItem(localDevicesKey(userId), JSON.stringify(devices));
  window.dispatchEvent(new Event('wf_devices_updated'));
}

export const getDevicesRef = (userId: string) => {
  assertUserScope(userId);
  if (!isFirebaseConfigured || !db) return null;
  return collection(db, 'users', userId, 'devices');
};

/**
 * Registra o navegador atual como dispositivo de demonstração da integração Sentry.
 * Não inventa métricas físicas: CPU, RAM, disco e GPU dependem de um agente local.
 */
export const registerBrowserDevice = async (userId: string) => {
  assertUserScope(userId);

  const now = new Date().toISOString();
  const deviceId = 'sentry-browser-local';
  const device: Device = {
    id: deviceId,
    userId,
    integrationId: 'sentry-browser',
    hostname: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : 'Navegador local',
    ip: 'Não disponibilizado pelo navegador',
    os: {
      distro: typeof navigator !== 'undefined' ? navigator.platform || 'Sistema não identificado' : 'N/A',
      hostname: 'Dispositivo conectado via navegador',
    },
    status: 'online',
    isDemoData: true,
    lastSeen: now,
    createdAt: now,
    updatedAt: now,
  };

  if (isFirebaseConfigured && db) {
    const deviceRef = doc(db, 'users', userId, 'devices', deviceId);
    await setDoc(deviceRef, {
      ...device,
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return deviceId;
  }

  const devices = readLocalDevices(userId).filter((item) => item.id !== deviceId);
  devices.push(device);
  writeLocalDevices(userId, devices);
  return deviceId;
};

/**
 * Lista somente os dispositivos vinculados à conta autenticada.
 * Não faz descoberta automática da máquina que abriu o navegador.
 */
export const subscribeToDevices = (
  userId: string,
  callback: (devices: Device[]) => void,
) => {
  assertUserScope(userId);

  if (isFirebaseConfigured && db) {
    const devicesQuery = query(getDevicesRef(userId)!, orderBy('hostname', 'asc'));
    return onSnapshot(devicesQuery, (snapshot) => {
      const devices = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      })) as Device[];
      callback(devices.filter((device) => device.userId === userId));
    });
  }

  const emitLocal = () => callback(readLocalDevices(userId));
  emitLocal();
  window.addEventListener('storage', emitLocal);
  window.addEventListener('wf_devices_updated', emitLocal);

  return () => {
    window.removeEventListener('storage', emitLocal);
    window.removeEventListener('wf_devices_updated', emitLocal);
  };
};

/** Remove um dispositivo somente do escopo do usuário autenticado. */
export const deleteDevice = async (userId: string, deviceId: string) => {
  assertUserScope(userId);
  if (!deviceId) throw new Error('Identificador de dispositivo inválido.');

  if (isFirebaseConfigured && db) {
    return deleteDoc(doc(db, 'users', userId, 'devices', deviceId));
  }

  const devices = readLocalDevices(userId).filter((device) => device.id !== deviceId);
  writeLocalDevices(userId, devices);
};
