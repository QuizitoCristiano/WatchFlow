import { createContext } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { UserPreferences } from '@/types';

export interface PreferencesContextValue {
  preferences: UserPreferences;
  isLoading: boolean;
  setPreferences: Dispatch<SetStateAction<UserPreferences>>;
  savePreferences: () => Promise<void>;
}

export const PreferencesContext = createContext<PreferencesContextValue | null>(null);
