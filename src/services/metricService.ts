import { db, isFirebaseConfigured } from '@/services/config';
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

export const getDeviceMetricsRef = (userId: string, deviceId: string) => {
  if (!userId || !deviceId) throw new Error('Parâmetros userId ou deviceId ausentes.');
  if (!isFirebaseConfigured || !db) return null;
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

  if (isFirebaseConfigured && db) {
    const q = query(
      getDeviceMetricsRef(userId, deviceId)!,
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

        callback(records.reverse());
      },
      (error) => {
        console.error('Erro ao escutar métricas no Firestore:', error);
        callback([]);
      }
    );
  }

  // Coleta Real Contínua via API Local (/api/system-metrics)
  const histKey = `wf_metrics_${deviceId}`;
  
  const pollRealMetrics = async () => {
    try {
      const res = await fetch('/api/system-metrics');
      if (res.ok) {
        const m = await res.json();
        const rawHist = localStorage.getItem(histKey);
        const history: MetricPayload[] = rawHist ? JSON.parse(rawHist) : [];
        
        history.push({
          id: String(Date.now()),
          collectedAt: m.collectedAt,
          cpu: { usagePercent: m.cpu.usagePercent },
          memory: { usedPercent: m.memory.usedPercent },
          disk: { usedPercent: m.disk.usedPercent },
          network: { 
            bytesInSec: m.network.bytesInSec, 
            bytesOutSec: m.network.bytesOutSec 
          }
        });

        const trimmed = history.slice(-maxPoints);
        localStorage.setItem(histKey, JSON.stringify(trimmed));
        callback(trimmed);
      }
    } catch {
      const rawHist = localStorage.getItem(histKey);
      callback(rawHist ? JSON.parse(rawHist) : []);
    }
  };

  pollRealMetrics();
  const timer = setInterval(pollRealMetrics, 3000);

  return () => clearInterval(timer);
};
