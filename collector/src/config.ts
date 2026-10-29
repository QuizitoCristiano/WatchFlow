export const DEFAULT_NODE_EXPORTER_URL = 'http://192.168.1.2:9100/metrics';

export interface CollectorConfig {
  endpoint: URL;
  ingestUrl: URL | null;
  ingestToken: string | null;
  timeoutMs: number;
  sampleIntervalMs: number;
  collectionIntervalMs: number;
  deviceId: string;
  integrationId: string | null;
}

export class CollectorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CollectorError';
  }
}

function parsePositiveInteger(
  value: string | undefined,
  fallback: number,
  name: string,
  maximum = 86_400_000,
): number {
  if (value === undefined || value.trim() === '') return fallback;

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > maximum) {
    throw new CollectorError(`${name} deve ser um inteiro positivo de no máximo ${maximum} ms.`);
  }

  return parsed;
}

export function loadConfig(env: Readonly<Record<string, string | undefined>> = process.env): CollectorConfig {
  const endpointValue = env.NODE_EXPORTER_URL?.trim() || DEFAULT_NODE_EXPORTER_URL;
  let endpoint: URL;

  try {
    endpoint = new URL(endpointValue);
  } catch {
    throw new CollectorError('NODE_EXPORTER_URL não contém uma URL válida.');
  }

  if (endpoint.protocol !== 'http:' && endpoint.protocol !== 'https:') {
    throw new CollectorError('NODE_EXPORTER_URL deve usar HTTP ou HTTPS.');
  }
  if (endpoint.username || endpoint.password) {
    throw new CollectorError('NODE_EXPORTER_URL não deve conter credenciais.');
  }
  if (endpoint.href.length > 2048) {
    throw new CollectorError('NODE_EXPORTER_URL excede o limite de 2048 caracteres.');
  }
  if (endpoint.hash || endpoint.search) {
    throw new CollectorError('NODE_EXPORTER_URL não deve conter parâmetros ou fragmento.');
  }

  const ingestUrlValue = env.WATCHFLOW_INGEST_URL?.trim() || '';
  const ingestToken = env.WATCHFLOW_INGEST_TOKEN?.trim() || '';
  if (Boolean(ingestUrlValue) !== Boolean(ingestToken)) {
    throw new CollectorError('Configure WATCHFLOW_INGEST_URL e WATCHFLOW_INGEST_TOKEN juntos.');
  }
  let ingestUrl: URL | null = null;
  if (ingestUrlValue) {
    try {
      ingestUrl = new URL(ingestUrlValue);
    } catch {
      throw new CollectorError('WATCHFLOW_INGEST_URL não contém uma URL válida.');
    }
    const isLocalHttp = ingestUrl.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '[::1]'].includes(ingestUrl.hostname);
    if (ingestUrl.protocol !== 'https:' && !isLocalHttp) {
      throw new CollectorError('WATCHFLOW_INGEST_URL deve usar HTTPS, exceto em localhost.');
    }
    if (
      ingestUrl.username ||
      ingestUrl.password ||
      ingestUrl.hash ||
      ingestUrl.search ||
      ingestUrl.pathname !== '/api/collector/ingest' ||
      ingestUrl.href.length > 2048
    ) {
      throw new CollectorError('WATCHFLOW_INGEST_URL deve apontar para /api/collector/ingest sem credenciais, parâmetros ou fragmento.');
    }
    if (!/^[A-Za-z0-9_-]{43}$/.test(ingestToken)) {
      throw new CollectorError('WATCHFLOW_INGEST_TOKEN possui formato inválido.');
    }
  }

  const sampleIntervalMs = parsePositiveInteger(
    env.COLLECTOR_SAMPLE_INTERVAL_MS,
    1000,
    'COLLECTOR_SAMPLE_INTERVAL_MS',
  );
  const collectionIntervalMs = parsePositiveInteger(
    env.COLLECTOR_INTERVAL_MS,
    60_000,
    'COLLECTOR_INTERVAL_MS',
  );
  if (ingestUrl && collectionIntervalMs < 15_000) {
    throw new CollectorError('COLLECTOR_INTERVAL_MS deve ser de pelo menos 15000 ms com ingestão habilitada.');
  }
  const integrationId = env.WATCHFLOW_INTEGRATION_ID?.trim() || null;
  const deviceId = env.WATCHFLOW_DEVICE_ID?.trim() || endpoint.hostname;
  if (
    ingestUrl &&
    (!integrationId || !/^[A-Za-z0-9_-]{1,128}$/.test(integrationId) ||
      !/^[A-Za-z0-9_-]{1,128}$/.test(deviceId))
  ) {
    throw new CollectorError('WATCHFLOW_INTEGRATION_ID e WATCHFLOW_DEVICE_ID válidos são obrigatórios para ingestão.');
  }

  return {
    endpoint,
    ingestUrl,
    ingestToken: ingestUrl ? ingestToken : null,
    timeoutMs: parsePositiveInteger(env.NODE_EXPORTER_TIMEOUT_MS, 5000, 'NODE_EXPORTER_TIMEOUT_MS', 120_000),
    sampleIntervalMs,
    collectionIntervalMs,
    deviceId,
    integrationId,
  };
}