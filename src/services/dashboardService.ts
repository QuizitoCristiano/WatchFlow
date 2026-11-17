import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import type { 
  DashboardSummary, 
  DashboardMetricPoint, 
  Device, 
  Alert,
  LatestMetricsSummary,
} from '@/types';
import { db, isFirebaseConfigured } from './config';

type FirestoreRecord = Record<string, unknown>;

export interface DashboardMetricsResult {
  history: DashboardMetricPoint[];
  latestMetricsByDevice: Record<string, LatestMetricsSummary>;
  errors: string[];
}

const asRecord = (value: unknown): FirestoreRecord | null =>
  typeof value === 'object' && value !== null
    ? value as FirestoreRecord
    : null;

const finiteNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const metricValue = (data: FirestoreRecord, group: string, field: string): number | undefined => {
  const nested = asRecord(data[group]);
  return finiteNumber(nested?.[field]) ?? finiteNumber(data[group]);
};

const toDate = (value: unknown): Date | null => {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date && Number.isFinite(value.getTime())) return value;
  if (typeof value === 'string') {
    const date = new Date(value);
    return Number.isFinite(date.getTime()) ? date : null;
  }
  return null;
};

const toLatestMetricsSummary = (data: FirestoreRecord): LatestMetricsSummary | undefined => {
  const memory = asRecord(data.memory);
  const disk = asRecord(data.disk);
  const summary: LatestMetricsSummary = {};
  const cpu = metricValue(data, 'cpu', 'usagePercent');
  const memoryPercent = metricValue(data, 'memory', 'usedPercent');
  const diskPercent = metricValue(data, 'disk', 'usedPercent');
  const memoryUsedMb = finiteNumber(memory?.usedMb);
  const memoryTotalMb = finiteNumber(memory?.totalMb);
  const diskUsedGb = finiteNumber(disk?.usedGb);
  const diskTotalGb = finiteNumber(disk?.totalGb);
  const network = asRecord(data.network);

  if (cpu !== undefined) summary.cpu = cpu;
  if (memoryPercent !== undefined) summary.memory = memoryPercent;
  if (diskPercent !== undefined) summary.disk = diskPercent;

  if (cpu === undefined && memoryPercent === undefined && diskPercent === undefined &&
      memoryUsedMb === undefined && memoryTotalMb === undefined &&
      diskUsedGb === undefined && diskTotalGb === undefined) {
    return undefined;
  }

  if (memoryUsedMb !== undefined) summary.memoryUsedGb = memoryUsedMb / 1024;
  if (memoryTotalMb !== undefined) summary.memoryTotalGb = memoryTotalMb / 1024;
  if (diskUsedGb !== undefined) summary.diskUsedGb = diskUsedGb;
  if (diskTotalGb !== undefined) summary.diskTotalGb = diskTotalGb;
  const networkIn = finiteNumber(network?.bytesInSec);
  const networkOut = finiteNumber(network?.bytesOutSec);
  if (networkIn !== undefined) summary.networkInBytesSec = networkIn;
  if (networkOut !== undefined) summary.networkOutBytesSec = networkOut;

  return summary;
};

const toMetricPoint = (data: FirestoreRecord): { date: Date; point: DashboardMetricPoint } | null => {
  const date = toDate(data.collectedAt);
  if (!date) return null;

  const cpu = metricValue(data, 'cpu', 'usagePercent');
  const memory = metricValue(data, 'memory', 'usedPercent');
  const downloadBytes = finiteNumber(asRecord(data.network)?.bytesInSec);
  const uploadBytes = finiteNumber(asRecord(data.network)?.bytesOutSec);
  const point: DashboardMetricPoint = {
    timestamp: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isDemoData: data.isDemoData === true,
    ...(cpu === undefined ? {} : { cpu }),
    ...(memory === undefined ? {} : { memory }),
    ...(downloadBytes === undefined ? {} : { downloadMbps: downloadBytes * 8 / 1_000_000 }),
    ...(uploadBytes === undefined ? {} : { uploadMbps: uploadBytes * 8 / 1_000_000 }),
  };
  return cpu !== undefined || memory !== undefined ||
    downloadBytes !== undefined || uploadBytes !== undefined
    ? { date, point }
    : null;
};

