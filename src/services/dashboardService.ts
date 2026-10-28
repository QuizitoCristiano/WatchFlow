import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import type { 
  DashboardSummary, 
  DashboardMetricPoint, 
  Device, 
  Alert 
} from '@/types';
import { db } from './config';

export const dashboardService = {
  // 1. Busca os KPIs Globais / Resumo da Infraestrutura do usuário
  async getSummary(userId?: string): Promise<DashboardSummary> {
    try {
      if (!userId) {
        return {
          avgCpuUsage: 0,
          avgRamUsage: 0,
          ramUsedGb: 0,
          ramTotalGb: 0,
          avgDiskUsage: 0,
          diskUsedGb: 0,
          diskTotalGb: 0,
          globalSlaPercent: 100,
          totalDevices: 0,
          devicesOnline: 0,
          devicesWarning: 0,
          devicesCritical: 0,
          devicesOffline: 0,
          activeAlertsCount: 0,
          lastUpdatedAt: new Date().toISOString(),
        };
      }

      const devicesRef = collection(db, 'users', userId, 'devices');
      const alertsRef = collection(db, 'alerts');

      const [devicesSnap, alertsSnap] = await Promise.all([
        getDocs(devicesRef),
        getDocs(query(alertsRef, where('userId', '==', userId), where('status', '==', 'active'))),
      ]);

      const devices = devicesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Device));
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
        activeAlertsCount: alertsSnap.size,
        lastUpdatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao buscar resumo do dashboard:', error);
      throw error;
    }
  },

  // 2. Busca histórico recente de métricas agregado dos dispositivos
  async getMetricsHistory(userId?: string): Promise<DashboardMetricPoint[]> {
    try {
      if (!userId) return [];

      const devicesRef = collection(db, 'users', userId, 'devices');
      const devicesSnap = await getDocs(query(devicesRef, limit(1)));

      if (devicesSnap.empty) {
        return [];
      }

      const firstDeviceId = devicesSnap.docs[0].id;
      const metricsRef = collection(db, 'users', userId, 'devices', firstDeviceId, 'metrics');
      const metricsSnap = await getDocs(query(metricsRef, orderBy('collectedAt', 'desc'), limit(8)));

      if (metricsSnap.empty) {
        return [];
      }

      const points: DashboardMetricPoint[] = metricsSnap.docs.map(d => {
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
      });

      return points.reverse();
    } catch (error) {
      console.error('Erro ao buscar histórico de métricas:', error);
      return [];
    }
  },

  // 3. Busca lista recente de dispositivos monitorados do usuário
  async getRecentDevices(userId?: string): Promise<Device[]> {
    try {
      if (!userId) return [];
      const q = query(collection(db, 'users', userId, 'devices'), limit(5));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Device));
    } catch (error) {
      console.error('Erro ao buscar dispositivos recentes:', error);
      return [];
    }
  },

  // 4. Busca alertas recentes do usuário
  async getRecentAlerts(userId?: string): Promise<Alert[]> {
    try {
      if (!userId) return [];
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
      console.error('Erro ao buscar alertas recentes:', error);
      return [];
    }
  },
};
