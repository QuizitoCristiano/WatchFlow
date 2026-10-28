import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import { HttpError } from './errors.ts';
import type {
  CollectorIdentity,
  CollectorSample,
  FailedSample,
  FilesystemSample,
  NetworkSample,
  SuccessfulSample,
} from './contracts.ts';

const SAMPLE_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const FIRESTORE_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
const MAX_FILESYSTEMS = 32;
const MAX_SAFE_METRIC = Number.MAX_SAFE_INTEGER;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasExactKeys(record: JsonRecord, keys: readonly string[]): boolean {
  return Object.keys(record).every((key) => keys.includes(key)) &&
    keys.every((key) => Object.hasOwn(record, key));
}

function stringValue(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength &&
    !Array.from(value).some((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint < 32 || codePoint === 127;
    });
}

function finiteNumber(value: unknown, min = 0, max = MAX_SAFE_METRIC): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function safeInteger(value: unknown, min = 0): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= min;
}

function validateIdentityFields(
  body: JsonRecord,
  identity: CollectorIdentity,
): void {
  if (
    body.integrationId !== identity.integrationId ||
    body.deviceId !== identity.deviceId
  ) {
    throw new HttpError(403, 'A credencial não pertence a esta integração ou dispositivo.');
  }
}

function parseCollectedAt(value: unknown, now: Date): string {
  if (typeof value !== 'string') throw new HttpError(400, 'Timestamp de coleta inválido.');
  const parsed = new Date(value);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString() !== value ||
    parsed.getTime() < now.getTime() - 10 * 60_000 ||
    parsed.getTime() > now.getTime() + 60_000
  ) {
    throw new HttpError(400, 'Timestamp de coleta fora do intervalo permitido.');
  }
  return value;
}

function parseFilesystem(value: unknown): FilesystemSample | null {
  if (!isRecord(value) || !hasExactKeys(value, [
    'device', 'mountpoint', 'filesystemType', 'usedBytes', 'totalBytes', 'usedPercent',
  ])) return null;

  if (
    !stringValue(value.device, 256) ||
    !stringValue(value.mountpoint, 256) ||
    !stringValue(value.filesystemType, 64) ||
    !safeInteger(value.totalBytes, 1) ||
    !safeInteger(value.usedBytes) ||
    value.usedBytes > value.totalBytes ||
    !finiteNumber(value.usedPercent, 0, 100)
  ) return null;

  const expectedPercent = (value.usedBytes / value.totalBytes) * 100;
  if (Math.abs(value.usedPercent - expectedPercent) > 0.1) return null;
  return {
    device: value.device,
    mountpoint: value.mountpoint,
    filesystemType: value.filesystemType,
    usedBytes: value.usedBytes,
    totalBytes: value.totalBytes,
    usedPercent: value.usedPercent,
  };
}

function parseNetwork(value: unknown): NetworkSample | null | undefined {
  if (value === null) return null;
  if (!isRecord(value) || !hasExactKeys(value, [
    'receiveBytesTotal', 'transmitBytesTotal', 'receiveBytesPerSecond', 'transmitBytesPerSecond',
  ])) return undefined;
  if (
    !safeInteger(value.receiveBytesTotal) ||
    !safeInteger(value.transmitBytesTotal) ||
    !finiteNumber(value.receiveBytesPerSecond) ||
    !finiteNumber(value.transmitBytesPerSecond)
  ) return undefined;
  return {
    receiveBytesTotal: value.receiveBytesTotal,
    transmitBytesTotal: value.transmitBytesTotal,
    receiveBytesPerSecond: value.receiveBytesPerSecond,
    transmitBytesPerSecond: value.transmitBytesPerSecond,
  };
}

