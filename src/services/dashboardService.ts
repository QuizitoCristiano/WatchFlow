import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
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
            devicesWithMetrics++;
          }
        });

        const activeAlertsCount = alertsSnap.size;
        const globalSlaPercent = totalDevices > 0 ? Number(((devicesOnline / totalDevices) * 100).toFixed(2)) : 99.98;

        return {
          totalDevices,
          devicesOnline,
          devicesWarning,
          devicesCritical,
          devicesOffline,
          activeAlertsCount,
          globalSlaPercent,
          avgCpuUsage: devicesWithMetrics > 0 ? Math.round(totalCpu / devicesWithMetrics) : 18,
          avgRamUsage: devicesWithMetrics > 0 ? Math.round(totalRam / devicesWithMetrics) : 45,
          ramUsedGb: 8,
          ramTotalGb: 16,
          avgDiskUsage: devicesWithMetrics > 0 ? Math.round(totalDisk / devicesWithMetrics) : 62,
          diskUsedGb: 500,
          diskTotalGb: 1000,
          lastUpdatedAt: new Date().toISOString() as any,
        };
      }
    } catch (e) {
      console.warn('Erro ao carregar resumo do Firestore:', e);
    }

    // Fallback Local
    const rawDevs = localStorage.getItem('wf_local_devices');
    const devs: Device[] = rawDevs ? JSON.parse(rawDevs) : [];
    const rawAlerts = localStorage.getItem('wf_local_alerts');
    const alerts: Alert[] = rawAlerts ? JSON.parse(rawAlerts) : [];

    const totalDevices = devs.length || 1;
    const devicesOnline = devs.filter(d => d.status === 'online').length || 1;
    const devicesWarning = devs.filter(d => d.status === 'warning').length;
    const devicesCritical = devs.filter(d => d.status === 'critical').length;
    const devicesOffline = totalDevices - (devicesOnline + devicesWarning + devicesCritical);
    const activeAlertsCount = alerts.filter(a => a.status === 'active').length;

    return {
      totalDevices,
      devicesOnline,
      devicesWarning,
      devicesCritical,
      devicesOffline: Math.max(0, devicesOffline),
      activeAlertsCount,
      globalSlaPercent: 99.95,
      avgCpuUsage: devs[0]?.latestMetricsSummary?.cpu ?? 24,
      avgRamUsage: devs[0]?.latestMetricsSummary?.memory ?? 58,
      ramUsedGb: devs[0]?.latestMetricsSummary?.memoryUsedGb ?? 9.2,
      ramTotalGb: devs[0]?.latestMetricsSummary?.memoryTotalGb ?? 16,
      avgDiskUsage: devs[0]?.latestMetricsSummary?.disk ?? 70,
      diskUsedGb: devs[0]?.latestMetricsSummary?.diskUsedGb ?? 700,
      diskTotalGb: devs[0]?.latestMetricsSummary?.diskTotalGb ?? 1000,
      lastUpdatedAt: new Date().toISOString() as any,
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
    const histKey = 'wf_metrics_dev-local-machine';
    const rawHist = localStorage.getItem(histKey);
    const stored = rawHist ? JSON.parse(rawHist) : [];
    const history: DashboardMetricPoint[] = stored.map((item: any) => ({
      timestamp: new Date(item.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      cpu: item.cpu?.usagePercent || 0,
      memory: item.memory?.usedPercent || 0,
      downloadMbps: 12.5,
      uploadMbps: 5.2,
    }));

    return {
      history: history.length > 0 ? history : [
        { timestamp: '10:00', cpu: 22, memory: 54, downloadMbps: 10, uploadMbps: 4 },
        { timestamp: '10:15', cpu: 35, memory: 58, downloadMbps: 14, uploadMbps: 6 },
        { timestamp: '10:30', cpu: 28, memory: 55, downloadMbps: 11, uploadMbps: 5 },
      ],
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

    const raw = localStorage.getItem('wf_local_devices');
    return raw ? JSON.parse(raw) : [];
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

    const raw = localStorage.getItem('wf_local_alerts');
    return raw ? JSON.parse(raw) : [];
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

    const raw = localStorage.getItem('wf_local_alerts');
    const list: Alert[] = raw ? JSON.parse(raw) : [];
    return list.filter(a => a.status === 'active').length;
  },

  // 6. Semeia dados de demonstração
  async seedDemoData(userId: string): Promise<string | null> {
    if (!isFirebaseConfigured || !db) return null;
    const deviceRef = doc(db, 'users', userId, 'devices', 'watchflow-demo-device');
    const alertRef = doc(db, 'alerts', `watchflow-demo-${userId}`);
    const now = new Date();

    try {
      await runTransaction(db, async (transaction) => {
        const deviceSnapshot = await transaction.get(deviceRef);
        if (!deviceSnapshot.exists()) {
          transaction.set(deviceRef, {
            userId,
            integrationId: 'demo',
            hostname: 'watchflow-demo',
            ip: '127.0.0.1',
            status: 'online',
            isDemoData: true,
            latestMetricsSummary: {
              cpu: 41,
              memory: 56,
              memoryUsedGb: 8.96,
              memoryTotalGb: 16,
              disk: 49,
              diskUsedGb: 125.44,
              diskTotalGb: 256,
              networkInBytesSec: 152_000,
              networkOutBytesSec: 58_000,
              latencyMs: 1,
            },
            lastSeen: Timestamp.fromDate(now),
            createdAt: Timestamp.fromDate(now),
            updatedAt: Timestamp.fromDate(now),
          });
        }
      });
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'Falha ao criar dados de demonstração.';
    }
  },
};
