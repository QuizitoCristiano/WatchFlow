import { FieldValue, Timestamp } from 'firebase/firestore';

// Suporte para datas do Firebase ou strings/nativas
export type FirestoreDate = FieldValue | Timestamp | Date | string;

// ==========================================
// 1. USUÁRIO E PERFIL -> users/{userId}
// ==========================================
export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: 'admin' | 'operator' | 'viewer';
  createdAt: FirestoreDate;
  updatedAt: FirestoreDate;
}

// ==========================================
// 2. INTEGRAÇÕES DE TELEMETRIA -> users/{userId}/integrations/{integrationId}
// ==========================================
export type IntegrationType = 'node_exporter' | 'telegraf' | 'zabbix_agent';
export type IntegrationStatus = 'online' | 'offline' | 'error' | 'syncing';

export interface Integration {
  id?: string;
  userId: string;
  name: string;
  type: IntegrationType;
  baseUrl: string; // Ex: http://192.168.0.15:9100 ou IP do Zabbix/Telegraf
  status: IntegrationStatus;
  version?: string;
  lastSync: FirestoreDate;
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
}

// ==========================================
// 3. DISPOSITIVOS DESCOBERTOS (Auto-Discovery) -> devices/{deviceId}
// ==========================================
export type DeviceStatus = 'online' | 'warning' | 'critical' | 'offline';

export interface DeviceOS {
  distro?: string;    // Ex: Ubuntu 24.04 LTS, Debian 12, CentOS 8
  kernel?: string;    // Ex: 6.8.0-40-generic
  hostname?: string;
}

export interface LatestMetricsSummary {
  cpu: number;        // Porcentagem de uso (ex: 42.5)
  memory: number;     // Porcentagem de uso (ex: 63.1)
  disk: number;       // Porcentagem de uso (ex: 71.0)
  networkInMs?: number;
  networkOutMs?: number;
}

export interface Device {
  id?: string;
  userId: string;
  integrationId: string;     // Vínculo com a integração que o descobriu
  hostname: string;          // Ex: srv-api-01
  ip: string;                // Ex: 192.168.0.10
  os?: DeviceOS;
  status: DeviceStatus;
  latestMetricsSummary?: LatestMetricsSummary;
  lastSeen: FirestoreDate;
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
}

// ==========================================
// 4. SÉRIE TEMPORAL DE MÉTRICAS -> devices/{deviceId}/metrics/{metricId}
// ==========================================
export interface CpuMetric {
  usagePercent: number;
  coresCount?: number;
  temperatureC?: number;
}

export interface MemoryMetric {
  usedPercent: number;
  totalMb?: number;
  usedMb?: number;
  freeMb?: number;
}

export interface DiskMetric {
  usedPercent: number;
  totalGb?: number;
  usedGb?: number;
  freeGb?: number;
}

export interface NetworkMetric {
  bytesInSec: number;
  bytesOutSec: number;
  packetsDropped?: number;
}

export interface MetricPayload {
  id?: string;
  collectedAt: FirestoreDate;
  cpu: CpuMetric;
  memory: MemoryMetric;
  disk: DiskMetric;
  network?: NetworkMetric;
}

// ==========================================
// 5. ALERTAS E INCIDENTES -> alerts/{alertId}
// ==========================================
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';
export type AlertType = 'CPU_HIGH' | 'RAM_HIGH' | 'DISK_HIGH' | 'DEVICE_OFFLINE' | 'INTEGRATION_DOWN';

export interface Alert {
  id?: string;
  userId: string;
  deviceId?: string;
  integrationId?: string;
  hostname?: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  valueDetected?: number | string;
  status: AlertStatus;
  createdAt: FirestoreDate;
  resolvedAt?: FirestoreDate;
}

// ==========================================
// 6. DASHBOARD & KPIS GLOBAIS
// ==========================================
export interface DashboardSummary {
  totalDevices: number;
  devicesOnline: number;
  devicesWarning: number;
  devicesCritical: number;
  devicesOffline: number;
  activeAlertsCount: number;
  globalSlaPercent: number;    // Ex: 99.85%
  avgCpuUsage: number;
  avgRamUsage: number;
}

// ==========================================
// 7. RELATÓRIOS -> reports/{reportId}
// ==========================================
export interface Report {
  id?: string;
  userId: string;
  title: string;
  periodType: 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: string;
  endDate: string;
  deviceId?: string;
  format: 'pdf' | 'csv';
  summary?: DashboardSummary;
  createdAt: FirestoreDate;
}