import assert from 'node:assert/strict';
import test from 'node:test';
import { getMetricSeverity } from '../collector/_lib/alertPolicy.ts';

test('metric severity stays clear below warning threshold', () => {
  assert.equal(getMetricSeverity(0), null);
  assert.equal(getMetricSeverity(79.99), null);
});

test('metric severity becomes warning at 80 percent', () => {
  assert.equal(getMetricSeverity(80), 'warning');
  assert.equal(getMetricSeverity(89.99), 'warning');
});

test('metric severity becomes critical at 90 percent', () => {
  assert.equal(getMetricSeverity(90), 'critical');
  assert.equal(getMetricSeverity(100), 'critical');
});

test('invalid metric values are rejected', () => {
  for (const value of [-0.1, 100.1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.throws(() => getMetricSeverity(value), RangeError);
  }
});
