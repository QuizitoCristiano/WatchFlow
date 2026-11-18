import { auth, db, isFirebaseConfigured } from '@/services/config';
import type { MetricPayload } from '@/types';
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';

function assertUserScope(userId: string): void {
  if (!userId) throw new Error('Usuário não autenticado.');
  if (isFirebaseConfigured && auth?.currentUser?.uid !== userId) {
    throw new Error('A sessão não corresponde ao proprietário das métricas.');
  }
}

/** Retorna somente a subcoleção pertencente ao usuário autenticado. */
export const getDeviceMetricsRef = (userId: string, deviceId: string) => {
  assertUserScope(userId);
  if (!deviceId) throw new Error('Identificador de dispositivo ausente.');
  if (!isFirebaseConfigured || !db) return null;
  return collection(db, 'users', userId, 'devices', deviceId, 'metrics');
};

/** Escuta amostras persistidas pelo endpoint autenticado de ingestão. */
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
  const metricsRef = getDeviceMetricsRef(userId, deviceId);
  if (!metricsRef) {
    callback([]);
    return () => {};
  }

  const metricsQuery = query(metricsRef, orderBy('collectedAt', 'desc'), limit(maxPoints));
  return onSnapshot(metricsQuery, (snapshot) => {
    const records = snapshot.docs
      .map((document) => ({ id: document.id, ...document.data() }) as MetricPayload)
      .reverse();
    callback(records);
  }, (error) => {
    console.error('Erro ao escutar métricas do dispositivo:', error);
    callback([]);
  });
};
