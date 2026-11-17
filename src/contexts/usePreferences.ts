import { useContext } from 'react';
import { PreferencesContext } from '@/contexts/PreferencesContext';

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences deve ser usado dentro de PreferencesProvider.');
  return context;
}