export const dashboardService = {
  // 1. Busca os KPIs Globais / Resumo da Infraestrutura do usuário
  async getSummary(userId?: string): Promise<DashboardSummary> {
    try {
      if (isFirebaseConfigured && db && userId) {
        const devicesRef = collection(db, 'users', userId, 'devices');
        const alertsRef = collection(db, 'alerts');

        const [devicesSnap, alertsSnap] = await Promise.all([
          getDocs(devicesRef),
          getDocs(query(alertsRef, where('userId', '==', userId), where('status', '==', 'active'))),
        ]);

        const totalDevices = devicesSnap.size;
        let devicesOnline = 0;
        let devicesWarning = 0;
        let devicesCritical = 0;
        let devicesOffline = 0;
        let totalCpu = 0;
        let totalRam = 0;
        let totalDisk = 0;
        let totalMemoryUsedGb = 0;
        let totalMemoryTotalGb = 0;
        let totalDiskUsedGb = 0;
        let totalDiskTotalGb = 0;
        let devicesWithMetrics = 0;

        devicesSnap.forEach(docSnap => {
          const d = docSnap.data() as Device;
          if (d.status === 'online') devicesOnline++;
          else if (d.status === 'warning') devicesWarning++;
          else if (d.status === 'critical') devicesCritical++;
          else devicesOffline++;

          if (d.latestMetricsSummary) {
            totalCpu += d.latestMetricsSummary.cpu || 0;
            totalRam += d.latestMetricsSummary.memory || 0;
            totalDisk += d.latestMetricsSummary.disk || 0;
            totalMemoryUsedGb += d.latestMetricsSummary.memoryUsedGb || 0;
            totalMemoryTotalGb += d.latestMetricsSummary.memoryTotalGb || 0;
            totalDiskUsedGb += d.latestMetricsSummary.diskUsedGb || 0;
            totalDiskTotalGb += d.latestMetricsSummary.diskTotalGb || 0;
            devicesWithMetrics++;
          }
        });

        const activeAlertsCount = alertsSnap.size;
        // This is a current availability ratio, not a historical SLA calculation.
        const globalSlaPercent = totalDevices > 0 ? Number(((devicesOnline / totalDevices) * 100).toFixed(2)) : null;

        return {
          totalDevices,
          devicesOnline,
          devicesWarning,
          devicesCritical,
          devicesOffline,
          activeAlertsCount,
          globalSlaPercent,
          avgCpuUsage: devicesWithMetrics > 0 ? Math.round(totalCpu / devicesWithMetrics) : null,
          avgRamUsage: devicesWithMetrics > 0 ? Math.round(totalRam / devicesWithMetrics) : null,
          ramUsedGb: devicesWithMetrics > 0 ? Number(totalMemoryUsedGb.toFixed(2)) : null,
          ramTotalGb: devicesWithMetrics > 0 ? Number(totalMemoryTotalGb.toFixed(2)) : null,
          avgDiskUsage: devicesWithMetrics > 0 ? Math.round(totalDisk / devicesWithMetrics) : null,
          diskUsedGb: devicesWithMetrics > 0 ? Number(totalDiskUsedGb.toFixed(2)) : null,
          diskTotalGb: devicesWithMetrics > 0 ? Number(totalDiskTotalGb.toFixed(2)) : null,
          lastUpdatedAt: new Date().toISOString(),
        };
      }
    } catch (e) {
      console.warn('Erro ao carregar resumo do Firestore:', e);
    }

    // Fallback Local
    const rawDevs = userId ? localStorage.getItem(`wf_local_devices:${userId}`) : null;
    const devs: Device[] = rawDevs ? (JSON.parse(rawDevs) as Device[]).filter((device) => device.userId === userId) : [];
    const rawAlerts = userId ? localStorage.getItem(`wf_local_alerts:${userId}`) : null;
    const alerts: Alert[] = rawAlerts ? (JSON.parse(rawAlerts) as Alert[]).filter((alert) => alert.userId === userId) : [];

    const totalDevices = devs.length;
    const devicesOnline = devs.filter(d => d.status === 'online').length;
    const devicesWarning = devs.filter(d => d.status === 'warning').length;
    const devicesCritical = devs.filter(d => d.status === 'critical').length;
    const devicesOffline = totalDevices - (devicesOnline + devicesWarning + devicesCritical);
    const activeAlertsCount = alerts.filter(a => a.status === 'active').length;

    const devicesWithMetrics = devs.filter((device) => device.latestMetricsSummary);
    const average = (values: Array<number | undefined>): number | null => {
      const available = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
      return available.length ? Math.round(available.reduce((sum, value) => sum + value, 0) / available.length) : null;
    };
    const sum = (values: Array<number | undefined>): number | null => {
      const available = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
      return available.length ? Number(available.reduce((total, value) => total + value, 0).toFixed(2)) : null;
    };

    return {
      totalDevices,
      devicesOnline,
      devicesWarning,
      devicesCritical,
      devicesOffline: Math.max(0, devicesOffline),
      activeAlertsCount,
      globalSlaPercent: totalDevices > 0 ? Number(((devicesOnline / totalDevices) * 100).toFixed(2)) : null,
      avgCpuUsage: average(devicesWithMetrics.map((device) => device.latestMetricsSummary?.cpu)),
      avgRamUsage: average(devicesWithMetrics.map((device) => device.latestMetricsSummary?.memory)),
      ramUsedGb: sum(devicesWithMetrics.map((device) => device.latestMetricsSummary?.memoryUsedGb)),
      ramTotalGb: sum(devicesWithMetrics.map((device) => device.latestMetricsSummary?.memoryTotalGb)),
      avgDiskUsage: average(devicesWithMetrics.map((device) => device.latestMetricsSummary?.disk)),
      diskUsedGb: sum(devicesWithMetrics.map((device) => device.latestMetricsSummary?.diskUsedGb)),
      diskTotalGb: sum(devicesWithMetrics.map((device) => device.latestMetricsSummary?.diskTotalGb)),
      lastUpdatedAt: new Date().toISOString(),
    };
  },

  // 2. Busca o histórico de métricas para o gráfico temporal da home
  async getMetricsHistory(
    userId?: string, 
    storedDevices?: Device[]
  ): Promise<DashboardMetricsResult> {
    if (isFirebaseConfigured && db && userId && storedDevices && storedDevices.length > 0) {
      const history: DashboardMetricPoint[] = [];
      const latestMetricsByDevice: Record<string, LatestMetricsSummary> = {};
      const errors: string[] = [];

      for (const dev of storedDevices.slice(0, 5)) {
        if (!dev.id) continue;
        try {
          const mRef = collection(db, 'users', userId, 'devices', dev.id, 'metrics');
          const q = query(mRef, orderBy('collectedAt', 'desc'), limit(12));
          const snap = await getDocs(q);
          const docs = snap.docs.reverse();

          if (docs.length > 0) {
            const latest = toLatestMetricsSummary(docs[docs.length - 1].data());
            if (latest) latestMetricsByDevice[dev.id] = latest;
          }

          docs.forEach(docSnap => {
            const parsed = toMetricPoint(docSnap.data());
            if (parsed) history.push(parsed.point);
          });
        } catch (err) {
          errors.push(err instanceof Error ? err.message : String(err));
        }
      }

      return { history, latestMetricsByDevice, errors };
    }

    // Fallback Local
    const histKey = userId ? `wf_metrics:${userId}:dev-local-machine` : '';
    const rawHist = histKey ? localStorage.getItem(histKey) : null;
    const stored: unknown = rawHist ? JSON.parse(rawHist) : [];
    const history: DashboardMetricPoint[] = Array.isArray(stored)
      ? stored.flatMap((item): DashboardMetricPoint[] => {
          const record = asRecord(item);
          const date = record ? toDate(record.collectedAt) : null;
          if (!record || !date) return [];
          const cpu = metricValue(record, 'cpu', 'usagePercent');
          const memory = metricValue(record, 'memory', 'usedPercent');
          const network = asRecord(record.network);
          const downloadBytes = finiteNumber(network?.bytesInSec);
          const uploadBytes = finiteNumber(network?.bytesOutSec);
          return [{
            timestamp: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            ...(cpu === undefined ? {} : { cpu }),
            ...(memory === undefined ? {} : { memory }),
            ...(downloadBytes === undefined ? {} : { downloadMbps: downloadBytes * 8 / 1_000_000 }),
            ...(uploadBytes === undefined ? {} : { uploadMbps: uploadBytes * 8 / 1_000_000 }),
          }];
        })
      : [];

    return {
      history,
      latestMetricsByDevice: {},
      errors: [],
    };
  },

  // 3. Busca lista dos dispositivos recentes do usuário
  async getRecentDevices(userId?: string): Promise<Device[]> {
    if (isFirebaseConfigured && db && userId) {
      try {
        const q = query(collection(db, 'users', userId, 'devices'), orderBy('lastSeen', 'desc'), limit(5));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Device));
      } catch (e) {
        console.warn('Erro ao carregar dispositivos do Firestore:', e);
      }
    }

    const raw = userId ? localStorage.getItem(`wf_local_devices:${userId}`) : null;
    return raw ? (JSON.parse(raw) as Device[]).filter((device) => device.userId === userId) : [];
  },

  // 4. Busca os alertas recentes
  async getRecentAlerts(userId?: string): Promise<Alert[]> {
    if (isFirebaseConfigured && db && userId) {
      try {
        const q = query(
          collection(db, 'alerts'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
      } catch (e) {
        console.warn('Erro ao carregar alertas do Firestore:', e);
      }
    }

    const raw = userId ? localStorage.getItem(`wf_local_alerts:${userId}`) : null;
    return raw ? (JSON.parse(raw) as Alert[]).filter((alert) => alert.userId === userId) : [];
  },

  // 5. Contagem de alertas ativos
  async getActiveAlertsCount(userId?: string): Promise<number> {
    if (isFirebaseConfigured && db && userId) {
      try {
        const q = query(
          collection(db, 'alerts'),
          where('userId', '==', userId),
          where('status', '==', 'active')
        );
        const snap = await getDocs(q);
        return snap.size;
      } catch (e) {
        console.warn(e);
      }
    }

    const raw = userId ? localStorage.getItem(`wf_local_alerts:${userId}`) : null;
    const list: Alert[] = raw ? (JSON.parse(raw) as Alert[]).filter((alert) => alert.userId === userId) : [];
    return list.filter(a => a.status === 'active').length;
  },

};
