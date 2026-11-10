import { CollectorError } from './config.ts';
import type { MetricSample } from './parser.ts';

const CPU_METRIC = 'node_cpu_seconds_total';
const MEMORY_TOTAL_METRIC = 'node_memory_MemTotal_bytes';
const MEMORY_AVAILABLE_METRIC = 'node_memory_MemAvailable_bytes';
const DUPLICATED_GUEST_MODES = new Set(['guest', 'guest_nice']);
const EXCLUDED_FILESYSTEM_TYPES = new Set([
  'autofs', 'cgroup', 'cgroup2', 'configfs', 'debugfs', 'devpts', 'devtmpfs', 'tmpfs',
  'fusectl', 'mqueue', 'overlay', 'proc', 'pstore', 'rpc_pipefs', 'securityfs',
  'squashfs', 'sysfs', 'tracefs', 'ramfs',
]);

function getSingleValue(samples: readonly MetricSample[], name: string): number {
  const values = samples.filter((sample) => sample.name === name);
  if (values.length !== 1) {
    throw new CollectorError(`Payload incompatível: métrica obrigatória ausente ou ambígua (${name}).`);
  }
  return values[0].value;
}

export function calculateMemoryUsagePercent(samples: readonly MetricSample[]): number {
  const total = getSingleValue(samples, MEMORY_TOTAL_METRIC);
  const available = getSingleValue(samples, MEMORY_AVAILABLE_METRIC);

  if (total <= 0 || available < 0 || available > total) {
    throw new CollectorError('Valores de memória fora do intervalo esperado.');
  }

  const percentage = ((total - available) / total) * 100;
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new CollectorError('Não foi possível calcular o uso de memória.');
  }

  return percentage;
}

function getCpuCounters(samples: readonly MetricSample[]): Map<string, number> {
  const counters = new Map<string, number>();
  for (const sample of samples) {
    if (sample.name !== CPU_METRIC) continue;
    const cpu = sample.labels.cpu;
    const mode = sample.labels.mode;
    if (cpu === undefined || mode === undefined) {
      throw new CollectorError('Série de CPU sem os rótulos cpu e mode.');
    }
    counters.set(`${cpu}\u0000${mode}`, sample.value);
  }
  return counters;
}

export function calculateCpuUsagePercent(
  firstSample: readonly MetricSample[],
  secondSample: readonly MetricSample[],
): number {
  const firstCounters = getCpuCounters(firstSample);
  const secondCounters = getCpuCounters(secondSample);
  if (firstCounters.size === 0 || firstCounters.size !== secondCounters.size) {
    throw new CollectorError('Amostras de CPU insuficientes ou inconsistentes.');
  }

  const firstKeys = new Set(firstCounters.keys());
  for (const key of secondCounters.keys()) {
    if (!firstKeys.has(key)) throw new CollectorError('Séries de CPU mudaram entre as amostras.');
  }

  const cpuIds = new Set<string>();
  const modesByCpu = new Map<string, Set<string>>();
  let totalDelta = 0;
  let idleDelta = 0;

  for (const sample of secondSample) {
    if (sample.name !== CPU_METRIC) continue;
    const cpu = sample.labels.cpu;
    const mode = sample.labels.mode;
    if (cpu === undefined || mode === undefined) continue;

    cpuIds.add(cpu);
    const modes = modesByCpu.get(cpu) ?? new Set<string>();
    modes.add(mode);
    modesByCpu.set(cpu, modes);

    const key = `${cpu}\u0000${mode}`;
    const previousValue = firstCounters.get(key);
    if (previousValue === undefined) throw new CollectorError('Amostras de CPU inconsistentes.');
    const delta = sample.value - previousValue;
    if (!Number.isFinite(delta) || delta < 0) {
      throw new CollectorError('Contador de CPU reiniciado ou inválido entre as amostras.');
    }

    if (mode === 'idle') {
      idleDelta += delta;
    } else if (!DUPLICATED_GUEST_MODES.has(mode)) {
      totalDelta += delta;
    }
  }

  if (cpuIds.size === 0 || [...cpuIds].some((cpu) => !modesByCpu.get(cpu)?.has('idle'))) {
    throw new CollectorError('Métrica idle ausente para uma ou mais CPUs.');
  }

  totalDelta += idleDelta;
  if (!Number.isFinite(totalDelta) || totalDelta <= 0 || idleDelta > totalDelta) {
    throw new CollectorError('Deltas de CPU insuficientes ou inválidos.');
  }

  const percentage = ((totalDelta - idleDelta) / totalDelta) * 100;
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new CollectorError('Não foi possível calcular o uso de CPU.');
  }

  return percentage;
}

export interface FilesystemUsage {
  device: string;
  mountpoint: string;
  filesystemType: string;
  usedBytes: number;
  totalBytes: number;
  usedPercent: number;
}

function chooseFilesystemMountpoint(left: FilesystemUsage, right: FilesystemUsage): FilesystemUsage {
  if (left.mountpoint === '/') return left;
  if (right.mountpoint === '/') return right;
  return left.mountpoint.length <= right.mountpoint.length ? left : right;
}

