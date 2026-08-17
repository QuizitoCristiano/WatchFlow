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
    ShieldAlert
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

// 📊 Dados Simulados para os Gráficos
const cpuHistory = [
    { time: "09:00", value: 42 },
    { time: "10:00", value: 58 },
    { time: "11:00", value: 75 },
    { time: "12:00", value: 68 },
    { time: "13:00", value: 89 },
    { time: "14:00", value: 68 },
];

const ramHistory = [
    { time: "09:00", value: 40 },
    { time: "10:00", value: 42 },
    { time: "11:00", value: 48 },
    { time: "12:00", value: 45 },
    { time: "13:00", value: 50 },
    { time: "14:00", value: 45 },
];

const diskData = [
    { name: "Usado", value: 82, color: "#ef4444" },
    { name: "Livre", value: 18, color: "#27272a" },
];

const networkData = [
    { time: "13:30", download: 45, upload: 12 },
    { time: "13:40", download: 88, upload: 25 },
    { time: "13:50", download: 125, upload: 40 },
    { time: "14:00", download: 95, upload: 30 },
];

const slaHistory = [
    { date: "01/08", sla: 99.99, incidentes: 0 },
    { date: "02/08", sla: 99.95, incidentes: 1 },
    { date: "03/08", sla: 100, incidentes: 0 },
    { date: "04/08", sla: 99.80, incidentes: 2 },
    { date: "05/08", sla: 99.98, incidentes: 0 },
];

// 💻 Lista de Dispositivos para Tabela
const devicesList = [
    { name: "API Principal", type: "Web Service", status: "online", cpu: "22%", ram: "38%", latency: "24ms" },
    { name: "PostgreSQL Prod", type: "Database", status: "online", cpu: "35%", ram: "61%", latency: "12ms" },
    { name: "Servidor Web-01", type: "Linux EC2", status: "offline", cpu: "—", ram: "—", latency: "—" },
    { name: "Cluster Redis", type: "Cache", status: "warning", cpu: "88%", ram: "91%", latency: "115ms" },
];

// ⚠️ Feed de Alertas Recentes
const recentAlerts = [
    { id: 1, type: "danger", title: "CPU acima de 90%", target: "Servidor Web-01", time: "Agora", detail: "Carga crítica sustentada por 3 min" },
    { id: 2, type: "warning", title: "Disco acima de 80%", target: "PostgreSQL Prod", time: "10 min atrás", detail: "Espaço em disco em limiar de atenção" },
    { id: 3, type: "success", title: "API voltou ao normal", target: "API Principal", time: "20 min atrás", detail: "Latência normalizada para < 30ms" },
];

