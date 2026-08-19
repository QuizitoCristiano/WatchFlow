import { useDashboard } from "@/lib/useDashboard";
import { 
    Cpu, 
    HardDrive, 
    Network, 
    Server, 
    AlertTriangle, 
    CheckCircle2, 
    XCircle, 
    TrendingUp, 
    TrendingDown, 
    Activity, 
    Clock, 
    ShieldAlert,
    Loader2
} from "lucide-react";
import { 
    ResponsiveContainer, 
    LineChart, 
    Line, 
    AreaChart, 
    Area, 
    PieChart, 
    Pie, 
    Cell, 
    XAxis, 
    YAxis, 
    Tooltip 
} from "recharts";

export const Dashboard = () => {
    // 1. Consumindo os dados e o estado de loading do custom hook
    const { summary, metricsHistory, devices, alerts, loading } = useDashboard();

    // Estado de carregamento elegante enquanto o Firestore responde
    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-brand-primary" />
                <p className="text-sm text-text-subtle font-medium">Carregando métricas da infraestrutura...</p>
            </div>
        );
    }

    // Processamento do Gráfico de Rosca de Disco dinâmico
    const diskUsed = summary?.avgDiskUsage || 0;
    const diskData = [
        { name: "Usado", value: diskUsed, color: "#ef4444" },
        { name: "Livre", value: 100 - diskUsed, color: "#27272a" },
    ];

    return (
        <div className="space-y-8 pb-10">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-heading">
                        Visão Geral da Infraestrutura
                    </h1>
                    <p className="text-xs md:text-sm text-text-subtle mt-1">
                        Monitoramento unificado de saúde, métricas e incidentes em tempo real.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-bg-card border border-border-subtle px-3 py-1.5 rounded-xl text-xs text-text-muted self-start md:self-auto">
                    <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                    Sistema Saudável • Atualizado em tempo real
                </div>
            </div>

            {/* SEÇÃO 1: KPIs Principais (Dados dinâmicos do summary) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI CPU */}
                <div className="p-5 bg-bg-card rounded-2xl border border-border-subtle flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Uso de CPU</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-text-heading">{summary?.avgCpuUsage || 0}%</span>
                            <span className="text-xs text-status-warning flex items-center font-semibold">
                                <TrendingUp className="w-3 h-3 mr-0.5" /> Média
                            </span>
                        </div>
                        <p className="text-[11px] text-text-subtle">Calculado entre os servidores ativos</p>
                    </div>
                    <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl border border-brand-primary/20">
                        <Cpu className="w-6 h-6" />
                    </div>
                </div>

                {/* KPI RAM */}
                <div className="p-5 bg-bg-card rounded-2xl border border-border-subtle flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Uso de RAM</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-text-heading">{summary?.avgRamUsage || 0}%</span>
                            <span className="text-xs text-status-success flex items-center font-semibold">
                                <TrendingDown className="w-3 h-3 mr-0.5" /> Normal
                            </span>
                        </div>
                        <p className="text-[11px] text-text-subtle">{summary?.ramUsedGb || 0} GB de {summary?.ramTotalGb || 0} GB</p>
                    </div>
                    <div className="p-3 bg-brand-primary/10 text-brand-primary rounded-xl border border-brand-primary/20">
                        <Server className="w-6 h-6" />
                    </div>
                </div>

                {/* KPI Disco */}
                <div className="p-5 bg-bg-card rounded-2xl border border-border-subtle flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Uso de Disco</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-text-heading">{summary?.avgDiskUsage || 0}%</span>
                            {diskUsed > 80 && <span className="text-xs text-status-danger font-semibold">⚠ Alerta</span>}
                        </div>
                        <p className="text-[11px] text-text-subtle">{summary?.diskUsedGb || 0} GB de {summary?.diskTotalGb || 0} GB</p>
                    </div>
                    <div className="p-3 bg-status-danger/10 text-status-danger rounded-xl border border-status-danger/20">
                        <HardDrive className="w-6 h-6" />
                    </div>
                </div>

                {/* KPI SLA */}
                <div className="p-5 bg-bg-card rounded-2xl border border-border-subtle flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Disponibilidade</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-text-heading">{summary?.globalSlaPercent || 99.9}%</span>
                        </div>
                        <p className="text-[11px] text-status-success font-semibold">SLA Global Mantido</p>
                    </div>
                    <div className="p-3 bg-status-success/10 text-status-success rounded-xl border border-status-success/20">
                        <Activity className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* SEÇÃO 2: Gráficos de Evolução (CPU e RAM) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* CPU Line Chart */}
                <div className="p-5 bg-bg-card rounded-2xl border border-border-subtle space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-text-heading flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-brand-primary" /> Histórico de Uso de CPU (%)
                        </h3>
                        <span className="text-xs text-text-subtle">Últimas horas</span>
                    </div>
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metricsHistory}>
                                <XAxis dataKey="timestamp" stroke="#71717a" fontSize={11} tickLine={false} />
                                <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#fafafa" }} />
                                <Line type="monotone" dataKey="cpu" stroke="#f97316" strokeWidth={2.5} dot={{ fill: "#f97316", r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* RAM Line Chart */}
                <div className="p-5 bg-bg-card rounded-2xl border border-border-subtle space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-text-heading flex items-center gap-2">
                            <Server className="w-4 h-4 text-brand-primary" /> Histórico de Uso de Memória (%)
                        </h3>
                        <span className="text-xs text-text-subtle">Últimas horas</span>
                    </div>
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={metricsHistory}>
                                <XAxis dataKey="timestamp" stroke="#71717a" fontSize={11} tickLine={false} />
                                <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#fafafa" }} />
                                <Line type="monotone" dataKey="memory" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: "#06b6d4", r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* SEÇÕES 3 e 4: Disco (Rosca) e Rede (Área) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Disco Donut Chart */}
                <div className="p-5 bg-bg-card rounded-2xl border border-border-subtle space-y-4 flex flex-col justify-between">
                    <h3 className="text-sm font-bold text-text-heading flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-status-danger" /> Distribuição de Disco
                    </h3>
                    <div className="h-44 w-full relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={diskData} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value">
                                    {diskData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className="text-xl font-bold text-text-heading">{diskUsed}%</span>
                            <span className="text-[10px] text-text-muted uppercase">Ocupado</span>
                        </div>
                    </div>
                    <div className="flex justify-around text-xs border-t border-border-subtle pt-3 text-text-muted">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-status-danger" />
                            <span>Usado: {summary?.diskUsedGb || 0} GB</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-border-subtle" />
                            <span>Livre: {(summary?.diskTotalGb || 0) - (summary?.diskUsedGb || 0)} GB</span>
                        </div>
                    </div>
                </div>

                {/* Rede Area Chart */}
                <div className="lg:col-span-2 p-5 bg-bg-card rounded-2xl border border-border-subtle space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-text-heading flex items-center gap-2">
                            <Network className="w-4 h-4 text-brand-primary" /> Tráfego de Rede (Mbps)
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-primary" /> Download</span>
                            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-status-info" /> Upload</span>
                        </div>
                    </div>
                    <div className="h-52 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metricsHistory}>
                                <XAxis dataKey="timestamp" stroke="#71717a" fontSize={11} tickLine={false} />
                                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#fafafa" }} />
                                <Area type="monotone" dataKey="downloadMbps" stroke="#f97316" fill="#f97316" fillOpacity={0.15} strokeWidth={2} />
                                <Area type="monotone" dataKey="uploadMbps" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* SEÇÃO 5 e 6: Tabela de Dispositivos e Alertas Recentes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tabela de Dispositivos */}
                <div className="lg:col-span-2 p-5 bg-bg-card rounded-2xl border border-border-subtle space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-text-heading">Status dos Dispositivos Monitorados</h3>
                        <span className="text-xs text-brand-primary font-medium hover:underline cursor-pointer">Ver todos ({devices.length})</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-text-body">
                            <thead className="text-[11px] uppercase text-text-muted border-b border-border-subtle bg-bg-app/50">
                                <tr>
                                    <th className="py-3 px-3">Dispositivo</th>
                                    <th className="py-3 px-3">Status</th>
                                    <th className="py-3 px-3">CPU</th>
                                    <th className="py-3 px-3">RAM</th>
                                    <th className="py-3 px-3">Latência</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border-subtle">
                                {devices.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-6 text-center text-text-subtle">Nenhum dispositivo cadastrado ainda.</td>
                                    </tr>
                                ) : (
                                    devices.map((device) => (
                                        <tr key={device.id || device.hostname} className="hover:bg-bg-hover transition-colors">
                                            <td className="py-3 px-3 font-semibold text-text-heading">
                                                {device.hostname}
                                                <span className="block text-[10px] font-normal text-text-subtle">{device.ip}</span>
                                            </td>
                                            <td className="py-3 px-3">
                                                {device.status === 'online' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-status-success/10 text-status-success border border-status-success/20">
                                                        <CheckCircle2 className="w-3 h-3" /> Online
                                                    </span>
                                                )}
                                                {device.status === 'offline' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-status-danger/10 text-status-danger border border-status-danger/20">
                                                        <XCircle className="w-3 h-3" /> Offline
                                                    </span>
                                                )}
                                                {device.status === 'warning' && (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-status-warning/10 text-status-warning border border-status-warning/20">
                                                        <AlertTriangle className="w-3 h-3" /> Atenção
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-text-muted">
                                                {device.latestMetricsSummary ? `${device.latestMetricsSummary.cpu}%` : '—'}
                                            </td>
                                            <td className="py-3 px-3 text-text-muted">
                                                {device.latestMetricsSummary ? `${device.latestMetricsSummary.memory}%` : '—'}
                                            </td>
                                            <td className="py-3 px-3 text-text-muted">
                                                {device.latestMetricsSummary?.latencyMs ? `${device.latestMetricsSummary.latencyMs}ms` : '—'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Feed de Alertas Recentes */}
                <div className="p-5 bg-bg-card rounded-2xl border border-border-subtle space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-text-heading flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-status-warning" /> Alertas Recentes
                        </h3>
                        <Clock className="w-4 h-4 text-text-subtle" />
                    </div>
                    <div className="space-y-3">
                        {alerts.length === 0 ? (
                            <p className="text-xs text-text-subtle py-4 text-center">Nenhum alerta ativo no momento.</p>
                        ) : (
                            alerts.map((alert) => (
                                <div key={alert.id} className="p-3 rounded-xl bg-bg-app border border-border-subtle space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs font-bold ${
                                            alert.severity === 'critical' ? 'text-status-danger' : 
                                            alert.severity === 'warning' ? 'text-status-warning' : 'text-status-success'
                                        }`}>
                                            {alert.title}
                                        </span>
                                    </div>
                                    <p className="text-xs text-text-heading font-medium">{alert.deviceName || 'Dispositivo Desconhecido'}</p>
                                    <p className="text-[11px] text-text-subtle">{alert.description}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* SEÇÃO 7: Histórico de SLA */}
            <div className="p-5 bg-bg-card rounded-2xl border border-border-subtle space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-text-heading">Histórico de Disponibilidade e SLA</h3>
                        <p className="text-xs text-text-subtle">Acompanhamento contínuo dos indicadores globais do produto</p>
                    </div>
                    <span className="text-xs bg-bg-app px-3 py-1.5 rounded-xl border border-border-subtle text-text-muted font-medium">Período Recente</span>
                </div>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metricsHistory}>
                            <XAxis dataKey="timestamp" stroke="#71717a" fontSize={11} tickLine={false} />
                            <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={[99, 100]} />
                            <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#fafafa" }} />
                            <Line type="monotone" dataKey="slaPercent" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};