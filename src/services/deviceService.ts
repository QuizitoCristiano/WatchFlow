import { db } from '@/services/config';
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
  addDoc 
} from 'firebase/firestore';

/**
 * Referência segura e isolada por usuário (Security by Design)
 */
export const getDevicesRef = (userId: string) => {
  if (!userId) throw new Error('Usuário não autenticado.');
  return collection(db, 'users', userId, 'devices');
};

/**
 * Escuta os dispositivos do usuário em tempo real
 */
export const subscribeToDevices = (
  userId: string,
  callback: (devices: Device[]) => void
) => {
  const q = query(getDevicesRef(userId), orderBy('hostname', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const devices = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    })) as Device[];

    callback(devices);
  });
};

/**
 * Remove um dispositivo
 */
export const deleteDevice = async (userId: string, deviceId: string) => {
  if (!userId || !deviceId) return;
  const docRef = doc(db, 'users', userId, 'devices', deviceId);
  return await deleteDoc(docRef);
};

/**
 * Registra ou atualiza a máquina local como dispositivo monitorado
 */
export const registerLocalDevice = async (userId: string, customName?: string) => {
  if (!userId) throw new Error('Usuário não autenticado.');

  const deviceId = 'dev-local-machine';
  const deviceDocRef = doc(db, 'users', userId, 'devices', deviceId);

  const ramTotalGb = 16;
  const ramUsedGb = 11.2;
  const ramPercent = Math.round((ramUsedGb / ramTotalGb) * 100);
  const cpuPercent = 24;
  const diskTotalGb = 1000;
  const diskUsedGb = 820;
  const diskPercent = Math.round((diskUsedGb / diskTotalGb) * 100);

  const now = serverTimestamp();

  // 1. Cria ou atualiza o documento do dispositivo
  await setDoc(deviceDocRef, {
    hostname: customName || 'srv-local-host',
    ip: '127.0.0.1',
    status: 'online',
    userId,
    integrationId: 'local_agent',
    os: {
      distro: 'Windows 11 / Node Exporter',
      kernel: 'x86_64',
      hostname: 'localhost'
    },
    latestMetricsSummary: {
      cpu: cpuPercent,
      memory: ramPercent,
      memoryUsedGb: ramUsedGb,
      memoryTotalGb: ramTotalGb,
      disk: diskPercent,
      diskUsedGb: diskUsedGb,
      diskTotalGb: diskTotalGb,
      networkInBytesSec: 1540000,
      networkOutBytesSec: 420000,
      latencyMs: 12
    },
    lastSeen: now,
    createdAt: now,
    updatedAt: now
  }, { merge: true });

  // 2. Cria amostras de histórico inicial na subcoleção metrics
  const metricsRef = collection(db, 'users', userId, 'devices', deviceId, 'metrics');
  await addDoc(metricsRef, {
    collectedAt: now,
    cpu: { usagePercent: cpuPercent },
    memory: { usedPercent: ramPercent, usedMb: ramUsedGb * 1024, totalMb: ramTotalGb * 1024 },
    disk: { usedPercent: diskPercent, usedGb: diskUsedGb, totalGb: diskTotalGb },
    network: { bytesInSec: 1540000, bytesOutSec: 420000 }
  });

  return deviceId;
};
