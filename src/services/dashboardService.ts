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
import { db } from './config';

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
  // 1. Busca os KPIs Globais / Resumo da Infraestrutura
  async getSummary(userId: string): Promise<DashboardSummary> {
    try {
      if (!userId) throw new Error('Usuário não autenticado.');

      const devicesRef = collection(db, 'users', userId, 'devices');
      const devicesSnap = await getDocs(devicesRef);

      const devices = devicesSnap.docs.map(deviceDoc => ({
        id: deviceDoc.id,
        ...deviceDoc.data(),
      } as Device));
      const actualDevices = devices.filter((device) => device.isDemoData !== true);
      const metricDevices = actualDevices.length > 0 ? actualDevices : devices;
      const totalDevices = metricDevices.length;
      const average = (values: (number | undefined)[]) => {
        const availableValues = values.filter(
          (value): value is number => typeof value === 'number' && Number.isFinite(value)
        );

        return availableValues.length > 0
          ? Math.round(availableValues.reduce((total, value) => total + value, 0) / availableValues.length)
          : null;
      };
      const sum = (values: (number | undefined)[]) => {
        const availableValues = values.filter(
          (value): value is number => typeof value === 'number' && Number.isFinite(value)
        );

        return metricDevices.length > 0 && availableValues.length === metricDevices.length
          ? availableValues.reduce((total, value) => total + value, 0)
          : null;
      };

      let online = 0, warning = 0, critical = 0, offline = 0;

      metricDevices.forEach(d => {
        if (d.status === 'online') online++;
        if (d.status === 'warning') warning++;
        if (d.status === 'critical') critical++;
        if (d.status === 'offline') offline++;
      });

      return {
        avgCpuUsage: average(metricDevices.map(d => d.latestMetricsSummary?.cpu)),
        avgRamUsage: average(metricDevices.map(d => d.latestMetricsSummary?.memory)),
        ramUsedGb: sum(metricDevices.map(d => d.latestMetricsSummary?.memoryUsedGb)),
        ramTotalGb: sum(metricDevices.map(d => d.latestMetricsSummary?.memoryTotalGb)),
        avgDiskUsage: average(metricDevices.map(d => d.latestMetricsSummary?.disk)),
        diskUsedGb: sum(metricDevices.map(d => d.latestMetricsSummary?.diskUsedGb)),
        diskTotalGb: sum(metricDevices.map(d => d.latestMetricsSummary?.diskTotalGb)),
        globalSlaPercent: null,
        totalDevices,
        devicesOnline: online,
        devicesWarning: warning,
        devicesCritical: critical,
        devicesOffline: offline,
        activeAlertsCount: null,
        lastUpdatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao buscar resumo do dashboard (dispositivos do usuário):', error);
      throw error;
    }
  },

  async getActiveAlertsCount(userId: string): Promise<number> {
    if (!userId) throw new Error('Usuário não autenticado.');

    const snapshot = await getDocs(query(
      collection(db, 'alerts'),
      where('userId', '==', userId),
      where('status', '==', 'active'),
    ));
    return snapshot.size;
  },

  // 2. Busca histórico de métricas para os gráficos Recharts
  async getMetricsHistory(userId: string, devices: Device[]): Promise<DashboardMetricsResult> {
    if (!userId) throw new Error('Usuário não autenticado.');

    const metricResults = await Promise.all(devices
      .filter((device): device is Device & { id: string } => Boolean(device.id))
      .map(async (device) => {
        try {
          const snapshot = await getDocs(query(
            collection(db, 'users', userId, 'devices', device.id, 'metrics'),
            orderBy('collectedAt', 'desc'),
            limit(24),
          ));
          return { deviceId: device.id, docs: snapshot.docs, error: null };
        } catch (error) {
          return {
            deviceId: device.id,
            docs: [],
            error: error instanceof Error ? error.message : 'erro desconhecido',
          };
        }
      }));

    const allReadings = metricResults.flatMap((result) =>
      result.docs
        .map((metricDoc) => {
          const data = metricDoc.data();
          const reading = toMetricPoint(data);
          return reading ? { ...reading, data, deviceId: result.deviceId } : null;
        })
        .filter((reading): reading is NonNullable<typeof reading> => reading !== null)
    );
    const hasRealReadings = allReadings.some((reading) => reading.point.isDemoData !== true);
    const readings = allReadings.filter((reading) =>
      !hasRealReadings || reading.point.isDemoData !== true
    );
    const latestMetricsByDevice: Record<string, LatestMetricsSummary> = {};
    for (const result of metricResults) {
      const latestReading = readings
        .filter((reading) => reading.deviceId === result.deviceId)
        .sort((left, right) => right.date.getTime() - left.date.getTime())[0];
      const latest = latestReading ? toLatestMetricsSummary(latestReading.data) : undefined;
      if (latest) latestMetricsByDevice[result.deviceId] = latest;
    }

    const sortedReadings = readings
      .sort((left, right) => left.date.getTime() - right.date.getTime())
      .slice(-24);

    const history = sortedReadings.length > 0
      ? sortedReadings.map((reading) => reading.point)
      : (() => {
        const actualDevices = devices.filter((device) => device.isDemoData !== true);
        const fallbackDevices = actualDevices.length > 0 ? actualDevices : devices;
        return fallbackDevices.flatMap((device) => {
      const summary = device.latestMetricsSummary;
      const date = toDate(device.lastSeen) ?? toDate(device.updatedAt) ?? toDate(device.createdAt);
      if (!summary || !date) return [];
      const networkIn = finiteNumber(summary.networkInBytesSec);
      const networkOut = finiteNumber(summary.networkOutBytesSec);

      return [{
        timestamp: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ...(device.isDemoData === true ? { isDemoData: true } : {}),
        ...(finiteNumber(summary.cpu) === undefined ? {} : { cpu: summary.cpu }),
        ...(finiteNumber(summary.memory) === undefined ? {} : { memory: summary.memory }),
        ...(networkIn === undefined
          ? {}
          : { downloadMbps: networkIn * 8 / 1_000_000 }),
        ...(networkOut === undefined
          ? {}
          : { uploadMbps: networkOut * 8 / 1_000_000 }),
      }];
        });
      })();

    return {
      history,
      latestMetricsByDevice,
      errors: metricResults
        .filter((result) => result.error !== null)
        .map((result) => `Dispositivo ${result.deviceId}: ${result.error}`),
    };
  },

  // 3. Busca lista recente de dispositivos monitorados
  async getRecentDevices(userId: string): Promise<Device[]> {
    try {
      if (!userId) throw new Error('Usuário não autenticado.');

      const q = query(
        collection(db, 'users', userId, 'devices'),
        orderBy('lastSeen', 'desc'),
        limit(5),
      );
      const snap = await getDocs(q);
      return snap.docs.map(deviceDoc => ({
        id: deviceDoc.id,
        ...deviceDoc.data(),
      } as Device));
    } catch (error) {
      console.error('Erro ao buscar dispositivos recentes:', error);
      throw error;
    }
  },

  // 4. Busca alertas recentes
  async getRecentAlerts(userId: string): Promise<Alert[]> {
    try {
      if (!userId) throw new Error('Usuário não autenticado.');

      const q = query(
        collection(db, 'alerts'),
        where('userId', '==', userId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
    } catch (error) {
      console.error('Erro ao buscar alertas recentes do usuário:', error);
      throw error;
    }
  },

  async seedDemoData(userId: string): Promise<string | null> {
    if (!userId) throw new Error('Usuário não autenticado.');

    const deviceRef = doc(db, 'users', userId, 'devices', 'watchflow-demo-device');
    const alertRef = doc(db, 'alerts', `watchflow-demo-${userId}`);
    const now = new Date();
    const sampleValues = [
      { id: 'sample-1', minutesAgo: 20, cpu: 38, memory: 54, disk: 48, networkIn: 125_000, networkOut: 45_000 },
      { id: 'sample-2', minutesAgo: 10, cpu: 46, memory: 57, disk: 49, networkIn: 185_000, networkOut: 62_000 },
      { id: 'sample-3', minutesAgo: 0, cpu: 41, memory: 56, disk: 49, networkIn: 152_000, networkOut: 58_000 },
    ];
    const metricRefs = sampleValues.map(({ id }) =>
      doc(db, 'users', userId, 'devices', 'watchflow-demo-device', 'metrics', id)
    );

    await runTransaction(db, async (transaction) => {
      const deviceSnapshot = await transaction.get(deviceRef);
      const metricSnapshots = await Promise.all(metricRefs.map((metricRef) => transaction.get(metricRef)));
      if (deviceSnapshot.exists() && deviceSnapshot.data().isDemoData !== true) {
        throw new Error('O ID reservado para demonstração já pertence a um dispositivo existente; nenhum dado foi alterado.');
      }

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

      sampleValues.forEach((sample, index) => {
        if (metricSnapshots[index].exists()) return;

        const collectedAt = Timestamp.fromDate(new Date(now.getTime() - sample.minutesAgo * 60_000));
        transaction.set(metricRefs[index], {
          isDemoData: true,
          collectedAt,
          cpu: { usagePercent: sample.cpu },
          memory: {
            usedPercent: sample.memory,
            totalMb: 16_384,
            usedMb: 9_175,
            freeMb: 7_209,
          },
          disk: {
            usedPercent: sample.disk,
            totalGb: 256,
            usedGb: 125.44,
            freeGb: 130.56,
          },
          network: {
            bytesInSec: sample.networkIn,
            bytesOutSec: sample.networkOut,
          },
        });
      });
    });

    try {
      await runTransaction(db, async (transaction) => {
        const alertSnapshot = await transaction.get(alertRef);
        if (alertSnapshot.exists() && alertSnapshot.data().isDemoData !== true) {
          throw new Error('O ID reservado para demonstração já pertence a um alerta existente; o alerta não foi alterado.');
        }

        if (!alertSnapshot.exists()) {
          transaction.set(alertRef, {
            userId,
            deviceId: deviceRef.id,
            deviceName: 'watchflow-demo',
            deviceIp: '127.0.0.1',
            type: 'CPU_HIGH',
            severity: 'warning',
            title: 'Alerta de demonstração do Dashboard',
            description: 'Registro de demonstração criado manualmente para validar a exibição de alertas.',
            status: 'active',
            isDemoData: true,
            metricTriggered: { metric: 'CPU', value: 41, threshold: 80, operator: '>' },
            firstDetectedAt: Timestamp.fromDate(now),
            lastDetectedAt: Timestamp.fromDate(now),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else if (alertSnapshot.data().status !== 'active') {
          throw new Error('O alerta de demonstração já existe e não está ativo; ele não foi reativado.');
        }
      });
      return null;
    } catch (error) {
      return error instanceof Error ? error.message : 'Não foi possível gravar o alerta de demonstração.';
    }
  },
};