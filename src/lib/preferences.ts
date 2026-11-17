import type { UserPreferences } from '../types/index.ts';

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
    categories: {
      cpu: true,
      memory: true,
      disk: true,
      gpu: true,
      deviceOffline: true,
      integrationDown: true,
    },
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



function normalizeTimezone(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 64) {
    return DEFAULT_PREFERENCES.timezone;
  }
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value });
    return value;
  } catch {
    return DEFAULT_PREFERENCES.timezone;
  }
}

/** Merge persisted data with defaults so older documents remain compatible. */
export function normalizePreferences(value: unknown): UserPreferences {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return DEFAULT_PREFERENCES;
  const input = value as Partial<UserPreferences>;
  const notifications: Partial<UserPreferences['notifications']> = input.notifications && typeof input.notifications === 'object' ? input.notifications : {};
  const categories: Partial<UserPreferences['notifications']['categories']> = notifications.categories && typeof notifications.categories === 'object' ? notifications.categories : {};
  const monitoring: Partial<UserPreferences['monitoring']> = input.monitoring && typeof input.monitoring === 'object' ? input.monitoring : {};
  const dashboard: Partial<UserPreferences['dashboard']> = input.dashboard && typeof input.dashboard === 'object' ? input.dashboard : {};
  const validTheme = input.theme === 'light' || input.theme === 'dark' || input.theme === 'system' ? input.theme : DEFAULT_PREFERENCES.theme;
  const validLanguage = input.language === 'en-US' || input.language === 'pt-BR' ? input.language : DEFAULT_PREFERENCES.language;
  const validIntervals = [5, 15, 30, 60, 300] as const;
  const validRanges = ['1h', '24h', '7d', '30d'] as const;
  return {
    language: validLanguage,
    timezone: normalizeTimezone(input.timezone),
    theme: validTheme,
    notifications: {
      enabled: typeof notifications.enabled === 'boolean' ? notifications.enabled : DEFAULT_PREFERENCES.notifications.enabled,
      critical: typeof notifications.critical === 'boolean' ? notifications.critical : DEFAULT_PREFERENCES.notifications.critical,
      warning: typeof notifications.warning === 'boolean' ? notifications.warning : DEFAULT_PREFERENCES.notifications.warning,
      info: typeof notifications.info === 'boolean' ? notifications.info : DEFAULT_PREFERENCES.notifications.info,
      email: typeof notifications.email === 'boolean' ? notifications.email : DEFAULT_PREFERENCES.notifications.email,
      categories: {
        cpu: typeof categories.cpu === 'boolean' ? categories.cpu : DEFAULT_PREFERENCES.notifications.categories.cpu,
        memory: typeof categories.memory === 'boolean' ? categories.memory : DEFAULT_PREFERENCES.notifications.categories.memory,
        disk: typeof categories.disk === 'boolean' ? categories.disk : DEFAULT_PREFERENCES.notifications.categories.disk,
        gpu: typeof categories.gpu === 'boolean' ? categories.gpu : DEFAULT_PREFERENCES.notifications.categories.gpu,
        deviceOffline: typeof categories.deviceOffline === 'boolean' ? categories.deviceOffline : DEFAULT_PREFERENCES.notifications.categories.deviceOffline,
        integrationDown: typeof categories.integrationDown === 'boolean' ? categories.integrationDown : DEFAULT_PREFERENCES.notifications.categories.integrationDown,
      },
    },
    monitoring: {
      refreshInterval: validIntervals.includes(monitoring.refreshInterval as typeof validIntervals[number]) ? monitoring.refreshInterval as UserPreferences['monitoring']['refreshInterval'] : DEFAULT_PREFERENCES.monitoring.refreshInterval,
      defaultTimeRange: validRanges.includes(monitoring.defaultTimeRange as typeof validRanges[number]) ? monitoring.defaultTimeRange as UserPreferences['monitoring']['defaultTimeRange'] : DEFAULT_PREFERENCES.monitoring.defaultTimeRange,
    },
    dashboard: {
      cpu: typeof dashboard.cpu === 'boolean' ? dashboard.cpu : DEFAULT_PREFERENCES.dashboard.cpu,
      memory: typeof dashboard.memory === 'boolean' ? dashboard.memory : DEFAULT_PREFERENCES.dashboard.memory,
      disk: typeof dashboard.disk === 'boolean' ? dashboard.disk : DEFAULT_PREFERENCES.dashboard.disk,
      network: typeof dashboard.network === 'boolean' ? dashboard.network : DEFAULT_PREFERENCES.dashboard.network,
      availability: typeof dashboard.availability === 'boolean' ? dashboard.availability : DEFAULT_PREFERENCES.dashboard.availability,
      alerts: typeof dashboard.alerts === 'boolean' ? dashboard.alerts : DEFAULT_PREFERENCES.dashboard.alerts,
    },
  };
}
