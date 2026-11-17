import assert from 'node:assert/strict';
import test from 'node:test';
import { validateNodeExporterEndpoint } from '../collector/_lib/firestoreRepository.ts';

test('accepts private Node Exporter endpoint on TCP 9100', () => {
  assert.doesNotThrow(() => validateNodeExporterEndpoint('http://192.168.1.25:9100/metrics'));
});

test('accepts HTTPS reverse proxy on TCP 443', () => {
  assert.doesNotThrow(() => validateNodeExporterEndpoint('https://metrics.internal.example/metrics'));
  assert.doesNotThrow(() => validateNodeExporterEndpoint('https://metrics.internal.example:443/metrics'));
});

test('rejects non-approved ports, paths, credentials, query strings, and fragments', () => {
  const invalid = [
    'http://192.168.1.25/metrics',
    'http://192.168.1.25:8080/metrics',
    'http://192.168.1.25:443/metrics',
    'https://metrics.internal.example:8080/metrics',
    'http://192.168.1.25:9100/',
    'http://user:password@192.168.1.25:9100/metrics',
    'http://192.168.1.25:9100/metrics?token=secret',
    'http://192.168.1.25:9100/metrics#fragment',
  ];
  for (const endpoint of invalid) {
    assert.throws(() => validateNodeExporterEndpoint(endpoint), /Endpoint do Node Exporter/);
  }
});

test('blocks common cloud metadata destinations', () => {
  const blocked = [
    'http://169.254.169.254:9100/metrics',
    'http://169.254.10.20:9100/metrics',
    'http://100.100.100.200:9100/metrics',
    'http://metadata.google.internal:9100/metrics',
    'http://metadata.azure.internal:9100/metrics',
  ];
  for (const endpoint of blocked) {
    assert.throws(() => validateNodeExporterEndpoint(endpoint), /Endpoint do Node Exporter/);
  }
});
