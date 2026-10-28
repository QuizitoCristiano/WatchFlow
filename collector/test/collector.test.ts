import assert from 'node:assert/strict';
import test from 'node:test';
import { loadConfig, CollectorError } from '../src/config.ts';
import { collectMetrics } from '../src/collect.ts';
import { fetchMetricsText } from '../src/http.ts';
import {
  calculateCpuUsagePercent,
  calculateFilesystemUsage,
  calculateMemoryUsagePercent,
  calculateNetworkUsage,
} from '../src/metrics.ts';
import { parsePrometheusText } from '../src/parser.ts';
import { postCollectorSample } from '../src/ingest.ts';
import type { CollectorSample } from '../../api/collector/_lib/contracts.ts';

const firstCpu = `
# HELP node_cpu_seconds_total Seconds the CPUs spent in each mode.
# TYPE node_cpu_seconds_total counter
node_cpu_seconds_total{mode="idle",cpu="0"} 10
node_cpu_seconds_total{cpu="0",mode="user"} 5
node_cpu_seconds_total{cpu="1",mode="user"} 2
node_cpu_seconds_total{cpu="1",mode="idle"} 8
`;

const secondCpu = `
node_cpu_seconds_total{cpu="1",mode="idle"} 9
node_cpu_seconds_total{cpu="0",mode="user"} 6
node_cpu_seconds_total{mode="user",cpu="1"} 3
node_cpu_seconds_total{cpu="0",mode="idle"} 11
node_memory_MemAvailable_bytes 25
node_memory_MemTotal_bytes 100
`;

test('parser ignores comments and blank lines and parses labels independent of order', () => {
  const parsed = parsePrometheusText(firstCpu);
  assert.equal(parsed.length, 4);
  assert.deepEqual(parsed[0].labels, { mode: 'idle', cpu: '0' });
});

test('parser ignores unrelated metrics and keeps missing metrics absent', () => {
  const parsed = parsePrometheusText('# comment\nother_metric 0\n');
  assert.deepEqual(parsed, []);
});

test('parser rejects invalid values on supported metrics', () => {
  assert.throws(
    () => parsePrometheusText('node_memory_MemTotal_bytes NaN'),
    CollectorError,
  );
});

test('parser rejects malformed supported labels', () => {
  assert.throws(
    () => parsePrometheusText('node_cpu_seconds_total{cpu="0"} 10'),
    CollectorError,
  );
});

test('memory usage is calculated from total and available bytes', () => {
  assert.equal(calculateMemoryUsagePercent(parsePrometheusText(secondCpu)), 75);
});

test('memory calculation rejects missing or incoherent values', () => {
  assert.throws(() => calculateMemoryUsagePercent([]), /ausente ou ambígua/);
  assert.throws(
    () => calculateMemoryUsagePercent(parsePrometheusText('node_memory_MemTotal_bytes 0\nnode_memory_MemAvailable_bytes 0')),
    /fora do intervalo/,
  );
});

test('filesystem usage ignores virtual filesystems and deduplicates devices', () => {
  const samples = parsePrometheusText(`
    node_filesystem_size_bytes{device="/dev/sda1",fstype="ext4",mountpoint="/"} 1000
    node_filesystem_free_bytes{device="/dev/sda1",fstype="ext4",mountpoint="/"} 250
    node_filesystem_size_bytes{device="/dev/sda1",fstype="ext4",mountpoint="/bind"} 1000
    node_filesystem_free_bytes{device="/dev/sda1",fstype="ext4",mountpoint="/bind"} 900
    node_filesystem_size_bytes{device="tmpfs",fstype="tmpfs",mountpoint="/run"} 100
    node_filesystem_free_bytes{device="tmpfs",fstype="tmpfs",mountpoint="/run"} 20
    node_filesystem_size_bytes{device="/dev/sdb1",fstype="vfat",mountpoint="/boot/efi"} 200
    node_filesystem_free_bytes{device="/dev/sdb1",fstype="vfat",mountpoint="/boot/efi"} 100
  `);
  const filesystems = calculateFilesystemUsage(samples);
  assert.equal(filesystems.length, 2);
  assert.equal(filesystems.find((filesystem) => filesystem.device === '/dev/sda1')?.mountpoint, '/');
  assert.equal(filesystems.find((filesystem) => filesystem.device === '/dev/sda1')?.usedPercent, 75);
});

