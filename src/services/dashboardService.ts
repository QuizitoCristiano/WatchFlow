import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import type { 
  DashboardSummary, 
  DashboardMetricPoint, 
  Device, 
  Alert 
} from '@/types';
import { db, isFirebaseConfigured } from './config';

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

        const devices = devicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Device));
        return this.calculateSummary(devices, alertsSnap.size);
      }

      // Modo Local com dados de hardware reais
      const localRaw = localStorage.getItem('wf_local_devices');
      const localDevices: Device[] = localRaw ? JSON.parse(localRaw) : [];

      if (localDevices.length === 0) {
        // Tenta buscar as métricas reais atuais da máquina
        try {
          const res = await fetch('/api/system-metrics');
          if (res.ok) {
            const sys = await res.json();
            return {
              avgCpuUsage: sys.cpu.usagePercent,
              avgRamUsage: sys.memory.usedPercent,
              ramUsedGb: sys.memory.usedGb,
              ramTotalGb: sys.memory.totalGb,
              avgDiskUsage: sys.disk.usedPercent,
              diskUsedGb: sys.disk.usedGb,
              diskTotalGb: sys.disk.totalGb,
              globalSlaPercent: 100,
              totalDevices: 1,
              devicesOnline: 1,
              devicesWarning: 0,
              devicesCritical: 0,
              devicesOffline: 0,
              activeAlertsCount: sys.cpu.usagePercent > 80 ? 1 : 0,
              lastUpdatedAt: new Date().toISOString(),
            };
          }
        } catch {
          // fallback
        }
      }

      return this.calculateSummary(localDevices, 0);
    } catch (error) {
      console.error('Erro ao buscar resumo do dashboard:', error);
      throw error;
    }
  },

  calculateSummary(devices: Device[], activeAlertsCount: number): DashboardSummary {
    const totalDevices = devices.length;
    let online = 0, warning = 0, critical = 0, offline = 0;
    let totalCpu = 0, totalRam = 0, totalDisk = 0;
    let totalRamUsedGb = 0, totalRamCapacityGb = 0;
    let totalDiskUsedGb = 0, totalDiskCapacityGb = 0;

    devices.forEach(d => {
      if (d.status === 'online') online++;
      if (d.status === 'warning') warning++;
      if (d.status === 'critical') critical++;
      if (d.status === 'offline') offline++;

      if (d.latestMetricsSummary) {
        totalCpu += d.latestMetricsSummary.cpu || 0;
        totalRam += d.latestMetricsSummary.memory || 0;
        totalDisk += d.latestMetricsSummary.disk || 0;
        totalRamUsedGb += d.latestMetricsSummary.memoryUsedGb || 0;
        totalRamCapacityGb += d.latestMetricsSummary.memoryTotalGb || 0;
        totalDiskUsedGb += d.latestMetricsSummary.diskUsedGb || 0;
        totalDiskCapacityGb += d.latestMetricsSummary.diskTotalGb || 0;
      }
    });

    return {
      avgCpuUsage: totalDevices > 0 ? Math.round(totalCpu / totalDevices) : 0,
      avgRamUsage: totalDevices > 0 ? Math.round(totalRam / totalDevices) : 0,
      ramUsedGb: Number(totalRamUsedGb.toFixed(1)),
      ramTotalGb: Number(totalRamCapacityGb.toFixed(1)),
      avgDiskUsage: totalDevices > 0 ? Math.round(totalDisk / totalDevices) : 0,
      diskUsedGb: Number(totalDiskUsedGb.toFixed(1)),
      diskTotalGb: Number(totalDiskCapacityGb.toFixed(1)),
      globalSlaPercent: totalDevices > 0 ? Number(((online / totalDevices) * 100).toFixed(2)) : 100,
      totalDevices,
      devicesOnline: online,
      devicesWarning: warning,
      devicesCritical: critical,
      devicesOffline: offline,
      activeAlertsCount,
      lastUpdatedAt: new Date().toISOString(),
    };
  },

  // 2. Histórico recente de métricas para gráficos do Dashboard
  async getMetricsHistory(userId?: string): Promise<DashboardMetricPoint[]> {
    try {
      if (isFirebaseConfigured && db && userId) {
        const devicesRef = collection(db, 'users', userId, 'devices');
        const devicesSnap = await getDocs(query(devicesRef, limit(1)));

        if (!devicesSnap.empty) {
          const firstDeviceId = devicesSnap.docs[0].id;
          const metricsRef = collection(db, 'users', userId, 'devices', firstDeviceId, 'metrics');
          const metricsSnap = await getDocs(query(metricsRef, orderBy('collectedAt', 'desc'), limit(8)));

          if (!metricsSnap.empty) {
            return metricsSnap.docs.map(d => {
              const data = d.data();
              let timeStr = '--:--';
              if (data.collectedAt && typeof data.collectedAt.toDate === 'function') {
                timeStr = data.collectedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              }
              return {
                timestamp: timeStr,
                cpu: data.cpu?.usagePercent || 0,
                memory: data.memory?.usedPercent || 0,
                downloadMbps: data.network?.bytesInSec ? Number((data.network.bytesInSec / (1024 * 1024)).toFixed(2)) : 0,
                uploadMbps: data.network?.bytesOutSec ? Number((data.network.bytesOutSec / (1024 * 1024)).toFixed(2)) : 0,
                slaPercent: 99.98,
              };
            }).reverse();
          }
        }
      }

      // Histórico local
      const histRaw = localStorage.getItem('wf_metrics_dev-local-machine');
      if (histRaw) {
        const points = JSON.parse(histRaw);
        return points.slice(-8).map((p: any) => ({
          timestamp: new Date(p.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          cpu: p.cpu?.usagePercent || 0,
          memory: p.memory?.usedPercent || 0,
          downloadMbps: 1.2,
          uploadMbps: 0.6,
          slaPercent: 100
        }));
      }

      return [];
    } catch (error) {
      console.error('Erro ao buscar histórico de métricas:', error);
      return [];
    }
  },

  async getRecentDevices(userId?: string): Promise<Device[]> {
    if (isFirebaseConfigured && db && userId) {
      const q = query(collection(db, 'users', userId, 'devices'), limit(5));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Device));
    }
    const raw = localStorage.getItem('wf_local_devices');
    return raw ? JSON.parse(raw) : [];
  },

  async getRecentAlerts(userId?: string): Promise<Alert[]> {
    if (isFirebaseConfigured && db && userId) {
      const q = query(
        collection(db, 'alerts'),
        where('userId', '==', userId),
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        limit(5)
      );
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
    }
    return [];
  },
};
