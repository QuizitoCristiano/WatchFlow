import { auth, db, isFirebaseConfigured } from '@/services/config';
import type { MetricPayload } from '@/types';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';

function assertUserScope(userId: string): void {
  if (!userId) throw new Error('Usuário não autenticado.');
  if (isFirebaseConfigured && auth?.currentUser?.uid !== userId) {
    throw new Error('A sessão não corresponde ao proprietário das métricas.');
  }
}

export const getDeviceMetricsRef = (userId: string, deviceId: string) => {
  assertUserScope(userId);
  if (!deviceId) throw new Error('Identificador de dispositivo ausente.');
  if (!isFirebaseConfigured || !db) return null;
  return collection(db, 'users', userId, 'devices', deviceId, 'metrics');
};

/** Escuta somente o histórico persistido do dispositivo pertencente ao usuário. */
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
    // Local mode has no trusted collector or persisted telemetry source.
    callback([]);
    return () => {};
  }

  const metricsQuery = query(
    getDeviceMetricsRef(userId, deviceId)!,
    orderBy('collectedAt', 'desc'),
    limit(maxPoints),
  );

  return onSnapshot(metricsQuery, (snapshot) => {
    const records = snapshot.docs.map((document) => ({
      id: document.id,
      ...document.data(),
    })) as MetricPayload[];
    callback(records.reverse());
  }, (error) => {
    console.error('Erro ao escutar métricas do dispositivo autenticado:', error);
    callback([]);
  });
};
