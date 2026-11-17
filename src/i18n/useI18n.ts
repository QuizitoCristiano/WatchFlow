import { useCallback } from 'react';
import { usePreferences } from '@/contexts/usePreferences';
import { translate } from '@/i18n/translations';

export function useI18n() {
  const { preferences } = usePreferences();
  const language = preferences.language;
  const t = useCallback((value: string) => translate(language, value), [language]);
  return { language, t };
}
