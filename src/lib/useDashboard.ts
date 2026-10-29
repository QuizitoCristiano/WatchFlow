import { useState, useEffect } from 'react';
import type { Alert, DashboardMetricPoint, DashboardSummary, Device } from '@/types';
import { dashboardService } from '@/services/dashboardService';
import { useAuth } from '@/contexts/useAuth';

export const useDashboard = () => {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.uid ?? null;
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [isSeedingDemo, setIsSeedingDemo] = useState(false);
  const [seedDemoError, setSeedDemoError] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<{
    userId: string;
    version: number;
    summary: DashboardSummary | null;
    metricsHistory: DashboardMetricPoint[];
    devices: Device[];
    alerts: Alert[];
    error: string | null;
  } | null>(null);

  useEffect(() => {
    let active = true;

    if (authLoading || !userId) {
      return () => {
        active = false;
      };
    }

    void (async () => {
      const [summaryResult, devicesResult, alertsResult, alertCountResult] = await Promise.allSettled([
        dashboardService.getSummary(userId),
        dashboardService.getRecentDevices(userId),
        dashboardService.getRecentAlerts(userId),
        dashboardService.getActiveAlertsCount(userId),
      ]);
      const storedDevices = devicesResult.status === 'fulfilled' ? devicesResult.value : [];
      let metricData: Awaited<ReturnType<typeof dashboardService.getMetricsHistory>> = {
        history: [],
        latestMetricsByDevice: {},
        errors: [],
      };
      let metricsError: unknown = null;

      if (devicesResult.status === 'fulfilled') {
        try {
          metricData = await dashboardService.getMetricsHistory(userId, storedDevices);
        } catch (loadError) {
          metricsError = loadError;
        }
      }

      if (!active) return;

      const devices = storedDevices.map((device) => {
        const metricSummary = device.id ? metricData.latestMetricsByDevice[device.id] : undefined;
        return metricSummary
          ? { ...device, latestMetricsSummary: { ...metricSummary, ...device.latestMetricsSummary } }
          : device;
      });
      const baseSummary = summaryResult.status === 'fulfilled' ? summaryResult.value : null;
      const actualDevices = devices.filter((device) => device.isDemoData !== true);
      const summaryDevices = actualDevices.length > 0 ? actualDevices : devices;
      const average = (values: (number | undefined)[], fallback: number | null): number | null => {
        if (fallback !== null) return fallback;
        if (baseSummary && baseSummary.totalDevices > summaryDevices.length) return null;

        const available = values.filter(
          (value): value is number => typeof value === 'number' && Number.isFinite(value)
        );
        return available.length > 0
          ? Math.round(available.reduce((total, value) => total + value, 0) / available.length)
          : null;
      };
      const sum = (values: (number | undefined)[], fallback: number | null): number | null => {
        if (fallback !== null) return fallback;
        if (baseSummary && baseSummary.totalDevices > summaryDevices.length) return null;

        const available = values.filter(
          (value): value is number => typeof value === 'number' && Number.isFinite(value)
        );
        return summaryDevices.length > 0 && available.length === summaryDevices.length
          ? available.reduce((total, value) => total + value, 0)
          : null;
      };
      const summary = baseSummary
        ? {
            ...baseSummary,
            activeAlertsCount: alertCountResult.status === 'fulfilled' ? alertCountResult.value : null,
            avgCpuUsage: average(summaryDevices.map(device => device.latestMetricsSummary?.cpu), baseSummary.avgCpuUsage),
            avgRamUsage: average(summaryDevices.map(device => device.latestMetricsSummary?.memory), baseSummary.avgRamUsage),
            ramUsedGb: sum(summaryDevices.map(device => device.latestMetricsSummary?.memoryUsedGb), baseSummary.ramUsedGb),
            ramTotalGb: sum(summaryDevices.map(device => device.latestMetricsSummary?.memoryTotalGb), baseSummary.ramTotalGb),
            avgDiskUsage: average(summaryDevices.map(device => device.latestMetricsSummary?.disk), baseSummary.avgDiskUsage),
            diskUsedGb: sum(summaryDevices.map(device => device.latestMetricsSummary?.diskUsedGb), baseSummary.diskUsedGb),
            diskTotalGb: sum(summaryDevices.map(device => device.latestMetricsSummary?.diskTotalGb), baseSummary.diskTotalGb),
          }
        : null;
      const errors = [
        summaryResult.status === 'rejected' ? `Resumo: ${getErrorMessage(summaryResult.reason)}` : null,
        devicesResult.status === 'rejected' ? `Dispositivos: ${getErrorMessage(devicesResult.reason)}` : null,
        alertsResult.status === 'rejected' ? `Alertas: ${getErrorMessage(alertsResult.reason)}` : null,
        alertCountResult.status === 'rejected' ? `Contagem de alertas: ${getErrorMessage(alertCountResult.reason)}` : null,
        metricsError ? `Histórico de métricas: ${getErrorMessage(metricsError)}` : null,
        ...metricData.errors.map((message) => `Histórico de métricas: ${message}`),
      ].filter((message): message is string => message !== null);

      if (errors.length > 0) {
        console.error('Falha ao carregar partes do Dashboard:', errors);
      }
      setDashboardData({
        userId,
        version: refreshVersion,
        summary,
        metricsHistory: metricData.history,
        devices,
        alerts: alertsResult.status === 'fulfilled' ? alertsResult.value : [],
        error: errors.length > 0 ? errors.join(' ') : null,
      });
    })();

    return () => {
      active = false;
    };
  }, [authLoading, refreshVersion, userId]);

  useEffect(() => {
    if (authLoading || !userId) return;
    const refreshTimer = window.setInterval(() => {
      setRefreshVersion((version) => version + 1);
    }, 60_000);
    return () => window.clearInterval(refreshTimer);
  }, [authLoading, userId]);

  const hasCurrentUserData = userId !== null &&
    dashboardData?.userId === userId &&
    dashboardData.version === refreshVersion;
  const loading = authLoading || (userId !== null && !hasCurrentUserData);
  const error = authLoading
    ? null
    : userId === null
      ? 'Não foi possível identificar o usuário autenticado.'
      : hasCurrentUserData
        ? dashboardData.error
        : null;

  const seedDemoData = async () => {
    if (!userId) {
      setSeedDemoError('É necessário estar autenticado para criar dados de demonstração.');
      return;
    }

    setIsSeedingDemo(true);
    setSeedDemoError(null);
    try {
      const alertWarning = await dashboardService.seedDemoData(userId);
      setRefreshVersion((version) => version + 1);
      if (alertWarning) {
        setSeedDemoError(`Dispositivo e métricas criados, mas o alerta de demonstração falhou: ${alertWarning}`);
      }
    } catch (seedError) {
      const message = getErrorMessage(seedError);
      console.error('Falha ao criar dados de demonstração do Dashboard:', seedError);
      setSeedDemoError(`Não foi possível criar dados de demonstração: ${message}`);
    } finally {
      setIsSeedingDemo(false);
    }
  };

  return {
    summary: hasCurrentUserData ? dashboardData.summary : null,
    metricsHistory: hasCurrentUserData ? dashboardData.metricsHistory : [],
    devices: hasCurrentUserData ? dashboardData.devices : [],
    alerts: hasCurrentUserData ? dashboardData.alerts : [],
    loading,
    error,
    isSeedingDemo,
    seedDemoError,
    seedDemoData,
  };
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'erro desconhecido';