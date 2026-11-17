import type { AlertSeverity, AlertType, UserPreferences } from '../types/index.ts';

export type NotificationChannel = 'in-app' | 'email';

const CATEGORY_BY_ALERT: Record<AlertType, keyof UserPreferences['notifications']['categories']> = {
  CPU_HIGH: 'cpu',
  RAM_HIGH: 'memory',
  DISK_HIGH: 'disk',
  GPU_HIGH: 'gpu',
  DEVICE_OFFLINE: 'deviceOffline',
  INTEGRATION_DOWN: 'integrationDown',
};

/**
 * Central notification policy. Keep alert persistence/history independent from delivery preferences.
 * Call this at the delivery boundary (in-app, email or push), never before storing an alert.
 */
export function shouldDeliverAlertNotification(
  alert: { type: AlertType; severity: AlertSeverity },
  preferences: UserPreferences,
  channel: NotificationChannel = 'in-app',
): boolean {
  const settings = preferences.notifications;
  if (!settings.enabled || !settings[alert.severity]) return false;
  if (!settings.categories[CATEGORY_BY_ALERT[alert.type]]) return false;
  if (channel === 'email' && !settings.email) return false;
  return true;
}
