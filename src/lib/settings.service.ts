import { doc, updateDoc, getDoc } from 'firebase/firestore';
import type { UserPreferences } from '@/types';
import { auth, db, isFirebaseConfigured } from '@/services/config';

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

const localPreferencesKey = (userId: string) => `wf_local_preferences:${userId}`;

function assertUserScope(userId: string): void {
  if (!userId) throw new Error('Usuário não autenticado.');
  if (isFirebaseConfigured && auth?.currentUser?.uid !== userId) {
    throw new Error('A sessão não corresponde ao proprietário das preferências.');
  }
}

export const settingsService = {
  async getPreferences(userId: string): Promise<UserPreferences> {
    assertUserScope(userId);
    if (isFirebaseConfigured && db) {
      const userRef = doc(db, 'users', userId);
      const snapshot = await getDoc(userRef);
      if (!snapshot.exists()) return DEFAULT_PREFERENCES;
      const preferences = snapshot.data().preferences;
      return preferences ? preferences as UserPreferences : DEFAULT_PREFERENCES;
    }

    const raw = localStorage.getItem(localPreferencesKey(userId));
    return raw ? JSON.parse(raw) as UserPreferences : DEFAULT_PREFERENCES;
  },

  async updatePreferences(userId: string, preferences: UserPreferences): Promise<void> {
    assertUserScope(userId);
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'users', userId), { preferences });
      return;
    }
    localStorage.setItem(localPreferencesKey(userId), JSON.stringify(preferences));
  },
};
