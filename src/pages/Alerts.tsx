import React, { useState } from 'react';
import { 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle2, 
  Search, 
  Filter, 
  X, 
  Server, 
  Clock, 
  Activity,
  ChevronRight
} from 'lucide-react';

// ==========================================
// Tipos e Interfaces
// ==========================================
export interface MetricTriggered {
  metric: string;
  value: string;
  threshold: string;
}

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  status: 'open' | 'acknowledged' | 'resolved';
  deviceName: string;
  deviceIp: string;
  integrationType: string;
  metricTriggered: MetricTriggered;
  firstDetectedAt: string;
  resolvedAt?: string;
}

// ==========================================
// Dados Simulados (Mock)
// ==========================================
const MOCK_ALERTS: Alert[] = [
  {
    id: 'ALT-1001',
    title: 'Uso Crítico de CPU (Acima de 90%)',
    description: 'O servidor apresentou alto processamento contínuo nos últimos 15 minutos, podendo causar lentidão nos serviços.',
    severity: 'critical',
    status: 'open',
    deviceName: 'Servidor Prod-Database-01',
    deviceIp: '192.168.1.50',
    integrationType: 'TELEGRAF',
    metricTriggered: {
      metric: 'cpu_usage_user',
      value: '94.2%',
      threshold: '90.0%'
    },
    firstDetectedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString()
  },
  {
    id: 'ALT-1002',
    title: 'Memória RAM Próxima do Limite',
    description: 'Consumo de memória RAM ultrapassou a margem de segurança configurada no agente.',
    severity: 'warning',
    status: 'open',
    deviceName: 'App-Server-Node-02',
    deviceIp: '192.168.1.52',
    integrationType: 'WATCHFLOW-AGENT',
    metricTriggered: {
      metric: 'mem_used_percent',
      value: '86.5%',
      threshold: '80.0%'
    },
    firstDetectedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString()
  },
  {
    id: 'ALT-1003',
    title: 'Espaço em Disco Crítico (/var/log)',
    description: 'O particionamento primário de logs está quase lotado, risco de interrupção de escrita.',
    severity: 'critical',
    status: 'acknowledged',
    deviceName: 'Storage-Cluster-01',
    deviceIp: '192.168.1.10',
    integrationType: 'TELEGRAF',
    metricTriggered: {
      metric: 'disk_used_percent',
      value: '98.1%',
      threshold: '95.0%'
    },
    firstDetectedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString()
  },
  {
    id: 'ALT-1004',
    title: 'Reboot Detectado no Sistema',
    description: 'Servidor foi reiniciado com sucesso após manutenção programada.',
    severity: 'info',
    status: 'resolved',
    deviceName: 'Gateway-Router-Main',
    deviceIp: '192.168.1.1',
    integrationType: 'PING-COLLECTOR',
    metricTriggered: {
      metric: 'sys_uptime',
      value: '2 min',
      threshold: 'N/A'
    },
    firstDetectedAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString()
  }
];

