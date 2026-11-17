import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_PREFERENCES } from './preferences.ts';
import { shouldDeliverAlertNotification } from './notification-policy.ts';

test('blocks all channels when global notifications are disabled', () => {
  const preferences = { ...DEFAULT_PREFERENCES, notifications: { ...DEFAULT_PREFERENCES.notifications, enabled: false } };
  assert.equal(shouldDeliverAlertNotification({ type: 'CPU_HIGH', severity: 'critical' }, preferences), false);
});

test('respects severity and metric category independently', () => {
  const severityOff = { ...DEFAULT_PREFERENCES, notifications: { ...DEFAULT_PREFERENCES.notifications, warning: false } };
  assert.equal(shouldDeliverAlertNotification({ type: 'CPU_HIGH', severity: 'warning' }, severityOff), false);
  const cpuOff = { ...DEFAULT_PREFERENCES, notifications: { ...DEFAULT_PREFERENCES.notifications, categories: { ...DEFAULT_PREFERENCES.notifications.categories, cpu: false } } };
  assert.equal(shouldDeliverAlertNotification({ type: 'CPU_HIGH', severity: 'critical' }, cpuOff), false);
  assert.equal(shouldDeliverAlertNotification({ type: 'RAM_HIGH', severity: 'critical' }, cpuOff), true);
});

test('email delivery requires its own opt-in', () => {
  assert.equal(shouldDeliverAlertNotification({ type: 'DEVICE_OFFLINE', severity: 'critical' }, DEFAULT_PREFERENCES, 'email'), false);
  const emailEnabled = { ...DEFAULT_PREFERENCES, notifications: { ...DEFAULT_PREFERENCES.notifications, email: true } };
  assert.equal(shouldDeliverAlertNotification({ type: 'DEVICE_OFFLINE', severity: 'critical' }, emailEnabled, 'email'), true);
});

test('keeps alert history eligibility separate from delivery channel', () => {
  const preferences = { ...DEFAULT_PREFERENCES, notifications: { ...DEFAULT_PREFERENCES.notifications, email: false } };
  assert.equal(shouldDeliverAlertNotification({ type: 'INTEGRATION_DOWN', severity: 'critical' }, preferences, 'in-app'), true);
  assert.equal(shouldDeliverAlertNotification({ type: 'INTEGRATION_DOWN', severity: 'critical' }, preferences, 'email'), false);
});
