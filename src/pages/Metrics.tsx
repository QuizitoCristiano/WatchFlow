import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { subscribeToDevices } from '@/services/deviceService';
import { subscribeToDeviceMetrics } from '@/services/metricService';
import type { Device, MetricPayload } from '@/types';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Server, 
  Clock, 
  RefreshCw, 
  Download, 
  FileText, 
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const MetricasPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid;

  // Estados principais
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [activeChartMetric, setActiveChartMetric] = useState<'cpu' | 'ram' | 'disk' | 'network'>('cpu');
  const [metricsHistory, setMetricsHistory] = useState<MetricPayload[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Busca dispositivos do usuário e garante a seleção padrão
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToDevices(userId, (data) => {
      setDevices(data);
      if (data.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(data[0].id ?? '');
      }
    });
    return () => unsubscribe();
  }, [userId, selectedDeviceId]);

  // Escuta histórico de métricas reais em tempo real
  useEffect(() => {
    if (!userId || !selectedDeviceId) {
      setMetricsHistory([]);
      return;
    }

    setLoadingHistory(true);
    const unsubscribe = subscribeToDeviceMetrics(userId, selectedDeviceId, 20, (records) => {
      setMetricsHistory(records);
      setLoadingHistory(false);
    });

    return () => unsubscribe();
  }, [userId, selectedDeviceId, timeRange]);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);

  // Cards de resumo com latestMetricsSummary
  const currentCpu = selectedDevice?.latestMetricsSummary?.cpu ?? 0;
  const currentRam = selectedDevice?.latestMetricsSummary?.memory ?? 0;
  const currentDisk = selectedDevice?.latestMetricsSummary?.disk ?? 0;

  // Formatação de data/hora
  const formatMetricTime = (val: any) => {
    if (!val) return '--:--';
    if (typeof val === 'object' && 'toDate' in val && typeof val.toDate === 'function') {
      return val.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
    if (typeof val === 'string') {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      }
      return val;
    }
    return '--:--';
  };

  const formatLastSeen = (lastSeen: Device['lastSeen']) => {
    if (!lastSeen) return 'N/A';
    if (typeof lastSeen === 'object' && 'toDate' in lastSeen && typeof lastSeen.toDate === 'function') {
      return lastSeen.toDate().toLocaleTimeString();
    }
    return 'Agora mesmo';
  };

  // Prepara os dados para o Recharts
  const chartData = useMemo(() => {
    return metricsHistory.map((m) => {
      const timeStr = formatMetricTime(m.collectedAt);
      return {
        timestamp: timeStr,
        cpu: m.cpu?.usagePercent || 0,
        ram: m.memory?.usedPercent || 0,
        disk: m.disk?.usedPercent || 0,
        networkInKb: m.network?.bytesInSec ? Number((m.network.bytesInSec / 1024).toFixed(1)) : 0,
        networkOutKb: m.network?.bytesOutSec ? Number((m.network.bytesOutSec / 1024).toFixed(1)) : 0,
      };
    });
  }, [metricsHistory]);

  const handleExportCSV = () => {
    if (metricsHistory.length === 0) {
      alert('Não há dados suficientes para exportar.');
      return;
    }
    const headers = 'Data/Hora,CPU(%),RAM(%),Disco(%),Rede_In(Bytes/s),Rede_Out(Bytes/s)\n';
    const rows = metricsHistory.map(m => 
      `${formatMetricTime(m.collectedAt)},${m.cpu?.usagePercent || 0},${m.memory?.usedPercent || 0},${m.disk?.usedPercent || 0},${m.network?.bytesInSec || 0},${m.network?.bytesOutSec || 0}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `metricas_${selectedDevice?.hostname || 'dispositivo'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    alert(`Gerando relatório PDF de telemetria do host: ${selectedDevice?.hostname}`);
  };

  return (
    <div className="p-6 text-white max-w-7xl mx-auto space-y-6">
      
      {/* ────────────── CABEÇALHO & FILTROS ────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="text-orange-500" /> Métricas Detalhadas
          </h1>
          <p className="text-gray-400 text-sm">
            Telemetria em tempo real e análise histórica de performance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Seletor de Dispositivo */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
            <Server className="w-4 h-4 text-orange-500" />
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none cursor-pointer font-medium"
            >
              {devices.length === 0 ? (
                <option value="">Nenhum dispositivo encontrado</option>
              ) : (
                devices.map((device) => (
                  <option key={device.id} value={device.id} className="bg-zinc-900">
                    {device.hostname} ({device.ip})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Filtro de Período */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-transparent text-sm text-white focus:outline-none cursor-pointer"
            >
              <option value="30m" className="bg-zinc-900">Últimos 30 minutos</option>
              <option value="1h" className="bg-zinc-900">Última 1 hora</option>
              <option value="6h" className="bg-zinc-900">Últimas 6 horas</option>
              <option value="24h" className="bg-zinc-900">Últimas 24 horas</option>
            </select>
          </div>

          <button 
            onClick={() => setLoadingHistory(true)}
            className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-gray-300 hover:text-white transition"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {!selectedDevice ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center text-gray-400">
          <Server className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
          <h3 className="text-lg font-medium text-white mb-1">Nenhum dispositivo cadastrado</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Inicie o agente coletor local para registrar este computador no WatchFlow e visualizar gráficos em tempo real.
          </p>
        </div>
      ) : (
        <>
          {/* ────────────── CARDS DE RESUMO (LATEST METRICS) ────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* CPU */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                <span className="flex items-center gap-1.5"><Cpu className="w-4 h-4 text-orange-500"/> CPU</span>
                <span className={`px-2 py-0.5 rounded-full border text-xs ${
                  currentCpu > 80 
                    ? 'text-red-400 bg-red-500/10 border-red-500/20' 
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                }`}>
                  {currentCpu > 80 ? 'Elevado' : 'Normal'}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{currentCpu}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${currentCpu > 80 ? 'bg-red-500' : 'bg-orange-500'}`} 
                  style={{ width: `${Math.min(currentCpu, 100)}%` }} 
                />
              </div>
            </div>

            {/* RAM */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-blue-500"/> Memória</span>
                <span className="text-gray-400">
                  {selectedDevice.latestMetricsSummary?.memoryUsedGb ?? '-'} GB / {selectedDevice.latestMetricsSummary?.memoryTotalGb ?? '-'} GB
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{currentRam}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${Math.min(currentRam, 100)}%` }} />
              </div>
            </div>

            {/* Disco */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                <span className="flex items-center gap-1.5"><HardDrive className="w-4 h-4 text-purple-500"/> Disco</span>
                <span className="text-gray-400">
                  {selectedDevice.latestMetricsSummary?.diskUsedGb ?? '-'} GB / {selectedDevice.latestMetricsSummary?.diskTotalGb ?? '-'} GB
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{currentDisk}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${Math.min(currentDisk, 100)}%` }} />
              </div>
            </div>

            {/* Rede */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="text-xs text-gray-400 font-medium">Tráfego de Rede</div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 text-xs">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-gray-400">Down:</span>
                  <span className="font-semibold text-white">
                    {selectedDevice.latestMetricsSummary?.networkInBytesSec 
                      ? `${(selectedDevice.latestMetricsSummary.networkInBytesSec / (1024 * 1024)).toFixed(1)} MB/s` 
                      : '0.0 MB/s'}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-gray-400">Up:</span>
                  <span className="font-semibold text-white">
                    {selectedDevice.latestMetricsSummary?.networkOutBytesSec 
                      ? `${(selectedDevice.latestMetricsSummary.networkOutBytesSec / (1024 * 1024)).toFixed(1)} MB/s` 
                      : '0.0 MB/s'}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ────────────── ÁREA DO GRÁFICO RECHARTS REAL ────────────── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
              <h3 className="text-sm font-semibold text-gray-200">
                Análise Temporal em Tempo Real
              </h3>
              
              {/* Seleção do tipo de gráfico */}
              <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
                <button
                  onClick={() => setActiveChartMetric('cpu')}
                  className={`px-3 py-1.5 rounded-md font-medium transition ${
                    activeChartMetric === 'cpu' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  CPU (%)
                </button>
                <button
                  onClick={() => setActiveChartMetric('ram')}
                  className={`px-3 py-1.5 rounded-md font-medium transition ${
                    activeChartMetric === 'ram' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  RAM (%)
                </button>
                <button
                  onClick={() => setActiveChartMetric('disk')}
                  className={`px-3 py-1.5 rounded-md font-medium transition ${
                    activeChartMetric === 'disk' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Disco (%)
                </button>
                <button
                  onClick={() => setActiveChartMetric('network')}
                  className={`px-3 py-1.5 rounded-md font-medium transition ${
                    activeChartMetric === 'network' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Rede (KB/s)
                </button>
              </div>
            </div>

            {/* Container do Gráfico com Recharts */}
            <div className="h-72 w-full pt-2">
              {chartData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500">
                  <Activity className="w-8 h-8 mb-2 animate-spin text-zinc-600" />
                  <p className="text-sm">Aguardando dados de telemetria do coletor...</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {activeChartMetric === 'cpu' ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="timestamp" stroke="#71717a" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#71717a" fontSize={11} unit="%" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }} 
                        labelStyle={{ color: '#a1a1aa' }}
                      />
                      <Line type="monotone" dataKey="cpu" name="Uso de CPU" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  ) : activeChartMetric === 'ram' ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="timestamp" stroke="#71717a" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#71717a" fontSize={11} unit="%" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }} 
                        labelStyle={{ color: '#a1a1aa' }}
                      />
                      <Line type="monotone" dataKey="ram" name="Uso de RAM" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  ) : activeChartMetric === 'disk' ? (
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="timestamp" stroke="#71717a" fontSize={11} />
                      <YAxis domain={[0, 100]} stroke="#71717a" fontSize={11} unit="%" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }} 
                        labelStyle={{ color: '#a1a1aa' }}
                      />
                      <Area type="monotone" dataKey="disk" name="Uso de Disco" stroke="#a855f7" fill="#a855f7" fillOpacity={0.2} />
                    </AreaChart>
                  ) : (
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="timestamp" stroke="#71717a" fontSize={11} />
                      <YAxis stroke="#71717a" fontSize={11} unit=" KB/s" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px' }} 
                        labelStyle={{ color: '#a1a1aa' }}
                      />
                      <Area type="monotone" dataKey="networkInKb" name="Download" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                      <Area type="monotone" dataKey="networkOutKb" name="Upload" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* ────────────── HISTÓRICO DAS COLETAS + INFO DO PAINEL LATERAL ────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tabela de Histórico Real */}
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-200">Amostras Recentes de Telemetria</h3>
                <span className="text-xs text-gray-500">{metricsHistory.length} registros recebidos</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-zinc-950 text-gray-400 uppercase font-medium border-b border-zinc-800">
                    <tr>
                      <th className="p-3">Data/Hora</th>
                      <th className="p-3">CPU</th>
                      <th className="p-3">RAM</th>
                      <th className="p-3">Disco</th>
                      <th className="p-3">Rede (In/Out)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {metricsHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-500">
                          Nenhum registro encontrado no Firestore para este dispositivo.
                        </td>
                      </tr>
                    ) : (
                      metricsHistory.map((m) => {
                        const inKb = m.network?.bytesInSec ? (m.network.bytesInSec / 1024).toFixed(1) : '0';
                        const outKb = m.network?.bytesOutSec ? (m.network.bytesOutSec / 1024).toFixed(1) : '0';
                        return (
                          <tr key={m.id} className="hover:bg-zinc-800/30 transition">
                            <td className="p-3 font-mono text-gray-400">{formatMetricTime(m.collectedAt)}</td>
                            <td className="p-3 font-medium text-orange-400">{m.cpu?.usagePercent}%</td>
                            <td className="p-3 font-medium text-blue-400">{m.memory?.usedPercent}%</td>
                            <td className="p-3 font-medium text-purple-400">{m.disk?.usedPercent}%</td>
                            <td className="p-3 text-gray-400">{inKb} KB/s / {outKb} KB/s</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Coluna Lateral: Informações do Host e Alertas */}
            <div className="space-y-6">
              
              {/* Informações do Dispositivo */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-gray-200 border-b border-zinc-800 pb-2">
                  Informações do Host
                </h3>
                
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hostname:</span>
                    <span className="font-mono text-white">{selectedDevice.hostname}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Endereço IP:</span>
                    <span className="font-mono text-white">{selectedDevice.ip}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Sistema:</span>
                    <span className="text-white">{selectedDevice.os?.distro ?? 'Local Windows/Linux'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status:</span>
                    <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {selectedDevice.status?.toUpperCase() ?? 'ONLINE'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Última Coleta:</span>
                    <span className="text-gray-300">{formatLastSeen(selectedDevice.lastSeen)}</span>
                  </div>
                </div>

                {/* Botões de Exportação */}
                <div className="pt-3 border-t border-zinc-800 flex gap-2">
                  <button 
                    onClick={handleExportCSV}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs py-2 rounded-lg font-medium transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-xs py-2 rounded-lg font-medium transition cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" /> Relatório PDF
                  </button>
                </div>
              </div>

              {/* Painel de Alertas Rápidos */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Limiares de Alerta
                </h3>
                
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                    <div className="flex justify-between font-medium text-amber-400">
                      <span>Threshold CPU: &gt; 80%</span>
                      <span className="text-emerald-400">Ativo</span>
                    </div>
                    <p className="text-gray-400 text-[11px]">Gera incidente caso consumo ultrapasse 80%.</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-1">
                    <div className="flex justify-between font-medium text-amber-400">
                      <span>Threshold RAM: &gt; 85%</span>
                      <span className="text-emerald-400">Ativo</span>
                    </div>
                    <p className="text-gray-400 text-[11px]">Notifica saturação de memória física.</p>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </>
      )}

    </div>
  );
};
