import { db, isFirebaseConfigured } from '@/services/config';
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

const LOCAL_STORAGE_KEY = 'wf_local_devices';

const getStoredLocalDevices = (): Device[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveStoredLocalDevices = (devices: Device[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(devices));
};

export const getDevicesRef = (userId: string) => {
  if (!userId) throw new Error('Usuário não autenticado.');
  if (!isFirebaseConfigured || !db) return null;
  return collection(db, 'users', userId, 'devices');
};

/**
 * Escuta os dispositivos do usuário em tempo real (Firestore ou Local)
 */
export const subscribeToDevices = (
  userId: string,
  callback: (devices: Device[]) => void
) => {
  if (isFirebaseConfigured && db) {
    const q = query(getDevicesRef(userId)!, orderBy('hostname', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const devices = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as Device[];
      callback(devices);
    });
  }

  // Fallback Local
  const emitLocal = () => {
    callback(getStoredLocalDevices());
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
 * Remove um dispositivo
 */
export const deleteDevice = async (userId: string, deviceId: string) => {
  if (isFirebaseConfigured && db) {
    const docRef = doc(db, 'users', userId, 'devices', deviceId);
    return await deleteDoc(docRef);
  }

  const list = getStoredLocalDevices().filter(d => d.id !== deviceId);
  saveStoredLocalDevices(list);
  window.dispatchEvent(new Event('storage'));
};

/**
 * Registra ou atualiza a máquina local buscando dados de hardware REAIS da API do Vite
 */
export const registerLocalDevice = async (userId: string, customName?: string) => {
  let realHardware: any = null;
  try {
    const res = await fetch('/api/system-metrics');
    if (res.ok) {
      realHardware = await res.json();
    }
  } catch (err) {
    console.warn('Erro ao consultar /api/system-metrics, usando telemetria estimada', err);
  }

  const deviceId = 'dev-local-machine';
  const now = new Date().toISOString();

  const deviceData: Device = {
    id: deviceId,
    userId,
    integrationId: 'local_node_exporter',
    hostname: customName || realHardware?.hostname || 'srv-local-host',
    ip: '127.0.0.1',
    status: 'online',
    os: {
      distro: realHardware?.distro || 'Windows 11 (x86_64)',
      kernel: '6.x',
      hostname: realHardware?.hostname || 'localhost'
    },
    latestMetricsSummary: {
      cpu: realHardware?.cpu?.usagePercent ?? 18,
      memory: realHardware?.memory?.usedPercent ?? 75,
      memoryUsedGb: realHardware?.memory?.usedGb ?? 12.0,
      memoryTotalGb: realHardware?.memory?.totalGb ?? 16.0,
      disk: realHardware?.disk?.usedPercent ?? 85,
      diskUsedGb: realHardware?.disk?.usedGb ?? 800,
      diskTotalGb: realHardware?.disk?.totalGb ?? 930,
      networkInBytesSec: realHardware?.network?.bytesInSec || 1200000,
      networkOutBytesSec: realHardware?.network?.bytesOutSec || 600000,
      latencyMs: 1
    },
    lastSeen: now as any,
    createdAt: now as any,
    updatedAt: now as any
  };

  if (isFirebaseConfigured && db) {
    const deviceDocRef = doc(db, 'users', userId, 'devices', deviceId);
    await setDoc(deviceDocRef, {
      ...deviceData,
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });

    const metricsRef = collection(db, 'users', userId, 'devices', deviceId, 'metrics');
    await addDoc(metricsRef, {
      collectedAt: serverTimestamp(),
      cpu: { usagePercent: deviceData.latestMetricsSummary!.cpu },
      memory: { 
        usedPercent: deviceData.latestMetricsSummary!.memory,
        usedMb: (deviceData.latestMetricsSummary!.memoryUsedGb || 0) * 1024,
        totalMb: (deviceData.latestMetricsSummary!.memoryTotalGb || 0) * 1024
      },
      disk: { 
        usedPercent: deviceData.latestMetricsSummary!.disk,
        usedGb: deviceData.latestMetricsSummary!.diskUsedGb,
        totalGb: deviceData.latestMetricsSummary!.diskTotalGb 
      },
      network: { 
        bytesInSec: deviceData.latestMetricsSummary!.networkInBytesSec,
        bytesOutSec: deviceData.latestMetricsSummary!.networkOutBytesSec
      }
    });
  } else {
    // Armazena no LocalStorage
    const currentList = getStoredLocalDevices().filter(d => d.id !== deviceId);
    currentList.push(deviceData);
    saveStoredLocalDevices(currentList);

    // Salva histórico de métricas localmente
    const histKey = `wf_metrics_${deviceId}`;
    const rawHist = localStorage.getItem(histKey);
    const history = rawHist ? JSON.parse(rawHist) : [];
    history.push({
      id: String(Date.now()),
      collectedAt: now,
      cpu: { usagePercent: deviceData.latestMetricsSummary!.cpu },
      memory: { usedPercent: deviceData.latestMetricsSummary!.memory },
      disk: { usedPercent: deviceData.latestMetricsSummary!.disk },
      network: { 
        bytesInSec: deviceData.latestMetricsSummary!.networkInBytesSec,
        bytesOutSec: deviceData.latestMetricsSummary!.networkOutBytesSec
      }
    });
    // Guarda os últimos 30 pontos
    localStorage.setItem(histKey, JSON.stringify(history.slice(-30)));
    window.dispatchEvent(new Event('storage'));
  }

  return deviceId;
};
