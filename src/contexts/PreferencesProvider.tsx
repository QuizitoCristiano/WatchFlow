import { useEffect, useState } from 'react';
import type { ReactNode, Dispatch, SetStateAction } from 'react';
import type { UserPreferences } from '@/types';
import { PreferencesContext } from '@/contexts/PreferencesContext';
import { DEFAULT_PREFERENCES } from '@/lib/preferences';
import { settingsService } from '@/lib/settings.service';
import { useAuth } from '@/contexts/useAuth';

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [state, setState] = useState<{ userId: string; value: UserPreferences } | null>(null);
  const userId = user?.uid ?? null;
  const preferences = state?.userId === userId && userId ? state.value : DEFAULT_PREFERENCES;

  useEffect(() => {
    if (authLoading || !userId) return;
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
    const root = document.documentElement;
    if (!userId || state?.userId !== userId) {
      root.dataset.theme = 'dark';
      root.lang = 'pt-BR';
      return;
    }
    root.lang = preferences.language;
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
  }, [preferences.theme, preferences.language, state?.userId, userId]);

  const setPreferences: Dispatch<SetStateAction<UserPreferences>> = (action) => {
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

  return (
    <PreferencesContext.Provider value={{
      preferences,
      isLoading: authLoading || Boolean(userId && state?.userId !== userId),
      setPreferences,
      savePreferences,
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}