test('network rates are calculated from non-loopback counter deltas', () => {
  const first = parsePrometheusText(`
    node_network_receive_bytes_total{device="eth0"} 1000
    node_network_transmit_bytes_total{device="eth0"} 2000
    node_network_receive_bytes_total{device="lo"} 5000
    node_network_transmit_bytes_total{device="lo"} 9000
  `);
  const second = parsePrometheusText(`
    node_network_receive_bytes_total{device="eth0"} 4000
    node_network_transmit_bytes_total{device="eth0"} 6000
    node_network_receive_bytes_total{device="lo"} 9000
    node_network_transmit_bytes_total{device="lo"} 12000
  `);
  assert.deepEqual(calculateNetworkUsage(first, second, 3), {
    receiveBytesTotal: 4000,
    transmitBytesTotal: 6000,
    receiveBytesPerSecond: 1000,
    transmitBytesPerSecond: 4000 / 3,
  });
});

test('CPU usage uses counter deltas aggregated across CPUs', () => {
  assert.equal(calculateCpuUsagePercent(parsePrometheusText(firstCpu), parsePrometheusText(secondCpu)), 50);
});

test('CPU calculation rejects missing, changing, and reset counters', () => {
  assert.throws(() => calculateCpuUsagePercent([], []), /insuficientes ou inconsistentes/);
  assert.throws(
    () => calculateCpuUsagePercent(parsePrometheusText(firstCpu), parsePrometheusText('node_cpu_seconds_total{cpu="0",mode="idle"} 11')),
    /insuficientes ou inconsistentes/,
  );
  assert.throws(
    () => calculateCpuUsagePercent(parsePrometheusText(firstCpu), parsePrometheusText(`
      node_cpu_seconds_total{cpu="0",mode="idle"} 9
      node_cpu_seconds_total{cpu="0",mode="user"} 6
      node_cpu_seconds_total{cpu="1",mode="idle"} 9
      node_cpu_seconds_total{cpu="1",mode="user"} 3
    `)),
    /reiniciado ou inválido/,
  );
});

test('configuration validates protocols and positive timing values', () => {
  assert.equal(loadConfig({}).endpoint.href, 'http://192.168.1.2:9100/metrics');
  assert.equal(loadConfig({}).deviceId, '192.168.1.2');
  assert.equal(loadConfig({ NODE_EXPORTER_URL: 'https://localhost:9100/metrics' }).endpoint.protocol, 'https:');
  assert.throws(() => loadConfig({ NODE_EXPORTER_URL: 'ftp://localhost/metrics' }), /HTTP ou HTTPS/);
  assert.throws(() => loadConfig({ NODE_EXPORTER_URL: 'not a URL' }), /URL válida/);
  assert.throws(() => loadConfig({ NODE_EXPORTER_URL: 'http://localhost/metrics?token=secret' }), /parâmetros/);
  assert.throws(() => loadConfig({ NODE_EXPORTER_TIMEOUT_MS: '0' }), /inteiro positivo/);
  assert.throws(() => loadConfig({
    WATCHFLOW_INGEST_URL: 'http://example.test/api/collector/ingest',
    WATCHFLOW_INGEST_TOKEN: 'A'.repeat(43),
  }), /HTTPS/);
  assert.throws(() => loadConfig({
    WATCHFLOW_INGEST_URL: 'https://watchflow.example/api/collector/ingest',
  }), /juntos/);
  assert.throws(() => loadConfig({
    WATCHFLOW_INGEST_URL: 'https://watchflow.example/other',
    WATCHFLOW_INGEST_TOKEN: 'A'.repeat(43),
    WATCHFLOW_INTEGRATION_ID: 'integration',
    WATCHFLOW_DEVICE_ID: 'node-integration',
  }), /api\/collector\/ingest/);
  assert.throws(() => loadConfig({
    WATCHFLOW_INGEST_URL: 'https://watchflow.example/api/collector/ingest',
    WATCHFLOW_INGEST_TOKEN: 'A'.repeat(43),
    WATCHFLOW_INTEGRATION_ID: 'integration',
    WATCHFLOW_DEVICE_ID: 'node-integration',
    COLLECTOR_INTERVAL_MS: '1000',
  }), /pelo menos 15000/);
  assert.equal(loadConfig({
    WATCHFLOW_INGEST_URL: 'https://watchflow.example/api/collector/ingest',
    WATCHFLOW_INGEST_TOKEN: 'A'.repeat(43),
    WATCHFLOW_INTEGRATION_ID: 'integration',
    WATCHFLOW_DEVICE_ID: 'node-integration',
  }).collectionIntervalMs, 60_000);
});