function sanitizeError(value: unknown): string {
  if (!stringValue(value, 500)) throw new HttpError(400, 'Mensagem de erro inválida.');
  const safe = value
    .replace(/bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(/\b(token|password|secret|api[_-]?key)\s*[=:]\s*\S+/gi, '$1=[redacted]')
    .replace(/https?:\/\/\S+/gi, '[endpoint]')
    .slice(0, 200);
  return safe || 'Falha operacional do coletor.';
}

export function parseCollectorSample(
  input: unknown,
  identity: CollectorIdentity,
  now: Date,
): CollectorSample {
  if (!isRecord(input)) throw new HttpError(400, 'Payload JSON inválido.');
  const commonKeys = ['schemaVersion', 'operation', 'sampleId', 'integrationId', 'deviceId', 'collectedAt'];
  if (
    input.schemaVersion !== 1 ||
    !stringValue(input.sampleId, 36) ||
    !SAMPLE_ID_PATTERN.test(input.sampleId) ||
    !stringValue(input.integrationId, 123) ||
    !FIRESTORE_ID_PATTERN.test(input.integrationId) ||
    !stringValue(input.deviceId, 128) ||
    !FIRESTORE_ID_PATTERN.test(input.deviceId)
  ) {
    throw new HttpError(400, 'Identidade ou versão do payload inválida.');
  }
  validateIdentityFields(input, identity);
  const collectedAt = parseCollectedAt(input.collectedAt, now);

  if (input.operation === 'error') {
    if (!hasExactKeys(input, [...commonKeys, 'error'])) {
      throw new HttpError(400, 'Formato da falha do coletor inválido.');
    }
    return {
      schemaVersion: 1,
      operation: 'error',
      sampleId: input.sampleId,
      integrationId: input.integrationId,
      deviceId: input.deviceId,
      collectedAt,
      error: sanitizeError(input.error),
    } satisfies FailedSample;
  }

  if (input.operation !== 'success' || !hasExactKeys(input, [
    ...commonKeys,
    'cpuUsagePercent',
    'memoryUsagePercent',
    'memoryUsedBytes',
    'memoryTotalBytes',
    'filesystems',
    'network',
  ])) {
    throw new HttpError(400, 'Formato da amostra de telemetria inválido.');
  }

  if (
    !finiteNumber(input.cpuUsagePercent, 0, 100) ||
    !finiteNumber(input.memoryUsagePercent, 0, 100) ||
    !safeInteger(input.memoryUsedBytes) ||
    !safeInteger(input.memoryTotalBytes, 1) ||
    input.memoryUsedBytes > input.memoryTotalBytes ||
    !Array.isArray(input.filesystems) ||
    input.filesystems.length === 0 ||
    input.filesystems.length > MAX_FILESYSTEMS
  ) {
    throw new HttpError(400, 'Valores de CPU, memória ou filesystem inválidos.');
  }
  const expectedMemoryPercent = (input.memoryUsedBytes / input.memoryTotalBytes) * 100;
  if (Math.abs(input.memoryUsagePercent - expectedMemoryPercent) > 0.1) {
    throw new HttpError(400, 'Percentual de memória não corresponde aos bytes informados.');
  }

  const filesystems = input.filesystems.map(parseFilesystem);
  if (filesystems.some((filesystem) => filesystem === null)) {
    throw new HttpError(400, 'Um ou mais filesystems possuem valores inválidos.');
  }
  const uniqueDevices = new Set(filesystems.map((filesystem) => filesystem?.device));
  if (uniqueDevices.size !== filesystems.length) {
    throw new HttpError(400, 'Payload contém filesystem duplicado.');
  }
  const diskTotalBytes = filesystems.reduce((sum, filesystem) => sum + (filesystem?.totalBytes ?? 0), 0);
  const diskUsedBytes = filesystems.reduce((sum, filesystem) => sum + (filesystem?.usedBytes ?? 0), 0);
  if (!Number.isSafeInteger(diskTotalBytes) || !Number.isSafeInteger(diskUsedBytes)) {
    throw new HttpError(400, 'Totais de filesystem excedem os limites seguros.');
  }
  const network = parseNetwork(input.network);
  if (network === undefined) throw new HttpError(400, 'Valores de rede inválidos.');

  return {
    schemaVersion: 1,
    operation: 'success',
    sampleId: input.sampleId,
    integrationId: input.integrationId,
    deviceId: input.deviceId,
    collectedAt,
    cpuUsagePercent: input.cpuUsagePercent,
    memoryUsagePercent: input.memoryUsagePercent,
    memoryUsedBytes: input.memoryUsedBytes,
    memoryTotalBytes: input.memoryTotalBytes,
    filesystems: filesystems as FilesystemSample[],
    network,
  } satisfies SuccessfulSample;
}

export function createCollectorToken(): string {
  return randomBytes(32).toString('base64url');
}

export function createSampleId(): string {
  return randomUUID();
}

export function hashCollectorToken(token: string, pepper: string): string {
  return createHmac('sha256', pepper).update(token).digest('hex');
}

export function validateProvisioningInput(input: unknown): string {
  if (!isRecord(input) || !hasExactKeys(input, ['integrationId'])) {
    throw new HttpError(400, 'Informe somente um integrationId válido.');
  }
  if (
    !stringValue(input.integrationId, 128) ||
    !FIRESTORE_ID_PATTERN.test(input.integrationId)
  ) {
    throw new HttpError(400, 'Identificador de integração inválido.');
  }
  return input.integrationId;
}
