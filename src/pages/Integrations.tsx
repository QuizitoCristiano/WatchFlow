import React, { useState, useEffect } from 'react';
import { 
  Plug, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Globe, 
  Server,
  Zap,
  X
} from 'lucide-react';
import { 
  subscribeToIntegrations, 
  addIntegration, 
  deleteIntegration, 
  testAndSyncIntegration 
} from '../services/integrationService';
import type { Integration, IntegrationType } from '@/types';
import { useAuth } from '@/contexts/useAuth';

export const Integrations: React.FC = () => {
  const { user } = useAuth(); // Obtém o usuário diretamente pelo contexto
  const userId = user?.uid || '';

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<IntegrationType>('node_exporter');
  const [baseUrl, setBaseUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Escuta no Firestore em Tempo Real
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = subscribeToIntegrations(userId, (data) => {
      setIntegrations(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  // Handler de Criação
  const handleCreateIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !baseUrl) return;

    try {
      setSubmitting(true);
      await addIntegration(userId, { name, type, baseUrl });
      setName('');
      setBaseUrl('');
      setType('node_exporter');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Erro ao adicionar integração:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Handler de Teste de Conexão Manual
  const handleTestConnection = async (integration: Integration) => {
    if (!integration.id) return;
    setTestingId(integration.id);
    await testAndSyncIntegration(userId, integration.id, integration.baseUrl);
    setTestingId(null);
  };

  // Handler de Exclusão
  const handleDelete = async (integrationId: string) => {
    if (confirm('Tem certeza que deseja remover esta integração?')) {
      await deleteIntegration(userId, integrationId);
    }
  };

  // Métricas de KPIs
  const totalIntegrations = integrations.length;
  const onlineCount = integrations.filter((i) => i.status === 'online').length;
  const offlineCount = integrations.filter((i) => i.status === 'offline' || i.status === 'error').length;
  const syncRate = totalIntegrations > 0 ? Math.round((onlineCount / totalIntegrations) * 100) : 100;

  // Helper de Cores e Badges do Agente
  const getAgentBadge = (agentType: IntegrationType) => {
    switch (agentType) {
      case 'node_exporter':
        return { label: 'Node Exporter', bg: 'bg-orange-500/10 text-orange-400 border-orange-500/30' };
      case 'telegraf':
        return { label: 'Telegraf Agent', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'zabbix_agent':
        return { label: 'Zabbix Agent', bg: 'bg-red-500/10 text-red-400 border-red-500/30' };
    }
  };

  return (
    <div className="p-6 space-y-8 bg-zinc-950 text-zinc-100 min-h-screen">
      {/* CABEÇALHO DA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Plug className="text-orange-500 w-7 h-7" />
            Integrações & Agentes
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Gerencie os pontos de coleta de telemetria automática do WatchFlow.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2.5 rounded-lg transition shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-5 h-5" />
          Nova Integração
        </button>
      </div>

      {/* CARDS DE KPI / VISÃO GERAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 uppercase font-semibold">Total de Agentes</span>
            <p className="text-2xl font-bold text-white mt-1">{totalIntegrations}</p>
          </div>
          <div className="p-3 bg-zinc-800 rounded-lg text-zinc-400">
            <Server className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 uppercase font-semibold">Conexões Ativas</span>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{onlineCount}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 uppercase font-semibold">Com Inconsistência</span>
            <p className="text-2xl font-bold text-rose-400 mt-1">{offlineCount}</p>
          </div>
          <div className="p-3 bg-rose-500/10 rounded-lg text-rose-400">
            <XCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 uppercase font-semibold">Taxa de Coleta</span>
            <p className="text-2xl font-bold text-orange-400 mt-1">{syncRate}%</p>
          </div>
          <div className="p-3 bg-orange-500/10 rounded-lg text-orange-400">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* GRID DE CARDS DAS INTEGRAÇÕES */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-zinc-500 gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-orange-500" />
          Carregando integrações em tempo real...
        </div>
      ) : integrations.length === 0 ? (
        /* EMPTY STATE */
        <div className="bg-zinc-900/50 border border-dashed border-zinc-800 rounded-2xl p-12 text-center max-w-md mx-auto my-12">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
            <Plug className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Nenhuma integração configurada</h3>
          <p className="text-zinc-400 text-sm mb-6">
            Cadastre o endpoint do seu Node Exporter, Telegraf ou Zabbix para iniciar a descoberta automática de servidores.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 rounded-lg text-sm inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Cadastrar Primeira Conexão
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((item) => {
            const badge = getAgentBadge(item.type);
            const isTesting = testingId === item.id;

            return (
              <div
                key={item.id}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl p-5 flex flex-col justify-between space-y-4 transition shadow-md"
              >
                <div>
                  {/* Linha do Agente & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${badge.bg}`}>
                      {badge.label}
                    </span>
                    <div className="flex items-center gap-2">
                      {item.status === 'online' && (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      )}
                      {item.status === 'offline' && (
                        <span className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md font-medium">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          Offline
                        </span>
                      )}
                      {item.status === 'syncing' && (
                        <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md font-medium">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Sincronizando
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Nome e Endpoint */}
                  <h3 className="text-lg font-bold text-white tracking-tight">{item.name}</h3>
                  <p className="text-zinc-400 text-xs font-mono mt-1 flex items-center gap-1.5 truncate">
                    <Globe className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                    {item.baseUrl}
                  </p>
                </div>

                {/* Métricas e Detalhes */}
                <div className="border-t border-zinc-800/80 pt-3 space-y-2 text-xs text-zinc-400">
                  <div className="flex justify-between">
                    <span>Última sincronização:</span>
                    <span className="text-zinc-300 font-mono">
                      {item.lastSync ? 'Agora mesmo' : 'Pendente'}
                    </span>
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                  <button
                    onClick={() => handleTestConnection(item)}
                    disabled={isTesting}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-orange-400' : ''}`} />
                    {isTesting ? 'Testando...' : 'Sincronizar'}
                  </button>
                  <button
                    onClick={() => item.id && handleDelete(item.id)}
                    className="p-2 bg-zinc-800/60 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 rounded-lg transition"
                    title="Excluir Integração"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CADASTRO DE NOVA INTEGRAÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
              <Plus className="text-orange-500 w-5 h-5" />
              Adicionar Integração
            </h2>
            <p className="text-zinc-400 text-xs mb-6">
              O WatchFlow iniciará a descoberta de hosts instantaneamente após a conexão.
            </p>

            <form onSubmit={handleCreateIntegration} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Nome da Integração</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Cluster Produção - AWS"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">Tipo de Agente</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as IntegrationType)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 transition"
                >
                  <option value="node_exporter">Prometheus Node Exporter</option>
                  <option value="telegraf">Telegraf Agent</option>
                  <option value="zabbix_agent">Zabbix Agent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">URL / Endpoint do Agente</label>
                <input
                  type="url"
                  required
                  placeholder="http://192.168.0.15:9100"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-orange-500 transition"
                />
              </div>

              <div className="pt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm py-2.5 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2.5 rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Conectar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};