import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Download, 
  Eye, 
  Trash2, 
  Server, 
  CheckCircle, 
  AlertTriangle,
  X,
  TrendingUp,
  ShieldCheck,
  Zap
} from 'lucide-react';
import type { Report, ReportFormat, ReportType } from '@/types';

const MOCK_REPORTS: Report[] = [
  {
    id: 'rep_001',
    userId: 'usr_001',
    name: 'Desempenho Semanal - API Core',
    type: 'performance',
    format: 'pdf',
    scope: { deviceId: 'dev_001', deviceName: 'srv-api-01' },
    period: { start: '2026-08-10', end: '2026-08-17' },
    summary: { avgCpu: 48.2, maxCpu: 94.7, avgMemory: 61.4, totalAlerts: 8 },
    fileUrl: '#',
    createdAt: '2026-08-17 18:30'
  },
  {
    id: 'rep_002',
    userId: 'usr_001',
    name: 'Relatório de Incidentes Críticos',
    type: 'incidents',
    format: 'csv',
    scope: { deviceName: 'Todos os dispositivos' },
    period: { start: '2026-08-01', end: '2026-08-17' },
    summary: { totalAlerts: 24, availability: 99.8 },
    fileUrl: '#',
    createdAt: '2026-08-17 14:10'
  },
  {
    id: 'rep_003',
    userId: 'usr_001',
    name: 'SLA e Disponibilidade Mensal',
    type: 'availability',
    format: 'pdf',
    scope: { deviceId: 'dev_002', deviceName: 'db-prod-cluster' },
    period: { start: '2026-08-01', end: '2026-08-17' },
    summary: { availability: 99.95, totalAlerts: 2 },
    fileUrl: '#',
    createdAt: '2026-08-17 09:00'
  }
];

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [reportName, setReportName] = useState('Relatório Semanal de Desempenho');
  const [reportType, setReportType] = useState<ReportType>('performance');
  const [device, setDevice] = useState('srv-api-01');
  const [startDate, setStartDate] = useState('2026-08-10');
  const [endDate, setEndDate] = useState('2026-08-17');
  const [format, setFormat] = useState<ReportFormat>('pdf');

  const handleDelete = (id?: string) => {
    if (!id) return;
    setReports(prev => prev.filter(r => r.id !== id));
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: Report = {
      id: `rep_${Date.now()}`,
      userId: 'usr_001',
      name: reportName,
      type: reportType,
      format,
      scope: {
        deviceId: device === 'all' ? undefined : 'dev_selected',
        deviceName: device === 'all' ? 'Todos os dispositivos' : device,
      },
      period: {
        start: startDate,
        end: endDate,
      },
      summary: {
        avgCpu: 48.2,
        maxCpu: 94.7,
        avgMemory: 61.4,
        availability: 99.6,
        totalAlerts: 5
      },
      fileUrl: '#',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setReports([newReport, ...reports]);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-app)] text-[var(--color-text-body)] p-6 space-y-6">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-heading)] flex items-center gap-2">
            <FileText className="text-[var(--color-brand-primary)]" size={28} />
            Relatórios Consolidados
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Analise o desempenho, incidentes e a disponibilidade da sua infraestrutura ao longo do tempo.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white font-medium px-4 py-2.5 rounded-lg transition-colors shadow-md"
        >
          <Plus size={18} />
          Gerar Novo Relatório
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Total de Relatórios</p>
            <h3 className="text-3xl font-extrabold text-[var(--color-text-heading)] mt-1">{reports.length}</h3>
          </div>
          <div className="p-3 bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] rounded-lg">
            <FileText size={24} />
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Disponibilidade Média</p>
            <h3 className="text-3xl font-extrabold text-[var(--color-status-success)] mt-1">99,8%</h3>
          </div>
          <div className="p-3 bg-[var(--color-status-success)]/10 text-[var(--color-status-success)] rounded-lg">
            <ShieldCheck size={24} />
          </div>
        </div>

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Alertas Consolidados</p>
            <h3 className="text-3xl font-extrabold text-[var(--color-status-warning)] mt-1">34</h3>
          </div>
          <div className="p-3 bg-[var(--color-status-warning)]/10 text-[var(--color-status-warning)] rounded-lg">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Tabela de Histórico */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden shadow-lg">
        <div className="p-4 border-b border-[var(--color-border-subtle)]">
          <h2 className="text-base font-semibold text-[var(--color-text-heading)]">Histórico de Documentos Gerados</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-bg-app)] border-b border-[var(--color-border-subtle)] text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Alvo</th>
                <th className="py-3 px-4">Período</th>
                <th className="py-3 px-4">Gerado em</th>
                <th className="py-3 px-4 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)] text-sm">
              {reports.map((rep) => (
                <tr key={rep.id} className="hover:bg-[var(--color-bg-hover)] transition-colors">
                  <td className="py-3 px-4 font-medium text-[var(--color-text-heading)]">
                    <div className="flex items-center gap-2">
                      <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded border border-[var(--color-border-strong)] text-[var(--color-text-muted)]">
                        {rep.format}
                      </span>
                      {rep.name}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {rep.type === 'performance' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-2 py-0.5 rounded-full">
                        <TrendingUp size={12} /> Desempenho
                      </span>
                    )}
                    {rep.type === 'incidents' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-status-danger)] bg-[var(--color-status-danger)]/10 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={12} /> Incidentes
                      </span>
                    )}
                    {rep.type === 'availability' && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-status-success)] bg-[var(--color-status-success)]/10 px-2 py-0.5 rounded-full">
                        <CheckCircle size={12} /> Disponibilidade
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-[var(--color-text-muted)] text-xs">
                    <span className="inline-flex items-center gap-1">
                      <Server size={14} /> {rep.scope?.deviceName || 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-[var(--color-text-subtle)]">
                    {rep.period.start} → {rep.period.end}
                  </td>
                  <td className="py-3 px-4 text-xs text-[var(--color-text-subtle)]">
                    {String(rep.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-2">
                      <button className="p-1.5 rounded-lg hover:bg-[var(--color-bg-app)] text-[var(--color-text-muted)] hover:text-[var(--color-brand-primary)] transition-colors" title="Visualizar Resumo">
                        <Eye size={16} />
                      </button>
                      <a href={rep.fileUrl} download className="p-1.5 rounded-lg hover:bg-[var(--color-bg-app)] text-[var(--color-text-muted)] hover:text-[var(--color-status-success)] transition-colors" title="Baixar Arquivo">
                        <Download size={16} />
                      </a>
                      <button onClick={() => handleDelete(rep.id)} className="p-1.5 rounded-lg hover:bg-[var(--color-bg-app)] text-[var(--color-text-muted)] hover:text-[var(--color-status-danger)] transition-colors" title="Excluir">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Gerar Relatório */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
            
            <div className="flex items-center justify-between p-5 border-b border-[var(--color-border-subtle)]">
              <h3 className="text-lg font-bold text-[var(--color-text-heading)] flex items-center gap-2">
                <FileText className="text-[var(--color-brand-primary)]" size={20} />
                Gerar Novo Relatório
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-heading)] p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1 uppercase">Nome do Relatório</label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    required
                    className="w-full bg-[var(--color-bg-app)] border border-[var(--color-border-strong)] text-[var(--color-text-heading)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1 uppercase">Tipo</label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as ReportType)}
                    className="w-full bg-[var(--color-bg-app)] border border-[var(--color-border-strong)] text-[var(--color-text-heading)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand-primary)]"
                  >
                    <option value="performance">Desempenho (CPU, RAM, Disco)</option>
                    <option value="incidents">Incidentes (Alertas e Falhas)</option>
                    <option value="availability">Disponibilidade (SLA, Uptime)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1 uppercase">Dispositivo</label>
                  <select
                    value={device}
                    onChange={(e) => setDevice(e.target.value)}
                    className="w-full bg-[var(--color-bg-app)] border border-[var(--color-border-strong)] text-[var(--color-text-heading)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--color-brand-primary)]"
                  >
                    <option value="all">Todos os Dispositivos</option>
                    <option value="srv-api-01">srv-api-01 (192.168.1.50)</option>
                    <option value="db-prod-cluster">db-prod-cluster (192.168.1.10)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1 uppercase">Início</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-[var(--color-bg-app)] border border-[var(--color-border-strong)] text-[var(--color-text-heading)] rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[var(--color-brand-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-1 uppercase">Fim</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-[var(--color-bg-app)] border border-[var(--color-border-strong)] text-[var(--color-text-heading)] rounded-lg px-2 py-2 text-xs focus:outline-none focus:border-[var(--color-brand-primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-muted)] mb-2 uppercase">Formato</label>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text-heading)] cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value="pdf"
                        checked={format === 'pdf'}
                        onChange={() => setFormat('pdf')}
                        className="accent-[var(--color-brand-primary)]"
                      />
                      PDF Document
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-[var(--color-text-heading)] cursor-pointer">
                      <input
                        type="radio"
                        name="format"
                        value="csv"
                        checked={format === 'csv'}
                        onChange={() => setFormat('csv')}
                        className="accent-[var(--color-brand-primary)]"
                      />
                      Planilha CSV
                    </label>
                  </div>
                </div>
              </div>

              {/* Prévia Estimada */}
              <div className="bg-[var(--color-bg-app)] border border-[var(--color-border-strong)] rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-brand-primary)] uppercase tracking-wider mb-3">
                    <Zap size={14} /> Prévia Estimada do Snapshot
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between border-b border-[var(--color-border-subtle)] pb-2">
                      <span className="text-[var(--color-text-muted)]">Disponibilidade Esperada:</span>
                      <span className="font-mono font-bold text-[var(--color-status-success)]">99,60%</span>
                    </div>

                    {reportType === 'performance' && (
                      <>
                        <div className="flex justify-between border-b border-[var(--color-border-subtle)] pb-2">
                          <span className="text-[var(--color-text-muted)]">CPU Média / Pico:</span>
                          <span className="font-mono font-semibold text-[var(--color-text-heading)]">48,2% / 94,7%</span>
                        </div>
                        <div className="flex justify-between border-b border-[var(--color-border-subtle)] pb-2">
                          <span className="text-[var(--color-text-muted)]">RAM Média / Pico:</span>
                          <span className="font-mono font-semibold text-[var(--color-text-heading)]">61,4% / 89,1%</span>
                        </div>
                      </>
                    )}

                    <div className="flex justify-between border-b border-[var(--color-border-subtle)] pb-2">
                      <span className="text-[var(--color-text-muted)]">Total de Alertas Registrados:</span>
                      <span className="font-mono font-bold text-[var(--color-status-warning)]">5 incidentes</span>
                    </div>

                    <div className="flex justify-between pb-2">
                      <span className="text-[var(--color-text-muted)]">Estimativa de Registros:</span>
                      <span className="font-mono text-[var(--color-text-subtle)]">~ 2.016 coletas</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-lg p-2 text-[11px] text-[var(--color-text-subtle)] mt-4">
                  O documento final incluirá o gráfico consolidado e a lista detalhada de eventos ocorridos no período.
                </div>
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg text-sm font-medium bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-hover)] text-white transition-colors shadow-md flex items-center gap-2"
                >
                  <FileText size={16} />
                  Confirmar e Gerar
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default ReportsPage;