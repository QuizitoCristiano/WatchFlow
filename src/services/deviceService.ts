import { captureAppException } from '@/lib/sentry';
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
 * No modo local, atualiza continuamente as métricas do card consultando o sistema!
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

  // Fallback Local com atualização contínua em tempo real
  const updateAndEmitLocal = async () => {
    let devices = getStoredLocalDevices();

    // Se temos o dispositivo local cadastrado, atualiza os dados dele em tempo real
    const localDevIndex = devices.findIndex(d => d.id === 'dev-local-machine');
    if (localDevIndex !== -1) {
      try {
        const res = await fetch('/api/system-metrics');
        if (res.ok) {
          const m = await res.json();
          devices[localDevIndex].latestMetricsSummary = {
            cpu: m.cpu.usagePercent,
            memory: m.memory.usedPercent,
            memoryUsedGb: m.memory.usedGb,
            memoryTotalGb: m.memory.totalGb,
            disk: m.disk.usedPercent,
            diskUsedGb: m.disk.usedGb,
            diskTotalGb: m.disk.totalGb,
            gpu: m.gpu,
            networkInBytesSec: m.network.bytesInSec,
            networkOutBytesSec: m.network.bytesOutSec,
            latencyMs: 1
          };

          // ENGINE DE ALERTAS E SENTRY AUTOMÁTICOS
          const isGpuOverload = m.gpu && m.gpu.usagePercent >= 90;
          const isRamOverload = m.memory.usedPercent >= 90;
          const isCpuOverload = m.cpu.usagePercent >= 90;

          if (isGpuOverload || isRamOverload || isCpuOverload) {
            devices[localDevIndex].status = 'critical';

            // Registra alerta local se não existir
            try {
              const alertsRaw = localStorage.getItem('wf_local_alerts');
              const alertsList = alertsRaw ? JSON.parse(alertsRaw) : [];
              const alertKey = isGpuOverload ? 'GPU_HIGH' : isRamOverload ? 'RAM_HIGH' : 'CPU_HIGH';
              const alertTitle = isGpuOverload 
                ? `Sobrecarga Crítica de GPU (${m.gpu.usagePercent}%)` 
                : isRamOverload 
                ? `Esgotamento Crítico de RAM (${m.memory.usedPercent}%)` 
                : `Uso Excessivo de CPU (${m.cpu.usagePercent}%)`;

              const hasRecent = alertsList.some((a: any) => a.type === alertKey && a.status === 'active');
              if (!hasRecent) {
                alertsList.unshift({
                  id: `alt_${Date.now()}`,
                  userId,
                  deviceId: devices[localDevIndex].id,
                  deviceName: devices[localDevIndex].hostname,
                  type: alertKey,
                  severity: 'critical',
                  title: alertTitle,
                  description: `O recurso atingiu nível de saturação no host ${devices[localDevIndex].hostname}.`,
                  status: 'active',
                  metricTriggered: {
                    metric: isGpuOverload ? 'GPU' : isRamOverload ? 'RAM' : 'CPU',
                    value: `${isGpuOverload ? m.gpu.usagePercent : isRamOverload ? m.memory.usedPercent : m.cpu.usagePercent}%`,
                    threshold: '90%',
                    operator: '>'
                  },
                  firstDetectedAt: new Date().toISOString(),
                  lastDetectedAt: new Date().toISOString(),
                  createdAt: new Date().toISOString()
                });
                localStorage.setItem('wf_local_alerts', JSON.stringify(alertsList));

                // DESPACHA PARA O SENTRY APM
                captureAppException(new Error(`[WatchFlow Alert] ${alertTitle}`), {
                  host: devices[localDevIndex].hostname,
                  metric: isGpuOverload ? 'GPU' : isRamOverload ? 'RAM' : 'CPU',
                  details: m
                });
              }
            } catch (err) {
              console.error('Erro na engine de alertas:', err);
            }
          } else {
            devices[localDevIndex].status = m.cpu.usagePercent > 75 || m.memory.usedPercent > 80 ? 'warning' : 'online';
          }
          devices[localDevIndex].lastSeen = m.collectedAt;
          saveStoredLocalDevices(devices);
        }
      } catch {
        // mantém o anterior se falhar
      }
    }

    callback(devices);
  };

  updateAndEmitLocal();
  const interval = setInterval(updateAndEmitLocal, 2000); // Atualiza a cada 2 segundos

  return () => {
    clearInterval(interval);
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
    console.warn('Erro ao consultar /api/system-metrics', err);
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
      gpu: realHardware?.gpu,
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
    localStorage.setItem(histKey, JSON.stringify(history.slice(-30)));
    window.dispatchEvent(new Event('storage'));
  }

  return deviceId;
};
