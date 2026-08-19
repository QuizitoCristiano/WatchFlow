import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import type { 
  DashboardSummary, 
  DashboardMetricPoint, 
  Device, 
  Alert 
} from '@/types';
import { db } from './config';

export const dashboardService = {
  // 1. Busca os KPIs Globais / Resumo da Infraestrutura
  async getSummary(): Promise<DashboardSummary> {
    try {
      const devicesRef = collection(db, 'devices');
      const alertsRef = collection(db, 'alerts');

      const [devicesSnap, alertsSnap] = await Promise.all([
        getDocs(devicesRef),
        getDocs(query(alertsRef, where('status', '==', 'active'))),
      ]);

      const devices = devicesSnap.docs.map(doc => doc.data() as Device);
      const totalDevices = devices.length;

      let online = 0, warning = 0, critical = 0, offline = 0;
      let totalCpu = 0, totalRam = 0, totalDisk = 0;

      devices.forEach(d => {
        if (d.status === 'online') online++;
        if (d.status === 'warning') warning++;
        if (d.status === 'critical') critical++;
        if (d.status === 'offline') offline++;

        if (d.latestMetricsSummary) {
          totalCpu += d.latestMetricsSummary.cpu || 0;
          totalRam += d.latestMetricsSummary.memory || 0;
          totalDisk += d.latestMetricsSummary.disk || 0;
        }
      });

      return {
        avgCpuUsage: totalDevices > 0 ? Math.round(totalCpu / totalDevices) : 0,
        avgRamUsage: totalDevices > 0 ? Math.round(totalRam / totalDevices) : 0,
        ramUsedGb: 14.4, // Pode ser calculado dinamicamente ou buscado de um agg
        ramTotalGb: 32,
        avgDiskUsage: totalDevices > 0 ? Math.round(totalDisk / totalDevices) : 0,
        diskUsedGb: 820,
        diskTotalGb: 1000,
        globalSlaPercent: 99.98,
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

  // 2. Busca histórico de métricas para os gráficos Recharts
  async getMetricsHistory(): Promise<DashboardMetricPoint[]> {
    try {
      // Exemplo retornando os pontos para os gráficos de linha/tráfego
      return [
        { timestamp: '09:00', cpu: 40, memory: 42, downloadMbps: 45, uploadMbps: 20, slaPercent: 99.99 },
        { timestamp: '10:00', cpu: 55, memory: 45, downloadMbps: 70, uploadMbps: 35, slaPercent: 99.98 },
        { timestamp: '11:00', cpu: 75, memory: 48, downloadMbps: 120, uploadMbps: 60, slaPercent: 99.98 },
        { timestamp: '12:00', cpu: 68, memory: 45, downloadMbps: 90, uploadMbps: 40, slaPercent: 99.97 },
        { timestamp: '13:00', cpu: 88, memory: 52, downloadMbps: 140, uploadMbps: 80, slaPercent: 99.85 },
        { timestamp: '14:00', cpu: 65, memory: 46, downloadMbps: 100, uploadMbps: 50, slaPercent: 99.98 },
      ];
    } catch (error) {
      console.error('Erro ao buscar histórico de métricas:', error);
      return [];
    }
  },

  // 3. Busca lista recente de dispositivos monitorados
  async getRecentDevices(): Promise<Device[]> {
    try {
      const q = query(collection(db, 'devices'), limit(5));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Device));
    } catch (error) {
      console.error('Erro ao buscar dispositivos recentes:', error);
      return [];
    }
  },

  // 4. Busca alertas recentes
  async getRecentAlerts(): Promise<Alert[]> {
    try {
      const q = query(
        collection(db, 'alerts'),
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