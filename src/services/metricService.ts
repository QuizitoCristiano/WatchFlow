import { auth, db, isFirebaseConfigured } from '@/services/config';
import { SHARED_CLOUD_USER_ID } from '@/services/deviceService';
import type { MetricPayload } from '@/types';
import {
  collection,
  doc,
  onSnapshot,
} from 'firebase/firestore';

function assertUserScope(userId: string): void {
  if (!userId) throw new Error('Usuário não autenticado.');
  if (isFirebaseConfigured && auth?.currentUser && auth.currentUser.uid !== userId) {
    throw new Error('A sessão não corresponde ao proprietário das métricas.');
  }
}

export const getDeviceMetricsRef = (userId: string, deviceId: string) => {
  assertUserScope(userId);
  if (!deviceId) throw new Error('Identificador de dispositivo ausente.');
  if (!isFirebaseConfigured || !db) return null;
  return collection(db, 'users', SHARED_CLOUD_USER_ID, 'devices', deviceId, 'metrics');
};

/** Escuta em tempo real as métricas enviadas pelo agente do notebook no Firestore. */
export const subscribeToDeviceMetrics = (
  userId: string,
  deviceId: string,
  maxPoints: number = 20,
  callback: (metrics: MetricPayload[]) => void,
) => {
  if (!userId || !deviceId || !Number.isInteger(maxPoints) || maxPoints < 1 || maxPoints > 100) {
    callback([]);
    return () => {};
  }

  assertUserScope(userId);
  if (!isFirebaseConfigured || !db) {
    callback([]);
    return () => {};
  }

  const histKey = `wf_metrics_${deviceId}`;
  const devRef = doc(db, 'users', SHARED_CLOUD_USER_ID, 'devices', deviceId);

  return onSnapshot(devRef, (docSnap) => {
    if (!docSnap.exists()) return;
    const data = docSnap.data();
    const s = data?.latestMetricsSummary;
    if (!s) return;

    try {
      const rawHist = localStorage.getItem(histKey);
      const history: MetricPayload[] = rawHist ? JSON.parse(rawHist) : [];

      history.push({
        id: String(Date.now()),
        collectedAt: new Date().toISOString(),
        cpu: { usagePercent: s.cpu ?? 0 },
        memory: {
          usedPercent: s.memory ?? 0,
          usedMb: (s.memoryUsedGb ?? 0) * 1024,
          totalMb: (s.memoryTotalGb ?? 16) * 1024,
        },
        disk: {
          usedPercent: s.disk ?? 0,
          usedGb: s.diskUsedGb ?? 0,
          totalGb: s.diskTotalGb ?? 500,
        },
        gpu: s.gpu,
        network: {
          bytesInSec: s.networkInBytesSec ?? 1150000,
          bytesOutSec: s.networkOutBytesSec ?? 620000,
        },
      });

      const trimmed = history.slice(-maxPoints);
      localStorage.setItem(histKey, JSON.stringify(trimmed));
      callback(trimmed);
    } catch {
      callback([]);
    }
  }, (error) => {
    console.error('Erro ao escutar métricas do dispositivo:', error);
    callback([]);
  });
};
