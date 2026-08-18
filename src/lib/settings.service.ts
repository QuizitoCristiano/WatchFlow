import { doc, updateDoc, getDoc } from 'firebase/firestore';
import type { UserPreferences } from '@/types';
import { db } from '@/services/config';

export const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  theme: 'dark',
  notifications: {
    enabled: true,
    critical: true,
    warning: true,
    info: false,
    email: false,
  },
  monitoring: {
    refreshInterval: 15,
    defaultTimeRange: '24h',
  },
  dashboard: {
    cpu: true,
    memory: true,
    disk: true,
    network: true,
    availability: true,
    alerts: true,
  },
};

export const settingsService = {
  async getPreferences(userId: string): Promise<UserPreferences> {
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (snap.exists() && snap.data()?.preferences) {
        return snap.data().preferences as UserPreferences;
      }
      return DEFAULT_PREFERENCES;
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      return DEFAULT_PREFERENCES;
    }
  },

  async updatePreferences(userId: string, preferences: UserPreferences): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { preferences });
  },
};