export const Dashboard = () => {
    return (
        <div className="space-y-8 pb-10">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-text-heading">
                        Visão Geral da Infraestrutura
                    </h1>
                    <p className="text-xs md:text-sm text-text-subtle mt-1">
                        Monitoramento unificado de saúdes, métricas e incidentes em tempo real.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-bg-card border border-border-subtle px-3 py-1.5 rounded-xl text-xs text-text-muted self-start md:self-auto">
                    <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                    Sistema Saudável • Atualizado agora
                </div>
            </div>

            {/* SEÇÃO 1: KPIs Principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI CPU */}
                <div className="p-5 bg-bg-card rounded-2xl border border-border-subtle flex items-center justify-between shadow-sm">
                    <div className="space-y-1">
                        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">Uso de CPU</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold text-text-heading">68%</span>
                            <span className="text-xs text-status-warning flex items-center font-semibold">
                                <TrendingUp className="w-3 h-3 mr-0.5" /> ▲ 5%
                            </span>
                        </div>
                        <p className="text-[11px] text-text-subtle">Média dos últimos 5 min</p>
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
                            <span className="text-2xl font-bold text-text-heading">45%</span>
                            <span className="text-xs text-status-success flex items-center font-semibold">
                                <TrendingDown className="w-3 h-3 mr-0.5" /> Normal
                            </span>
                        </div>
                        <p className="text-[11px] text-text-subtle">14.4 GB de 32 GB em uso</p>
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
                            <span className="text-2xl font-bold text-text-heading">82%</span>
                            <span className="text-xs text-status-danger font-semibold">⚠ Alerta</span>
                        </div>
                        <p className="text-[11px] text-text-subtle">820 GB de 1 TB alocado</p>
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
                            <span className="text-2xl font-bold text-text-heading">99.98%</span>
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
                        <span className="text-xs text-text-subtle">Hoje (09h - 12h)</span>
                    </div>
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={cpuHistory}>
                                <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} />
                                <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#fafafa" }} />
                                <Line type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2.5} dot={{ fill: "#f97316", r: 4 }} />
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
                        <span className="text-xs text-text-subtle">Hoje (09h - 12h)</span>
                    </div>
                    <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={ramHistory}>
                                <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} />
                                <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={[0, 100]} />
                                <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#fafafa" }} />
                                <Line type="monotone" dataKey="value" stroke="#06b6d4" strokeWidth={2.5} dot={{ fill: "#06b6d4", r: 4 }} />
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
                            <span className="text-xl font-bold text-text-heading">82%</span>
                            <span className="text-[10px] text-text-muted uppercase">Ocupado</span>
                        </div>
                    </div>
                    <div className="flex justify-around text-xs border-t border-border-subtle pt-3 text-text-muted">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-status-danger" />
                            <span>Usado: 820 GB</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-border-subtle" />
                            <span>Livre: 180 GB</span>
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
                            <AreaChart data={networkData}>
                                <XAxis dataKey="time" stroke="#71717a" fontSize={11} tickLine={false} />
                                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#fafafa" }} />
                                <Area type="monotone" dataKey="download" stroke="#f97316" fill="#f97316" fillOpacity={0.15} strokeWidth={2} />
                                <Area type="monotone" dataKey="upload" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.15} strokeWidth={2} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* SEÇÃO 5 e 6: Tabela de Dispositivos & Alertas Recentes */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tabela de Dispositivos (2 Colunas) */}
                <div className="lg:col-span-2 p-5 bg-bg-card rounded-2xl border border-border-subtle space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-text-heading">Status dos Dispositivos Monitorados</h3>
                        <span className="text-xs text-brand-primary font-medium hover:underline cursor-pointer">Ver todos</span>
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
                                {devicesList.map((device, idx) => (
                                    <tr key={idx} className="hover:bg-bg-hover transition-colors">
                                        <td className="py-3 px-3 font-semibold text-text-heading">
                                            {device.name}
                                            <span className="block text-[10px] font-normal text-text-subtle">{device.type}</span>
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
                                        <td className="py-3 px-3 text-text-muted">{device.cpu}</td>
                                        <td className="py-3 px-3 text-text-muted">{device.ram}</td>
                                        <td className="py-3 px-3 text-text-muted">{device.latency}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Feed de Alertas Recentes (1 Coluna) */}
                <div className="p-5 bg-bg-card rounded-2xl border border-border-subtle space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-text-heading flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-status-warning" /> Alertas Recentes
                        </h3>
                        <Clock className="w-4 h-4 text-text-subtle" />
                    </div>
                    <div className="space-y-3">
                        {recentAlerts.map((alert) => (
                            <div key={alert.id} className="p-3 rounded-xl bg-bg-app border border-border-subtle space-y-1">
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-bold ${
                                        alert.type === 'danger' ? 'text-status-danger' : 
                                        alert.type === 'warning' ? 'text-status-warning' : 'text-status-success'
                                    }`}>
                                        {alert.title}
                                    </span>
                                    <span className="text-[10px] text-text-subtle">{alert.time}</span>
                                </div>
                                <p className="text-xs text-text-heading font-medium">{alert.target}</p>
                                <p className="text-[11px] text-text-subtle">{alert.detail}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* SEÇÃO 7: Histórico de SLA e SLA Anual */}
            <div className="p-5 bg-bg-card rounded-2xl border border-border-subtle space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-sm font-bold text-text-heading">Histórico de Disponibilidade e SLA</h3>
                        <p className="text-xs text-text-subtle">Acompanhamento contínuo dos indicadores globais do produto</p>
                    </div>
                    <span className="text-xs bg-bg-app px-3 py-1.5 rounded-xl border border-border-subtle text-text-muted font-medium">Últimos 5 dias</span>
                </div>
                <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={slaHistory}>
                            <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                            <YAxis stroke="#71717a" fontSize={11} tickLine={false} domain={[99, 100]} />
                            <Tooltip contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "12px", color: "#fafafa" }} />
                            <Line type="monotone" dataKey="sla" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};