// ==========================================
// Componente Principal
// ==========================================
export const AlertsPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Contadores para os Cards de Topo
  const openCriticals = alerts.filter(a => a.status === 'open' && a.severity === 'critical').length;
  const totalWarnings = alerts.filter(a => a.status !== 'resolved' && a.severity === 'warning').length;
  const totalResolved = alerts.filter(a => a.status === 'resolved').length;

  // Filtragem da tabela
  const filteredAlerts = alerts.filter(alert => {
    const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchesSearch = 
      alert.deviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.deviceIp.includes(searchQuery);

    return matchesStatus && matchesSeverity && matchesSearch;
  });

  // Ação de Reconhecer Alerta
  const handleAcknowledge = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged' } : a));
    if (selectedAlert && selectedAlert.id === id) {
      setSelectedAlert(prev => prev ? { ...prev, status: 'acknowledged' } : null);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-body)] p-6 space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-heading)] flex items-center gap-2">
            <AlertTriangle className="text-[var(--color-brand-primary)]" size={28} />
            Central de Incidentes & Alertas
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Acompanhe proativamente anomalias e problemas detectados pelo motor do WatchFlow.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Críticos Abertos</p>
            <h3 className="text-3xl font-extrabold text-[var(--color-status-danger)] mt-1">{openCriticals}</h3>
          </div>
          <div className="p-3 bg-[var(--color-status-danger)]/10 rounded-lg text-[var(--color-status-danger)]">
            <AlertCircle size={28} />
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Atenção / Warning</p>
            <h3 className="text-3xl font-extrabold text-[var(--color-status-warning)] mt-1">{totalWarnings}</h3>
          </div>
          <div className="p-3 bg-[var(--color-status-warning)]/10 rounded-lg text-[var(--color-status-warning)]">
            <AlertTriangle size={28} />
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Resolvidos</p>
            <h3 className="text-3xl font-extrabold text-[var(--color-status-success)] mt-1">{totalResolved}</h3>
          </div>
          <div className="p-3 bg-[var(--color-status-success)]/10 rounded-lg text-[var(--color-status-success)]">
            <CheckCircle2 size={28} />
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-subtle)]" size={18} />
          <input
            type="text"
            placeholder="Buscar por servidor, IP ou alerta..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--color-bg-app)] border border-[var(--color-border-strong)] text-[var(--color-text-heading)] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-[var(--color-brand-primary)] placeholder-[var(--color-text-subtle)]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
            <Filter size={16} />
            <span>Status:</span>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[var(--color-bg-app)] border border-[var(--color-border-strong)] text-[var(--color-text-body)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand-primary)]"
          >
            <option value="all">Todos os Status</option>
            <option value="open">Abertos</option>
            <option value="acknowledged">Reconhecidos</option>
            <option value="resolved">Resolvidos</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-[var(--color-bg-app)] border border-[var(--color-border-strong)] text-[var(--color-text-body)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand-primary)]"
          >
            <option value="all">Todas as Severidades</option>
            <option value="critical">Crítico</option>
            <option value="warning">Atenção</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Tabela Principal */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-bg-app)] border-b border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                <th className="py-3 px-4">Severidade</th>
                <th className="py-3 px-4">Problema</th>
                <th className="py-3 px-4">Dispositivo</th>
                <th className="py-3 px-4">Métrica / Atual</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Detectado em</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] text-sm">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-[var(--color-text-muted)]">
                    Nenhum alerta encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((alert) => (
                  <tr 
                    key={alert.id} 
                    onClick={() => setSelectedAlert(alert)}
                    className="hover:bg-[var(--color-bg-hover)] transition-colors cursor-pointer group"
                  >
                    {/* Severidade */}
                    <td className="py-3 px-4">
                      {alert.severity === 'critical' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-status-danger)]/10 text-[var(--color-status-danger)]">
                          <span className="w-2 h-2 rounded-full bg-[var(--color-status-danger)] animate-pulse" />
                          Crítico
                        </span>
                      )}
                      {alert.severity === 'warning' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-status-warning)]/10 text-[var(--color-status-warning)]">
                          <span className="w-2 h-2 rounded-full bg-[var(--color-status-warning)]" />
                          Atenção
                        </span>
                      )}
                      {alert.severity === 'info' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--color-status-info)]/10 text-[var(--color-status-info)]">
                          <span className="w-2 h-2 rounded-full bg-[var(--color-status-info)]" />
                          Info
                        </span>
                      )}
                    </td>

                    {/* Título do Problema */}
                    <td className="py-3 px-4 font-medium text-[var(--color-text-heading)]">
                      {alert.title}
                    </td>

                    {/* Dispositivo */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-[var(--color-text-heading)]">{alert.deviceName}</span>
                        <span className="text-xs text-[var(--color-text-subtle)]">{alert.deviceIp}</span>
                      </div>
                    </td>

                    {/* Valor da Métrica */}
                    <td className="py-3 px-4 font-mono text-xs">
                      <span className="text-[var(--color-brand-primary)] font-bold">{alert.metricTriggered.value}</span>
                      <span className="text-[var(--color-text-subtle)]"> (limite: {alert.metricTriggered.threshold})</span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {alert.status === 'open' && (
                        <span className="text-xs font-semibold text-[var(--color-status-danger)] uppercase tracking-wider">Aberto</span>
                      )}
                      {alert.status === 'acknowledged' && (
                        <span className="text-xs font-semibold text-[var(--color-status-warning)] uppercase tracking-wider">Reconhecido</span>
                      )}
                      {alert.status === 'resolved' && (
                        <span className="text-xs font-semibold text-[var(--color-status-success)] uppercase tracking-wider">Resolvido</span>
                      )}
                    </td>

                    {/* Data */}
                    <td className="py-3 px-4 text-xs text-[var(--color-text-subtle)]">
                      {new Date(alert.firstDetectedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Ação / Seta */}
                    <td className="py-3 px-4 text-right">
                      <ChevronRight className="inline text-[var(--color-text-subtle)] group-hover:text-[var(--color-brand-primary)] transition-colors" size={18} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Painel Lateral (Modal/Drawer de Detalhes) */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-end z-50">
          <div className="w-full max-w-md bg-[var(--color-bg-card)] border-l border-[var(--color-border-subtle)] h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl animate-in slide-in-from-right">
            
            <div className="space-y-6">
              {/* Fechar */}
              <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
                <span className="text-xs font-bold text-[var(--color-text-subtle)] uppercase tracking-wider">Detalhes do Incidente</span>
                <button 
                  onClick={() => setSelectedAlert(null)}
                  className="p-1 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-heading)] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Cabeçalho do Alerta */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                    selectedAlert.severity === 'critical' ? 'bg-[var(--color-status-danger)]/20 text-[var(--color-status-danger)]' :
                    selectedAlert.severity === 'warning' ? 'bg-[var(--color-status-warning)]/20 text-[var(--color-status-warning)]' :
                    'bg-[var(--color-status-info)]/20 text-[var(--color-status-info)]'
                  }`}>
                    {selectedAlert.severity}
                  </span>
                  <span className="text-xs text-[var(--color-text-subtle)] font-mono">{selectedAlert.id}</span>
                </div>
                <h2 className="text-xl font-bold text-[var(--color-text-heading)]">{selectedAlert.title}</h2>
                <p className="text-sm text-[var(--color-text-body)] mt-2 leading-relaxed">
                  {selectedAlert.description}
                </p>
              </div>

              {/* Informações da Métrica */}
              <div className="bg-[var(--color-bg-app)] border border-[var(--color-border-strong)] rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--color-text-muted)] flex items-center gap-2">
                    <Activity size={16} className="text-[var(--color-brand-primary)]" />
                    Métrica Analisada:
                  </span>
                  <span className="font-semibold text-[var(--color-text-heading)]">{selectedAlert.metricTriggered.metric}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--color-text-muted)]">Valor Coletado:</span>
                  <span className="font-mono font-bold text-[var(--color-status-danger)]">{selectedAlert.metricTriggered.value}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-[var(--color-text-muted)]">Limite (Threshold):</span>
                  <span className="font-mono text-[var(--color-text-subtle)]">{selectedAlert.metricTriggered.threshold}</span>
                </div>
              </div>

              {/* Origem e Servidor */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-[var(--color-border-subtle)] pb-2">
                  <span className="text-[var(--color-text-muted)] flex items-center gap-2">
                    <Server size={16} /> Dispositivo:
                  </span>
                  <span className="font-medium text-[var(--color-text-heading)]">{selectedAlert.deviceName} ({selectedAlert.deviceIp})</span>
                </div>

                <div className="flex justify-between border-b border-[var(--color-border-subtle)] pb-2">
                  <span className="text-[var(--color-text-muted)]">Coletor de Origem:</span>
                  <span className="font-mono text-xs uppercase text-[var(--color-brand-primary)]">{selectedAlert.integrationType}</span>
                </div>

                <div className="flex justify-between border-b border-[var(--color-border-subtle)] pb-2">
                  <span className="text-[var(--color-text-muted)] flex items-center gap-2">
                    <Clock size={16} /> Primeira Detecção:
                  </span>
                  <span className="text-[var(--color-text-subtle)]">
                    {new Date(selectedAlert.firstDetectedAt).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações Inferiores */}
            <div className="pt-6 border-t border-[var(--color-border-subtle)] space-y-2">
              {selectedAlert.status === 'open' && (
                <button
                  onClick={() => handleAcknowledge(selectedAlert.id)}
                  className="w-full bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} />
                  Reconhecer Alerta
                </button>
              )}

              {selectedAlert.status === 'acknowledged' && (
                <div className="text-center py-2 text-xs font-semibold text-[var(--color-status-warning)] bg-[var(--color-status-warning)]/10 rounded-lg">
                  Alerta reconhecido pela equipe. Aguardando normalização automática.
                </div>
              )}

              {selectedAlert.status === 'resolved' && (
                <div className="text-center py-2 text-xs font-semibold text-[var(--color-status-success)] bg-[var(--color-status-success)]/10 rounded-lg">
                  Incidente resolvido em {selectedAlert.resolvedAt ? new Date(selectedAlert.resolvedAt).toLocaleTimeString('pt-BR') : 'N/A'}.
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AlertsPage;
export { AlertsPage as Alerts };