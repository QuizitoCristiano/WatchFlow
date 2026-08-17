import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { subscribeToDevices } from '@/services/deviceService';
import type { Device } from '@/types';
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

// Tipagem local para o histórico de métricas
interface MetricRecord {
  id: string;
  collectedAt: string;
  cpu: number;
  memory: number;
  disk: number;
  networkIn: string;
  networkOut: string;
}

export const MetricasPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid;

  // Estados principais
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [activeChartMetric, setActiveChartMetric] = useState<'cpu' | 'ram' | 'disk' | 'network'>('cpu');
  const [metricsHistory, setMetricsHistory] = useState<MetricRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // RN-MET-01 & RN-MET-02: Busca dispositivos do usuário e garante a seleção padrão
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

  // RN-MET-03: Simulação/Busca do histórico com base no dispositivo e período selecionados
// RN-MET-03: Busca do histórico com base no dispositivo e período selecionados
useEffect(() => {
  if (!selectedDeviceId) return;

  let isMounted = true;

  // Em produção / Firestore real:
  // O listener/busca assíncrona altera o estado quando os dados chegam.
  const timer = setTimeout(() => {
    if (!isMounted) return;

    const mockHistory: MetricRecord[] = [
      { id: '1', collectedAt: '12:00:00', cpu: 42, memory: 63, disk: 71, networkIn: '1.2 MB/s', networkOut: '850 KB/s' },
      { id: '2', collectedAt: '11:59:00', cpu: 40, memory: 62, disk: 71, networkIn: '1.1 MB/s', networkOut: '800 KB/s' },
      { id: '3', collectedAt: '11:58:00', cpu: 55, memory: 65, disk: 71, networkIn: '2.4 MB/s', networkOut: '1.5 MB/s' },
      { id: '4', collectedAt: '11:57:00', cpu: 38, memory: 61, disk: 70, networkIn: '950 KB/s', networkOut: '500 KB/s' },
    ];

    setMetricsHistory(mockHistory);
    setLoadingHistory(false);
  }, 400);

  return () => {
    isMounted = false;
    clearTimeout(timer);
  };
}, [selectedDeviceId, timeRange]);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);

  // RN-MET-04: Os cards de resumo usam latestMetricsSummary
  const currentCpu = selectedDevice?.latestMetricsSummary?.cpu ?? 0;
  const currentRam = selectedDevice?.latestMetricsSummary?.memory ?? 0;
  const currentDisk = selectedDevice?.latestMetricsSummary?.disk ?? 0;

  // Formatação da última visualização
  const formatLastSeen = (lastSeen: Device['lastSeen']) => {
    if (!lastSeen) return 'N/A';
    if (typeof lastSeen === 'object' && 'toDate' in lastSeen && typeof lastSeen.toDate === 'function') {
      return lastSeen.toDate().toLocaleTimeString();
    }
    return 'Agora mesmo';
  };

  // RN-MET-06: Exportação dos dados
  const handleExportCSV = () => {
    alert(`Exportando CSV para o dispositivo: ${selectedDevice?.hostname} (Período: ${timeRange})`);
  };

  const handleExportPDF = () => {
    alert(`Gerando relatório PDF do dispositivo: ${selectedDevice?.hostname}`);
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
              <option value="7d" className="bg-zinc-900">Últimos 7 dias</option>
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

      {/* RN-MET-05: Verificação de dispositivo nulo */}
      {!selectedDevice ? (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-12 text-center text-gray-400">
          <Server className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
          <h3 className="text-lg font-medium text-white mb-1">Nenhum dispositivo cadastrado</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Conecte o agente de monitoramento ou cadastre um dispositivo para liberar o painel de métricas.
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
                <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Normal</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{currentCpu}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full" style={{ width: `${currentCpu}%` }} />
              </div>
            </div>

            {/* RAM */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-blue-500"/> Memória</span>
                <span className="text-gray-400">10.2 GB / 16 GB</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{currentRam}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full" style={{ width: `${currentRam}%` }} />
              </div>
            </div>

            {/* Disco */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs text-gray-400 font-medium">
                <span className="flex items-center gap-1.5"><HardDrive className="w-4 h-4 text-purple-500"/> Disco</span>
                <span className="text-gray-400">355 GB / 500 GB</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-bold">{currentDisk}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-purple-500 h-full" style={{ width: `${currentDisk}%` }} />
              </div>
            </div>

            {/* Rede */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-2">
              <div className="text-xs text-gray-400 font-medium">Tráfego de Rede</div>
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1 text-xs">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-gray-400">Down:</span>
                  <span className="font-semibold text-white">1.2 MB/s</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-gray-400">Up:</span>
                  <span className="font-semibold text-white">850 KB/s</span>
                </div>
              </div>
            </div>

          </div>

          {/* ────────────── ÁREA DO GRÁFICO PRINCIPAL ────────────── */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
              <h3 className="text-sm font-semibold text-gray-200">Análise Temporal</h3>
              
              {/* Seleção do tipo de gráfico */}
              <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 text-xs">
                <button
                  onClick={() => setActiveChartMetric('cpu')}
                  className={`px-3 py-1.5 rounded-md font-medium transition ${
                    activeChartMetric === 'cpu' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  CPU (Linha)
                </button>
                <button
                  onClick={() => setActiveChartMetric('ram')}
                  className={`px-3 py-1.5 rounded-md font-medium transition ${
                    activeChartMetric === 'ram' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  RAM (Linha)
                </button>
                <button
                  onClick={() => setActiveChartMetric('disk')}
                  className={`px-3 py-1.5 rounded-md font-medium transition ${
                    activeChartMetric === 'disk' ? 'bg-purple-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Disco (Área)
                </button>
                <button
                  onClick={() => setActiveChartMetric('network')}
                  className={`px-3 py-1.5 rounded-md font-medium transition ${
                    activeChartMetric === 'network' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Rede (Área Dual)
                </button>
              </div>
            </div>

            {/* Container do Gráfico */}
            <div className="h-64 bg-zinc-950/60 rounded-lg border border-zinc-800/60 flex flex-col items-center justify-center p-4 relative overflow-hidden">
              <div className="absolute top-3 right-3 text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Intervalo: {timeRange}
              </div>
              
              <Activity className="w-10 h-10 text-zinc-700 mb-2 animate-pulse" />
              <span className="text-sm font-medium text-gray-400">
                Gráfico de {activeChartMetric.toUpperCase()} ({timeRange})
              </span>
              <span className="text-xs text-gray-600 mt-1">
                Ponto de montagem para Recharts / Chart.js
              </span>
            </div>
          </div>

          {/* ────────────── HISTÓRICO DAS COLETAS + INFO DO PAINEL LATERAL ────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Tabela de Histórico (2 Colunas no desktop) */}
            <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-200">Histórico de Coletas</h3>
                <span className="text-xs text-gray-500">{metricsHistory.length} registros no período</span>
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
                          Nenhum registro encontrado para este período.
                        </td>
                      </tr>
                    ) : (
                      metricsHistory.map((m) => (
                        <tr key={m.id} className="hover:bg-zinc-800/30 transition">
                          <td className="p-3 font-mono text-gray-400">{m.collectedAt}</td>
                          <td className="p-3 font-medium">{m.cpu}%</td>
                          <td className="p-3 font-medium">{m.memory}%</td>
                          <td className="p-3 font-medium">{m.disk}%</td>
                          <td className="p-3 text-gray-400">{m.networkIn} / {m.networkOut}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Coluna Lateral: Informações do Host, Ações e Alertas */}
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
                    <span className="text-white">{selectedDevice.os?.distro ?? 'Linux'}</span>
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
                    className="flex-1 flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-xs py-2 rounded-lg font-medium transition"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV
                  </button>
                  <button 
                    onClick={handleExportPDF}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 text-xs py-2 rounded-lg font-medium transition"
                  >
                    <FileText className="w-3.5 h-3.5" /> Relatório PDF
                  </button>
                </div>
              </div>

              {/* Painel de Alertas Relacionados */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Alertas Recentes
                </h3>
                
                <div className="space-y-2">
                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs space-y-1">
                    <div className="flex justify-between font-medium text-amber-400">
                      <span>CPU acima de 90%</span>
                      <span className="text-gray-500 font-normal">Ontem</span>
                    </div>
                    <p className="text-gray-400 text-[11px]">Pico mantido por mais de 5 minutos.</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs space-y-1">
                    <div className="flex justify-between font-medium text-amber-400">
                      <span>Disco acima de 80%</span>
                      <span className="text-gray-500 font-normal">Hoje</span>
                    </div>
                    <p className="text-gray-400 text-[11px]">Uso da partição principal em 82%.</p>
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