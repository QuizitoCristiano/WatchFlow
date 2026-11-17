import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type React from 'react';
import type { UserPreferences } from '@/types';
import { DEFAULT_PREFERENCES, settingsService } from '@/lib/settings.service';
import { useAuth } from '@/contexts/useAuth';

interface PreferencesContextValue {
  preferences: UserPreferences;
  isLoading: boolean;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
  savePreferences: () => Promise<void>;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<{ userId: string; value: UserPreferences } | null>(null);
  const userId = user?.uid ?? null;
  const preferences = state?.userId === userId && userId ? state.value : DEFAULT_PREFERENCES;

  useEffect(() => {
    if (authLoading || !userId) {
      setState(null);
      return;
    }
    let active = true;
    void settingsService.getPreferences(userId).then((value) => {
      if (active) setState({ userId, value });
    }).catch((error: unknown) => {
      console.error('Falha ao carregar preferências:', error);
      if (active) setState({ userId, value: DEFAULT_PREFERENCES });
    });
    return () => { active = false; };
  }, [authLoading, userId]);

  useEffect(() => {
    if (!userId || state?.userId !== userId) return;
    const root = document.documentElement;
    const applyTheme = () => {
      const resolved = preferences.theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
        : preferences.theme;
      root.dataset.theme = resolved;
    };
    applyTheme();
    const media = window.matchMedia('(prefers-color-scheme: light)');
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [preferences.theme, state?.userId, userId]);

  const setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>> = (action) => {
    if (!userId || state?.userId !== userId) return;
    setState((current) => {
      const currentValue = current?.userId === userId ? current.value : DEFAULT_PREFERENCES;
      return { userId, value: typeof action === 'function' ? action(currentValue) : action };
    });
  };

  const savePreferences = async () => {
    if (!userId || user?.uid !== userId || state?.userId !== userId) {
      throw new Error('Sessão inválida para salvar preferências.');
    }
    await settingsService.updatePreferences(userId, state.value);
  };

  const value = useMemo(() => ({
    preferences,
    isLoading: authLoading || Boolean(userId && state?.userId !== userId),
    setPreferences,
    savePreferences,
  }), [preferences, authLoading, userId, state?.userId]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences deve ser usado dentro de PreferencesProvider.');
  return context;
}
