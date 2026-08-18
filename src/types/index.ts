import { FieldValue, Timestamp } from 'firebase/firestore';

// Suporte para datas do Firebase ou strings/nativas
export type FirestoreDate = FieldValue | Timestamp | Date | string;

// ==========================================
// 1. USUÁRIO E PERFIL -> users/{userId}
// ==========================================

export type UserRole = 'admin' | 'developer' | 'operator' | 'viewer';
export type UserStatus = 'active' | 'inactive';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;  // ISO 8601 string (ex: "2026-08-18T14:00:00.000Z")
  updatedAt?: string; // ISO 8601 string
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

export interface MetricTriggered {
  metric: string;               // Ex: 'CPU', 'RAM', 'Heartbeat'
  value: number | string;       // Ex: 95.4 ou '95.4%'
  threshold: number | string;   // Ex: 90 ou '90%'
  operator: '>' | '<' | '==';
}

// Mapeamento visual para os tipos de alerta
export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  CPU_HIGH: 'Uso de CPU Elevado',
  RAM_HIGH: 'Consumo de Memória Elevado',
  DISK_HIGH: 'Capacidade de Disco Crítica',
  DEVICE_OFFLINE: 'Dispositivo Inacessível',
  INTEGRATION_DOWN: 'Coletor / Integração Offline',
};

// Mapeamento visual para status
export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  active: 'Ativo',
  acknowledged: 'Reconhecido',
  resolved: 'Resolvido',
};

export interface Alert {
  id?: string;
  userId: string;
  deviceId?: string;
  deviceName?: string;          // Facilita exibição direta na tabela sem precisar fazer N queries
  deviceIp?: string;
  integrationId?: string;
  integrationType?: IntegrationType;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  description: string;
  status: AlertStatus;
  metricTriggered: MetricTriggered;
  firstDetectedAt: FirestoreDate;
  lastDetectedAt: FirestoreDate;
  resolvedAt?: FirestoreDate | null;
  createdAt: FirestoreDate;
  updatedAt?: FirestoreDate;
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

export type ReportType = 'performance' | 'incidents' | 'availability';
export type ReportFormat = 'pdf' | 'csv';

export interface ReportScope {
  deviceId?: string;
  deviceName?: string;
}

export interface ReportPeriod {
  start: string; // ISO 8601 string
  end: string;   // ISO 8601 string
}

export interface ReportSummary {
  avgCpu?: number;
  maxCpu?: number;
  avgMemory?: number;
  maxMemory?: number;
  avgDisk?: number;
  availability?: number;
  totalAlerts?: number;
}

export interface Report {
  id?: string;
  userId: string;
  name: string;
  type: ReportType;
  format: ReportFormat;
  scope: ReportScope;
  period: ReportPeriod;
  summary: ReportSummary;
  fileUrl?: string;
  createdAt: FirestoreDate;
}






export interface NotificationPreferences {
  enabled: boolean;
  critical: boolean;
  warning: boolean;
  info: boolean;
  email: boolean;
}

export interface MonitoringPreferences {
  refreshInterval: 5 | 15 | 30 | 60 | 300;
  defaultTimeRange: '1h' | '24h' | '7d' | '30d';
}

export interface DashboardPreferences {
  cpu: boolean;
  memory: boolean;
  disk: boolean;
  network: boolean;
  availability: boolean;
  alerts: boolean;
}

export interface UserPreferences {
  language: 'pt-BR' | 'en-US';
  timezone: string;
  theme: 'system' | 'light' | 'dark';
  notifications: NotificationPreferences;
  monitoring: MonitoringPreferences;
  dashboard: DashboardPreferences;
}