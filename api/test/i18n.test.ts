import assert from 'node:assert/strict';
import test from 'node:test';
import { translate } from '../../src/i18n/translations.ts';

test('keeps Portuguese strings unchanged for pt-BR', () => {
  assert.equal(translate('pt-BR', 'Configurações'), 'Configurações');
});

test('translates primary navigation and settings labels to English', () => {
  assert.equal(translate('en-US', 'Configurações'), 'Settings');
  assert.equal(translate('en-US', 'Notificações por E-mail'), 'Email Notifications');
  assert.equal(translate('en-US', 'Intervalo de atualização da tela'), 'Dashboard refresh interval');
});

test('translates generated metric alert descriptions without losing values', () => {
  assert.equal(
    translate('en-US', 'CPU está em 91.5% (limite de atenção: 80%; crítico: 90%).'),
    'CPU is at 91.5% (warning threshold: 80%; critical: 90%).',
  );
});

test('falls back safely for unknown strings', () => {
  assert.equal(translate('en-US', 'A new untranslated message'), 'A new untranslated message');
});
