import { doc, updateDoc, getDoc } from 'firebase/firestore';
import type { UserPreferences } from '@/types';
import { auth, db, isFirebaseConfigured } from '@/services/config';

import { DEFAULT_PREFERENCES, normalizePreferences } from '@/lib/preferences';

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
      return normalizePreferences(preferences);
    }

    const raw = localStorage.getItem(localPreferencesKey(userId));
    if (!raw) return DEFAULT_PREFERENCES;
    try {
      return normalizePreferences(JSON.parse(raw));
    } catch {
      return DEFAULT_PREFERENCES;
    }
  },

  async updatePreferences(userId: string, preferences: UserPreferences): Promise<void> {
    assertUserScope(userId);
    const safePreferences = normalizePreferences(preferences);
    if (isFirebaseConfigured && db) {
      await updateDoc(doc(db, 'users', userId), { preferences: safePreferences });
      return;
    }
    localStorage.setItem(localPreferencesKey(userId), JSON.stringify(safePreferences));
  },
};
