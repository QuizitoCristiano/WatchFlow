import { db } from '@/services/config';
import type { Device } from '@/types';
import { collection, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';

/**
 * Referência segura e isolada por usuário (Security by Design)
 */
const getDevicesRef = (userId: string) => {
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