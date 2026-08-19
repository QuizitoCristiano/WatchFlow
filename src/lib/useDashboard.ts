import { useState, useEffect } from 'react';
import type { Alert, DashboardMetricPoint, DashboardSummary, Device } from '@/types';
import { dashboardService } from '@/services/dashboardService';

export const useDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<DashboardMetricPoint[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const [summaryData, historyData, devicesData, alertsData] = await Promise.all([
          dashboardService.getSummary(),
          dashboardService.getMetricsHistory(),
          dashboardService.getRecentDevices(),
          dashboardService.getRecentAlerts(),
        ]);

        setSummary(summaryData);
        setMetricsHistory(historyData);
        setDevices(devicesData);
        setAlerts(alertsData);
      } catch (error) {
        console.error("Erro ao carregar dados do Dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  return { summary, metricsHistory, devices, alerts, loading };
};