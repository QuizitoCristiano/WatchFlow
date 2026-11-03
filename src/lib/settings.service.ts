import { doc, updateDoc, getDoc } from 'firebase/firestore';
import type { UserPreferences } from '@/types';
import { db, isFirebaseConfigured } from '@/services/config';

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

const LOCAL_STORAGE_KEY = 'wf_local_preferences';

export const settingsService = {
  async getPreferences(userId: string): Promise<UserPreferences> {
    if (isFirebaseConfigured && db) {
      try {
        const userRef = doc(db, 'users', userId);
        const snap = await getDoc(userRef);
        if (snap.exists() && snap.data()?.preferences) {
          return snap.data().preferences as UserPreferences;
        }
      } catch (error) {
        console.error('Erro ao carregar configurações do Firestore:', error);
      }
    }

    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_PREFERENCES;
  },

  async updatePreferences(userId: string, preferences: UserPreferences): Promise<void> {
    if (isFirebaseConfigured && db) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { preferences });
      return;
    }

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(preferences));
  },
};
