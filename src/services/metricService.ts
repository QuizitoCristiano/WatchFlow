import { db } from '@/services/config';
import type { MetricPayload } from '@/types';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';

/**
 * Retorna a referência da subcoleção de métricas de um dispositivo específico
 * users/{userId}/devices/{deviceId}/metrics
 */
export const getDeviceMetricsRef = (userId: string, deviceId: string) => {
  if (!userId || !deviceId) throw new Error('Parâmetros userId ou deviceId ausentes.');
  return collection(db, 'users', userId, 'devices', deviceId, 'metrics');
};

/**
 * Escuta em tempo real o histórico recente de métricas de um dispositivo
 */
export const subscribeToDeviceMetrics = (
  userId: string,
  deviceId: string,
  maxPoints: number = 20,
  callback: (metrics: MetricPayload[]) => void
) => {
  if (!userId || !deviceId) {
    callback([]);
    return () => {};
  }

  const q = query(
    getDeviceMetricsRef(userId, deviceId),
    orderBy('collectedAt', 'desc'),
    limit(maxPoints)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as MetricPayload[];

      // Inverte para exibir nos gráficos cronologicamente (da esquerda para a direita)
      callback(records.reverse());
    },
    (error) => {
      console.error('Erro ao escutar métricas em tempo real:', error);
      callback([]);
    }
  );
};

/**
 * Registra uma nova amostra de métricas e atualiza o resumo do dispositivo
 */
export const recordMetricSample = async (
  userId: string,
  deviceId: string,
  data: {
    cpuPercent: number;
    ramPercent: number;
    ramUsedGb?: number;
    ramTotalGb?: number;
    diskPercent: number;
    diskUsedGb?: number;
    diskTotalGb?: number;
    networkInBytesSec?: number;
    networkOutBytesSec?: number;
  }
) => {
  if (!userId || !deviceId) return;

  const metricsRef = getDeviceMetricsRef(userId, deviceId);
  const now = serverTimestamp();

  // 1. Grava o ponto no histórico da série temporal
  await addDoc(metricsRef, {
    collectedAt: now,
    cpu: {
      usagePercent: data.cpuPercent,
    },
    memory: {
      usedPercent: data.ramPercent,
      usedMb: data.ramUsedGb ? Math.round(data.ramUsedGb * 1024) : undefined,
      totalMb: data.ramTotalGb ? Math.round(data.ramTotalGb * 1024) : undefined,
    },
    disk: {
      usedPercent: data.diskPercent,
      usedGb: data.diskUsedGb,
      totalGb: data.diskTotalGb,
    },
    network: {
      bytesInSec: data.networkInBytesSec || 0,
      bytesOutSec: data.networkOutBytesSec || 0,
    },
  });

  // 2. Atualiza o resumo (latestMetricsSummary) do dispositivo para o Dashboard e lista
  const deviceDocRef = doc(db, 'users', userId, 'devices', deviceId);
  await updateDoc(deviceDocRef, {
    status: data.cpuPercent > 90 || data.ramPercent > 90 ? 'critical' : data.cpuPercent > 75 ? 'warning' : 'online',
    lastSeen: now,
    latestMetricsSummary: {
      cpu: Math.round(data.cpuPercent),
      memory: Math.round(data.ramPercent),
      memoryUsedGb: data.ramUsedGb,
      memoryTotalGb: data.ramTotalGb,
      disk: Math.round(data.diskPercent),
      diskUsedGb: data.diskUsedGb,
      diskTotalGb: data.diskTotalGb,
      networkInBytesSec: data.networkInBytesSec || 0,
      networkOutBytesSec: data.networkOutBytesSec || 0,
    },
  });
};