test('HTTP client rejects non-success and empty responses', async () => {
  const endpoint = new URL('http://127.0.0.1:9100/metrics');
  await assert.rejects(
    fetchMetricsText(endpoint, 100, async () => new Response('', { status: 503 })),
    /HTTP 503/,
  );
  await assert.rejects(
    fetchMetricsText(endpoint, 100, async () => new Response('  ')),
    /vazia/,
  );
});

test('HTTP client bounds request time and reports timeout without leaking response data', async () => {
  const endpoint = new URL('http://127.0.0.1:9100/metrics');
  const hangingFetch: typeof fetch = async (_input, init) => new Promise<Response>((_resolve, reject) => {
    const signal = init?.signal;
    if (!signal) throw new Error('Expected request timeout signal');
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });

  await assert.rejects(fetchMetricsText(endpoint, 5, hangingFetch), /Tempo limite de 5 ms/);
});

test('collector makes two requests and returns no partial result on failure', async () => {
  const responses = [new Response(firstCpu), new Response(secondCpu)];
  let requests = 0;
  const fakeFetch: typeof fetch = async () => {
    requests += 1;
    const response = responses.shift();
    if (!response) throw new Error('Unexpected extra request');
    return response;
  };

  const result = await collectMetrics(
    new URL('http://127.0.0.1:9100/metrics'),
    100,
    1,
    fakeFetch,
    async () => {},
  );
  assert.equal(requests, 2);
  assert.equal(result.cpuUsagePercent, 50);
  assert.equal(result.memoryUsagePercent, 75);

  let partialCalls = 0;
  await assert.rejects(
    collectMetrics(
      new URL('http://127.0.0.1:9100/metrics'),
      100,
      1,
      async () => new Response(partialCalls++ === 0 ? firstCpu : `
        node_cpu_seconds_total{cpu="0",mode="idle"} 11
        node_cpu_seconds_total{cpu="0",mode="user"} 6
        node_cpu_seconds_total{cpu="1",mode="idle"} 9
        node_cpu_seconds_total{cpu="1",mode="user"} 3
        node_memory_MemTotal_bytes 1
      `),
      async () => {},
    ),
    /Payload incompatível/,
  );
});

test('ingestion retries transient errors with the same idempotency sample ID', async () => {
  const sample: CollectorSample = {
    schemaVersion: 1,
    operation: 'success',
    sampleId: 'c0d45abc-73cd-4a46-9e83-566a990f82cc',
    integrationId: 'integration-1',
    deviceId: 'node-integration-1',
    collectedAt: new Date().toISOString(),
    cpuUsagePercent: 50,
    memoryUsagePercent: 75,
    memoryUsedBytes: 75,
    memoryTotalBytes: 100,
    filesystems: [{
      device: '/dev/sda1',
      mountpoint: '/',
      filesystemType: 'ext4',
      usedBytes: 75,
      totalBytes: 100,
      usedPercent: 75,
    }],
    network: null,
  };
  const requestBodies: string[] = [];
  const authorizationHeaders: string[] = [];
  const waits: number[] = [];
  let calls = 0;
  await postCollectorSample(
    new URL('https://watchflow.example/api/collector/ingest'),
    'A'.repeat(43),
    sample,
    100,
    async (_input, init) => {
      calls += 1;
      requestBodies.push(String(init?.body));
      authorizationHeaders.push(new Headers(init?.headers).get('authorization') ?? '');
      return new Response('', { status: calls === 1 ? 503 : 200 });
    },
    async (milliseconds) => { waits.push(milliseconds); },
  );
  assert.equal(calls, 2);
  assert.deepEqual(waits, [500]);
  assert.equal(requestBodies[0], requestBodies[1]);
  assert.equal(authorizationHeaders[0], `Bearer ${'A'.repeat(43)}`);
});

test('ingestion does not retry permanent authorization errors', async () => {
  const sample: CollectorSample = {
    schemaVersion: 1,
    operation: 'error',
    sampleId: 'c0d45abc-73cd-4a46-9e83-566a990f82cc',
    integrationId: 'integration-1',
    deviceId: 'node-integration-1',
    collectedAt: new Date().toISOString(),
    error: 'falha local',
  };
  let calls = 0;
  await assert.rejects(
    postCollectorSample(
      new URL('https://watchflow.example/api/collector/ingest'),
      'A'.repeat(43),
      sample,
      100,
      async () => {
        calls += 1;
        return new Response('', { status: 401 });
      },
      async () => {},
    ),
    /HTTP 401/,
  );
  assert.equal(calls, 1);
});