export interface FilesystemSample {
  device: string;
  mountpoint: string;
  filesystemType: string;
  usedBytes: number;
  totalBytes: number;
  usedPercent: number;
}

export interface NetworkSample {
  receiveBytesTotal: number;
  transmitBytesTotal: number;
  receiveBytesPerSecond: number;
  transmitBytesPerSecond: number;
}

export interface SuccessfulSample {
  schemaVersion: 1;
  operation: 'success';
  sampleId: string;
  integrationId: string;
  deviceId: string;
  collectedAt: string;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
  memoryUsedBytes: number;
  memoryTotalBytes: number;
  filesystems: FilesystemSample[];
  network: NetworkSample | null;
}

export interface FailedSample {
  schemaVersion: 1;
  operation: 'error';
  sampleId: string;
  integrationId: string;
  deviceId: string;
  collectedAt: string;
  error: string;
}

export type CollectorSample = SuccessfulSample | FailedSample;

export interface CollectorIdentity {
  userId: string;
  integrationId: string;
  deviceId: string;
}

export interface AuthenticatedCollector {
  identity: CollectorIdentity;
  tokenHash: string;
}

export interface ProvisionedCollector {
  token: string;
  deviceId: string;
}
