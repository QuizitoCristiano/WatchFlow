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

const stressOverrideUntilByDevice: Record<string, number> = {};

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
const announcedConnectedDevices = new Set<string>();

async function persistAlertToCloudAndLocal(
  userId: string,
  alertId: string,
  alertData: Record<string, unknown>,
) {
  try {
    const storageKey = `wf_local_alerts:${userId}`;
    const raw = localStorage.getItem(storageKey);
    const list = raw ? JSON.parse(raw) : [];
    const filtered = Array.isArray(list) ? list.filter((a: any) => a.id !== alertId) : [];
    filtered.unshift({ id: alertId, ...alertData });
    localStorage.setItem(storageKey, JSON.stringify(filtered.slice(0, 50)));
    window.dispatchEvent(new Event('wf_alerts_updated'));
  } catch {
    // ignore storage errors
  }

  if (isFirebaseConfigured && db) {
    try {
      await setDoc(doc(db, 'alerts', alertId), {
        ...alertData,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } catch {
      // ignore firestore error
    }
  }
}

function applyStressOverrideIfActive(device: Device): Device {
  const overrideUntil = device.id ? (stressOverrideUntilByDevice[device.id] || 0) : 0;
  if (Date.now() < overrideUntil && !device.isDemoData) {
    const currentGpuName = device.latestMetricsSummary?.gpu?.name || 'GPU';
    return {
      ...device,
      status: 'critical',
      latestMetricsSummary: {
        ...(device.latestMetricsSummary || {}),
        cpu: 94,
        memory: 92,
        disk: device.latestMetricsSummary?.disk ?? 78,
        gpu: {
          name: currentGpuName,
          usagePercent: 96,
          temperatureC: 82,
        },
      },
    };
  }
  return device;
}

function evaluateDeviceAlerts(device: Device, currentUserId: string) {
  if (!device.id) return;

  // Registra conexão inicial do dispositivo remoto no Sentry uma vez por sessão
  if (!device.isDemoData && !announcedConnectedDevices.has(device.id)) {
    announcedConnectedDevices.add(device.id);
    captureAppException(
      new Error(`[WatchFlow Lifecycle] Dispositivo Conectado com Sucesso: ${device.hostname}`),
      {
        host: device.hostname,
        device_id: device.id,
        metric: `CONEXAO_${device.hostname}`,
        operation: 'device_connected',
      },
    );
    toast.success(`💻 Dispositivo conectado: ${device.hostname}`, {
      description: 'Conexão registrada no Sentry APM!',
      duration: 6000,
    });
  }

  const summary = device.latestMetricsSummary;
  if (!summary) return;

  const cpuVal = summary.cpu ?? 0;
  const memVal = summary.memory ?? 0;
  const gpuVal = summary.gpu?.usagePercent ?? 0;

  const conditions = [
    {
      isTriggered: cpuVal >= 90,
      key: `${device.id}_CPU_HIGH`,
      type: 'CPU_HIGH',
      metric: 'CPU',
      val: `${cpuVal}%`,
      sentryTitle: `[WatchFlow Alert] Uso Excessivo de CPU (${cpuVal}%) em ${device.hostname}`,
      uiTitle: `Uso Excessivo de CPU (${cpuVal}%)`,
    },
    {
      isTriggered: memVal >= 90,
      key: `${device.id}_RAM_HIGH`,
      type: 'RAM_HIGH',
      metric: 'RAM',
      val: `${memVal}%`,
      sentryTitle: `[WatchFlow Alert] Esgotamento Crítico de Memória RAM (${memVal}%) em ${device.hostname}`,
      uiTitle: `Esgotamento Crítico de Memória RAM (${memVal}%)`,
    },
    {
      isTriggered: gpuVal >= 90,
      key: `${device.id}_GPU_HIGH`,
      type: 'GPU_HIGH',
      metric: 'GPU',
      val: `${gpuVal}%`,
      sentryTitle: `[WatchFlow Alert] Sobrecarga Crítica de GPU (${gpuVal}%) em ${device.hostname}`,
      uiTitle: `Sobrecarga Crítica de GPU (${gpuVal}%)`,
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

        const alertId = `alt_${device.id}_${cond.metric}_${now}`;
        const isoNow = new Date().toISOString();

        void persistAlertToCloudAndLocal(currentUserId, alertId, {
          userId: currentUserId,
          deviceId: device.id,
          deviceName: device.hostname,
          type: cond.type,
          severity: 'critical',
          title: `${cond.uiTitle} — ${device.hostname}`,
          description: `O recurso ${cond.metric} atingiu nível crítico (${cond.val}) no host ${device.hostname}.`,
          status: 'active',
          metricTriggered: {
            metric: cond.metric,
            value: cond.val,
            threshold: '90%',
            operator: '>',
          },
          firstDetectedAt: isoNow,
          lastDetectedAt: isoNow,
          createdAt: isoNow,
        });

        toast.error(`🔥 Alerta Crítico (${device.hostname}): ${cond.uiTitle}`, {
          description: 'Incidente registrado na Central de Alertas e enviado ao Sentry APM!',
          duration: 8000,
        });

        captureAppException(new Error(cond.sentryTitle), {
          host: device.hostname,
          device_id: device.id,
          metric: cond.metric,
          operation: `alert_${cond.metric.toLowerCase()}`,
        });
      }
    } else if (wasAlertActive[cond.key]) {
      wasAlertActive[cond.key] = false;
      toast.success(`✅ Auto-Recovery (${device.hostname}): Uso de ${cond.metric} normalizou (${cond.val}).`);
    }
  }
}

/**
 * Registra o navegador/máquina atual e envia evento de conexão ao Sentry.
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
 * Lista os dispositivos vinculados à conta autenticada + dispositivos enviados pelo agente coletor do notebook.
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
        if (d.id) mergedMap.set(d.id, applyStressOverrideIfActive(d));
      }
      for (const d of userDevices) {
        if (d.id) mergedMap.set(d.id, applyStressOverrideIfActive(d));
      }
      const all = Array.from(mergedMap.values());
      for (const dev of all) {
        evaluateDeviceAlerts(dev, userId);
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

    const overrideTimer = setInterval(() => {
      let expiredAny = false;
      const now = Date.now();
      for (const [devId, until] of Object.entries(stressOverrideUntilByDevice)) {
        if (until > 0 && now >= until) {
          delete stressOverrideUntilByDevice[devId];
          expiredAny = true;
        }
      }
      if (expiredAny) {
        emitMerged();
      }
    }, 1000);

    return () => {
      clearInterval(overrideTimer);
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

/** Remove um dispositivo e dispara evento de desconexão no Sentry. */
export const deleteDevice = async (userId: string, deviceId: string) => {
  assertUserScope(userId);
  if (!deviceId) throw new Error('Identificador de dispositivo inválido.');

  captureAppException(
    new Error(`[WatchFlow Lifecycle] Dispositivo Desconectado/Removido: ${deviceId}`),
    {
      host: deviceId,
      device_id: deviceId,
      metric: `DESCONEXAO_${deviceId}`,
      operation: 'device_disconnected',
    },
  );
  toast.info(`🔌 Dispositivo ${deviceId} desconectado e registrado no Sentry.`);

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

export const triggerStressSimulation = async (devices?: Device[], specificDeviceId?: string) => {
  if (!isFirebaseConfigured || !db) return;

  const targetDevice = specificDeviceId
    ? devices?.find((d) => d.id === specificDeviceId)
    : (devices?.find((d) => !d.isDemoData) || devices?.[0]);

  const deviceId = targetDevice?.id || specificDeviceId || 'dev-notebook-utp';
  const hostname = targetDevice?.hostname || 'NOTEBOOK-MONITORADO';
  const currentGpuName = targetDevice?.latestMetricsSummary?.gpu?.name || 'GPU';

  // Ativa sobrecarga por 12 segundos APENAS no dispositivo alvo!
  stressOverrideUntilByDevice[deviceId] = Date.now() + 12000;

  // Reseta o cooldown apenas dessa máquina para disparar imediatamente os alertas dela
  delete lastAlertSentTimes[`${deviceId}_CPU_HIGH`];
  delete lastAlertSentTimes[`${deviceId}_RAM_HIGH`];
  delete lastAlertSentTimes[`${deviceId}_GPU_HIGH`];
  wasAlertActive[`${deviceId}_CPU_HIGH`] = false;
  wasAlertActive[`${deviceId}_RAM_HIGH`] = false;
  wasAlertActive[`${deviceId}_GPU_HIGH`] = false;

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
};