export function calculateFilesystemUsage(samples: readonly MetricSample[]): FilesystemUsage[] {
  const sizes = new Map<string, number>();
  const free = new Map<string, number>();
  const deviceErrors = new Map<string, number>();

  for (const sample of samples) {
    const identity = `${sample.labels.device}\u0000${sample.labels.fstype}\u0000${sample.labels.mountpoint}`;
    if (sample.name === 'node_filesystem_size_bytes') sizes.set(identity, sample.value);
    if (sample.name === 'node_filesystem_free_bytes') free.set(identity, sample.value);
    if (sample.name === 'node_filesystem_device_error') deviceErrors.set(identity, sample.value);
  }

  const byDevice = new Map<string, FilesystemUsage>();
  for (const [identity, totalBytes] of sizes) {
    const [device, filesystemType, mountpoint] = identity.split('\u0000');
    const freeBytes = free.get(identity);
    if (
      !device ||
      !filesystemType ||
      !mountpoint ||
      EXCLUDED_FILESYSTEM_TYPES.has(filesystemType) ||
      EXCLUDED_FILESYSTEM_TYPES.has(filesystemType.trim()) ||
      deviceErrors.get(identity) === 1 ||
      !Number.isFinite(totalBytes) ||
      totalBytes <= 0 ||
      freeBytes === undefined ||
      freeBytes < 0 ||
      freeBytes > totalBytes ||
      mountpoint.startsWith('/proc/') ||
      mountpoint.startsWith('/sys/') ||
      mountpoint.startsWith('/dev/') ||
      mountpoint.startsWith('/run/')
    ) {
      continue;
    }

    const candidate: FilesystemUsage = {
      device,
      mountpoint,
      filesystemType,
      usedBytes: totalBytes - freeBytes,
      totalBytes,
      usedPercent: ((totalBytes - freeBytes) / totalBytes) * 100,
    };
    const previous = byDevice.get(device);
    byDevice.set(device, previous ? chooseFilesystemMountpoint(previous, candidate) : candidate);
  }

  return [...byDevice.values()];
}

export interface NetworkUsage {
  receiveBytesTotal: number;
  transmitBytesTotal: number;
  receiveBytesPerSecond: number;
  transmitBytesPerSecond: number;
}

function getNetworkCounters(samples: readonly MetricSample[], name: string): Map<string, number> {
  const counters = new Map<string, number>();
  for (const sample of samples) {
    if (sample.name !== name || sample.labels.device === 'lo') continue;
    counters.set(sample.labels.device, sample.value);
  }
  return counters;
}

function sumCounters(counters: Map<string, number>): number {
  return [...counters.values()].reduce((total, value) => total + value, 0);
}

function calculateCounterRate(
  first: Map<string, number>,
  second: Map<string, number>,
  intervalSeconds: number,
): number {
  if (!Number.isFinite(intervalSeconds) || intervalSeconds <= 0) {
    throw new CollectorError('Intervalo inválido para cálculo de taxa de rede.');
  }

  let delta = 0;
  let matched = 0;
  for (const [device, current] of second) {
    const previous = first.get(device);
    if (previous === undefined || current < previous) continue;
    delta += current - previous;
    matched += 1;
  }
  return matched > 0 ? delta / intervalSeconds : 0;
}

export function calculateNetworkUsage(
  firstSample: readonly MetricSample[],
  secondSample: readonly MetricSample[],
  intervalSeconds: number,
): NetworkUsage | null {
  const receiveFirst = getNetworkCounters(firstSample, 'node_network_receive_bytes_total');
  const receiveSecond = getNetworkCounters(secondSample, 'node_network_receive_bytes_total');
  const transmitFirst = getNetworkCounters(firstSample, 'node_network_transmit_bytes_total');
  const transmitSecond = getNetworkCounters(secondSample, 'node_network_transmit_bytes_total');
  if (receiveSecond.size === 0 || transmitSecond.size === 0) return null;

  return {
    receiveBytesTotal: sumCounters(receiveSecond),
    transmitBytesTotal: sumCounters(transmitSecond),
    receiveBytesPerSecond: calculateCounterRate(receiveFirst, receiveSecond, intervalSeconds),
    transmitBytesPerSecond: calculateCounterRate(transmitFirst, transmitSecond, intervalSeconds),
  };
}

export interface CollectedMetrics {
  schemaVersion: 1;
  operation: 'success';
  deviceId: string;
  collectedAt: string;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  filesystems: FilesystemUsage[];
  network: NetworkUsage | null;
}

export function calculateMetrics(
  firstSample: readonly MetricSample[],
  secondSample: readonly MetricSample[],
  collectedAt = new Date().toISOString(),
  deviceId = 'node-exporter',
  intervalSeconds = 1,
): CollectedMetrics {
  const memoryTotalBytes = getSingleValue(secondSample, MEMORY_TOTAL_METRIC);
  const memoryAvailableBytes = getSingleValue(secondSample, MEMORY_AVAILABLE_METRIC);
  return {
    schemaVersion: 1,
    operation: 'success',
    deviceId,
    collectedAt,
    cpuUsagePercent: calculateCpuUsagePercent(firstSample, secondSample),
    memoryUsagePercent: calculateMemoryUsagePercent(secondSample),
    memoryUsedBytes: memoryTotalBytes - memoryAvailableBytes,
    memoryTotalBytes,
    filesystems: calculateFilesystemUsage(secondSample),
    network: calculateNetworkUsage(firstSample, secondSample, intervalSeconds),
  };
}