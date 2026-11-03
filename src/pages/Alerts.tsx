import React, { useState, useEffect } from 'react';

import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp 
} from 'firebase/firestore';
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
import { db, isFirebaseConfigured } from '@/services/config';
import { useAuth } from '@/contexts/useAuth';

import { ALERT_STATUS_LABELS, type Alert } from '../types';
import { formatDate, formatTime } from "../lib/formatters";

const LOCAL_STORAGE_KEY = 'wf_local_alerts';

const getStoredLocalAlerts = (): Alert[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [
      {
        id: 'alt_001',
        userId: 'usr_local_dev_001',
        deviceId: 'dev-local-machine',
        deviceName: 'srv-local-host',
        type: 'RAM_HIGH',
        title: 'Threshold de Memória RAM Elevado',
        description: 'Uso de memória física ultrapassou 70% na máquina local.',
        severity: 'warning',
        status: 'active',
        metricTriggered: {
          metric: 'RAM',
          value: '75%',
          threshold: '70%',
          operator: '>'
        },
        firstDetectedAt: new Date().toISOString() as any,
        lastDetectedAt: new Date().toISOString() as any,
        createdAt: new Date().toISOString() as any,
      }
    ];
  } catch {
    return [];
  }
};

export const AlertsPage: React.FC = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (isFirebaseConfigured && db && user?.uid) {
      const q = query(
        collection(db, 'alerts'),
        where('userId', '==', user.uid)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docsData: Alert[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        })) as Alert[];

        setAlerts(docsData);
        setLoading(false);
      }, (error) => {
        console.error("Erro ao buscar alertas:", error);
        setLoading(false);
      });

      return () => unsubscribe();
    }

    // Modo Local
    setAlerts(getStoredLocalAlerts());
    setLoading(false);
  }, [user?.uid]);

  // Contadores para os Cards de Topo
  const openCriticals = alerts.filter(a => a.status === 'active' && a.severity === 'critical').length;
  const totalWarnings = alerts.filter(a => a.status !== 'resolved' && a.severity === 'warning').length;
  const totalResolved = alerts.filter(a => a.status === 'resolved').length;

  // Filtragem da tabela
  const filteredAlerts = alerts.filter(alert => {
    const matchStatus = filterStatus === 'all' || alert.status === filterStatus;
    const matchSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
    const matchQuery = searchQuery === '' || 
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.description && alert.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchStatus && matchSeverity && matchQuery;
  });

  // Ação de Reconhecer / Resolver
  const handleAcknowledge = async (id: string) => {
    if (isFirebaseConfigured && db) {
      try {
        const alertRef = doc(db, 'alerts', id);
        await updateDoc(alertRef, {
          status: 'acknowledged',
          acknowledgedAt: serverTimestamp(),
          acknowledgedBy: user?.displayName || user?.email || 'Admin',
        });
      } catch (err) {
        console.error("Erro ao atualizar alerta:", err);
      }
      return;
    }

    const updated = alerts.map(a => a.id === id ? { ...a, status: 'acknowledged' as const } : a);
    setAlerts(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Críticos Ativos</p>
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
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">Resolvidos / Histórico</p>
            <h3 className="text-3xl font-extrabold text-[var(--color-status-success)] mt-1">{totalResolved}</h3>
          </div>
          <div className="p-3 bg-[var(--color-status-success)]/10 rounded-lg text-[var(--color-status-success)]">
            <CheckCircle2 size={28} />
          </div>
        </div>
      </div>

      {/* Filtros e Tabela */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border-subtle)] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-2.5 text-zinc-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar incidente..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-zinc-950 text-gray-400 uppercase font-medium border-b border-zinc-800">
              <tr>
                <th className="p-3">Severidade</th>
                <th className="p-3">Título / Descrição</th>
                <th className="p-3">Origem</th>
                <th className="p-3">Status</th>
                <th className="p-3">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-gray-500">
                    Nenhum alerta registrado no momento. Sistema operando normalmente.
                  </td>
                </tr>
              ) : (
                filteredAlerts.map(a => (
                  <tr key={a.id} className="hover:bg-zinc-800/30">
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                        a.severity === 'critical' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        a.severity === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {a.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-white">{a.title}</div>
                      <div className="text-zinc-500">{a.description}</div>
                    </td>
                    <td className="p-3 font-mono text-zinc-400">{a.deviceName || 'Agente Local'}</td>
                    <td className="p-3">
                      <span className="text-zinc-300">{ALERT_STATUS_LABELS[a.status] || a.status}</span>
                    </td>
                    <td className="p-3">
                      {a.status === 'active' && (
                        <button 
                          onClick={() => handleAcknowledge(a.id!)}
                          className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-xs transition cursor-pointer"
                        >
                          Reconhecer
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AlertsPage;
