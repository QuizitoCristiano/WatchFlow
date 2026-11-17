import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_PREFERENCES, normalizePreferences } from './preferences.ts';

test('normalizes legacy preferences and fills new notification categories', () => {
  const normalized = normalizePreferences({
    language: 'en-US',
    theme: 'light',
    notifications: { enabled: false, critical: true },
  });
  assert.equal(normalized.language, 'en-US');
  assert.equal(normalized.theme, 'light');
  assert.equal(normalized.notifications.enabled, false);
  assert.equal(normalized.notifications.categories.cpu, true);
  assert.equal(normalized.notifications.categories.integrationDown, true);
  assert.equal(normalized.monitoring.refreshInterval, DEFAULT_PREFERENCES.monitoring.refreshInterval);
});

test('rejects invalid enum and interval values by falling back to safe defaults', () => {
  const normalized = normalizePreferences({
    language: 'xx',
    theme: 'neon',
    timezone: 'x'.repeat(100),
    monitoring: { refreshInterval: 999, defaultTimeRange: 'forever' },
  });
  assert.equal(normalized.language, 'pt-BR');
  assert.equal(normalized.theme, 'dark');
  assert.equal(normalized.timezone, 'America/Sao_Paulo');
  assert.equal(normalized.monitoring.refreshInterval, 15);
  assert.equal(normalized.monitoring.defaultTimeRange, '24h');
});

test('invalid payloads never throw and return defaults', () => {
  assert.deepEqual(normalizePreferences(null), DEFAULT_PREFERENCES);
  assert.deepEqual(normalizePreferences([]), DEFAULT_PREFERENCES);
  assert.deepEqual(normalizePreferences('invalid'), DEFAULT_PREFERENCES);
});

test('preserves explicit false values instead of overwriting them with defaults', () => {
  const normalized = normalizePreferences({
    notifications: { enabled: false, warning: false, categories: { cpu: false } },
    dashboard: { cpu: false },
  });
  assert.equal(normalized.notifications.enabled, false);
  assert.equal(normalized.notifications.warning, false);
  assert.equal(normalized.notifications.categories.cpu, false);
  assert.equal(normalized.dashboard.cpu, false);
});
