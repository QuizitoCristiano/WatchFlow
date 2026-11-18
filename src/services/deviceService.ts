import { captureAppException } from '@/lib/sentry';
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
import { toast } from 'sonner';

export const SHARED_CLOUD_USER_ID = 'usr_local_dev_001';

function localDevicesKey(userId: string): string {
  return `wf_local_devices:${userId}`;
}

function assertUserScope(userId: string): void {
  if (!userId) throw new Error('Usuário não autenticado.');
  if (isFirebaseConfigured && auth?.currentUser && auth.currentUser.uid !== userId) {
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

const lastAlertSentTimes: Record<string, number> = {};
const wasAlertActive: Record<string, boolean> = {};

function evaluateDeviceAlerts(device: Device) {
  const summary = device.latestMetricsSummary;
  if (!summary) return;

  const cpuVal = summary.cpu ?? 0;
  const memVal = summary.memory ?? 0;
  const gpuVal = summary.gpu?.usagePercent ?? 0;

  const conditions = [
    {
      isTriggered: cpuVal >= 90,
      key: `${device.id}_CPU_HIGH`,
      metric: 'CPU',
      val: `${cpuVal}%`,
      title: `Uso Excessivo de CPU (${cpuVal}%)`,
    },
    {
      isTriggered: memVal >= 90,
      key: `${device.id}_RAM_HIGH`,
      metric: 'RAM',
      val: `${memVal}%`,
      title: `Esgotamento Crítico de Memória RAM (${memVal}%)`,
    },
    {
      isTriggered: gpuVal >= 90,
      key: `${device.id}_GPU_HIGH`,
      metric: 'GPU',
      val: `${gpuVal}%`,
      title: `Sobrecarga Crítica de GPU (${gpuVal}%)`,
    },
  ];

  const now = Date.now();
  for (const cond of conditions) {
    if (cond.isTriggered) {
      const lastSent = lastAlertSentTimes[cond.key] || 0;
      const isNewSpike = !wasAlertActive[cond.key];
      const isCooldownElapsed = now - lastSent > 45000;

      if (isNewSpike || isCooldownElapsed) {
        lastAlertSentTimes[cond.key] = now;
        wasAlertActive[cond.key] = true;

        toast.error(`🔥 Alerta Crítico (${device.hostname}): ${cond.title}`, {
          description: 'Incidente detectado e enviado ao Sentry APM em tempo real!',
          duration: 6000,
        });

        captureAppException(new Error(`[WatchFlow Alert] ${cond.title}`), {
          host: device.hostname,
          device_id: device.id || 'unknown',
          metric: cond.metric,
          operation: 'hardware_threshold_breach',
        });
      }
    } else if (wasAlertActive[cond.key]) {
      wasAlertActive[cond.key] = false;
      toast.success(`✅ Uso de ${cond.metric} em ${device.hostname} normalizou (${cond.val}).`);
    }
  }
}

/**
 * Registra o navegador atual como dispositivo de demonstração da integração Sentry.
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
 * Lista os dispositivos vinculados à conta autenticada + dispositivos enviados pelo agente coletor do notebook (canal compartilhado).
 */
export const subscribeToDevices = (
  userId: string,
  callback: (devices: Device[]) => void,
) => {
  assertUserScope(userId);

  if (isFirebaseConfigured && db) {
    let userDevices: Device[] = [];
    let sharedDevices: Device[] = [];

    const emitMerged = () => {
      const mergedMap = new Map<string, Device>();
      for (const d of sharedDevices) {
        if (d.id) mergedMap.set(d.id, d);
      }
      for (const d of userDevices) {
        if (d.id) mergedMap.set(d.id, d);
      }
      const all = Array.from(mergedMap.values());
      for (const dev of all) {
        evaluateDeviceAlerts(dev);
      }
      callback(all);
    };

    const userQuery = query(collection(db, 'users', userId, 'devices'), orderBy('hostname', 'asc'));
    const unsubUser = onSnapshot(userQuery, (snapshot) => {
      userDevices = snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      })) as Device[];
      emitMerged();
    });

    let unsubShared = () => {};
    if (userId !== SHARED_CLOUD_USER_ID) {
      const sharedQuery = query(collection(db, 'users', SHARED_CLOUD_USER_ID, 'devices'), orderBy('hostname', 'asc'));
      unsubShared = onSnapshot(sharedQuery, (snapshot) => {
        sharedDevices = snapshot.docs.map((document) => ({
          id: document.id,
          ...document.data(),
        })) as Device[];
        emitMerged();
      });
    }

    return () => {
      unsubUser();
      unsubShared();
    };
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

/** Remove um dispositivo do escopo do usuário ou do canal compartilhado. */
export const deleteDevice = async (userId: string, deviceId: string) => {
  assertUserScope(userId);
  if (!deviceId) throw new Error('Identificador de dispositivo inválido.');

  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, 'users', userId, 'devices', deviceId)).catch(() => {});
    if (userId !== SHARED_CLOUD_USER_ID) {
      await deleteDoc(doc(db, 'users', SHARED_CLOUD_USER_ID, 'devices', deviceId)).catch(() => {});
    }
    return;
  }

  const devices = readLocalDevices(userId).filter((device) => device.id !== deviceId);
  writeLocalDevices(userId, devices);
};

export const triggerStressSimulation = async (devices?: Device[]) => {
  if (!isFirebaseConfigured || !db) return;

  const targetDevice = devices?.find((d) => !d.isDemoData) || devices?.[0];
  const deviceId = targetDevice?.id || 'dev-notebook-utp';
  const hostname = targetDevice?.hostname || 'NOTEBOOK-MONITORADO';
  const currentGpuName = targetDevice?.latestMetricsSummary?.gpu?.name || 'GPU';

  const deviceDocRef = doc(db, 'users', SHARED_CLOUD_USER_ID, 'devices', deviceId);

  await setDoc(deviceDocRef, {
    hostname,
    ip: targetDevice?.ip || '127.0.0.1',
    status: 'critical',
    lastSeen: serverTimestamp(),
    latestMetricsSummary: {
      ...(targetDevice?.latestMetricsSummary || {}),
      cpu: 94,
      memory: 92,
      disk: targetDevice?.latestMetricsSummary?.disk ?? 78,
      gpu: {
        name: currentGpuName,
        usagePercent: 96,
        temperatureC: 82,
      },
    },
  }, { merge: true });

  setTimeout(async () => {
    try {
      await setDoc(deviceDocRef, {
        status: 'online',
        lastSeen: serverTimestamp(),
        latestMetricsSummary: {
          ...(targetDevice?.latestMetricsSummary || {}),
          cpu: 18,
          memory: 64,
          disk: targetDevice?.latestMetricsSummary?.disk ?? 78,
          gpu: {
            name: currentGpuName,
            usagePercent: 22,
            temperatureC: 46,
          },
        },
      }, { merge: true });
    } catch {
      // ignora
    }
  }, 10000);
};
