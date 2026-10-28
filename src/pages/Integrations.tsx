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
  X,
  Copy,
} from 'lucide-react';
import { 
  subscribeToIntegrations, 
  addIntegration, 
  deleteIntegration,
  provisionCollectorCredential,
} from '../services/integrationService';
import type { Integration, IntegrationType } from '@/types';
import { useAuth } from '@/contexts/useAuth';

export const Integrations: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const userId = user?.uid || '';

  const [subscription, setSubscription] = useState<{
    userId: string;
    integrations: Integration[];
    loading: boolean;
    error: string | null;
  } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [provisioningId, setProvisioningId] = useState<string | null>(null);
  const [provisionedConfig, setProvisionedConfig] = useState<{
    integrationId: string;
    command: string;
  } | null>(null);
  const [rateWindowNow, setRateWindowNow] = useState<number | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<IntegrationType>('node_exporter');
  const [baseUrl, setBaseUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Escuta no Firestore em Tempo Real
  useEffect(() => {
    if (authLoading) return;
    if (!userId) return;

    const unsubscribe = subscribeToIntegrations(userId, (data) => {
      setSubscription({ userId, integrations: data, loading: false, error: null });
    }, (subscriptionError) => {
      console.error('Erro ao carregar integrações:', subscriptionError);
      setSubscription((current) => ({
        userId,
        integrations: current?.userId === userId ? current.integrations : [],
        loading: false,
        error: `Falha ao carregar integrações: ${subscriptionError.message}`,
      }));
    });

    return () => unsubscribe();
  }, [authLoading, userId]);

  useEffect(() => {
    const updateTime = () => setRateWindowNow(Date.now());
    const frame = window.requestAnimationFrame(updateTime);
    const interval = window.setInterval(updateTime, 60_000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(interval);
    };
  }, []);

  // Handler de Criação
  const handleCreateIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError('Faça login antes de cadastrar uma integração.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await addIntegration(userId, { name, type, baseUrl });
      setName('');
      setBaseUrl('');
      setType('node_exporter');
      setIsModalOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro inesperado ao cadastrar integração.';
      console.error('Erro ao adicionar integração:', err);
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handler de Exclusão
  const handleDelete = async (integrationId: string) => {
    if (confirm('Tem certeza que deseja remover esta integração?')) {
      try {
        await deleteIntegration(userId, integrationId);
      } catch (deleteError: unknown) {
        const message = deleteError instanceof Error ? deleteError.message : 'Erro ao remover integração.';
        console.error('Erro ao remover integração:', deleteError);
        setError(message);
      }
    }
  };

  const currentSubscription = subscription?.userId === userId ? subscription : null;
  const integrations = currentSubscription?.integrations ?? [];
  const actualIntegrations = integrations.map((integration) => ({
    ...integration,
    status: integration.status === 'online' && !integration.lastSuccessAt
      ? 'pending' as const
      : integration.status,
  }));
  const totalIntegrations = integrations.length;
  const onlineCount = actualIntegrations.filter((i) => i.status === 'online').length;
  const offlineCount = actualIntegrations.filter((i) =>
    i.status === 'offline' || i.status === 'error' || Boolean(i.lastError)
  ).length;
  const bucketCutoff = rateWindowNow === null
    ? Number.POSITIVE_INFINITY
    : Math.floor(rateWindowNow / (60 * 60_000)) - 23;
  const collectionCounts = integrations.reduce((total, item) => {
    const buckets = item.collectorAttemptBuckets;
    if (!buckets) {
      return {
        attempts: total.attempts + (item.attemptsLast24h ?? 0),
        successes: total.successes + (item.successesLast24h ?? 0),
      };
    }

    const recent = Object.entries(buckets)
      .filter(([hour]) => Number.isSafeInteger(Number(hour)) && Number(hour) >= bucketCutoff)
      .reduce((counts, [, bucket]) => ({
        attempts: counts.attempts + bucket.attempts,
        successes: counts.successes + bucket.successes,
      }), { attempts: 0, successes: 0 });
    return {
      attempts: total.attempts + recent.attempts,
      successes: total.successes + recent.successes,
    };
  }, { attempts: 0, successes: 0 });
  const { attempts, successes } = collectionCounts;
  const syncRate = attempts > 0 ? `${Math.round((successes / attempts) * 100)}%` : '—';
  const isLoading = authLoading || (!!userId && (currentSubscription?.loading ?? true));
  const visibleError = error ?? currentSubscription?.error
    ?? (!authLoading && !userId ? 'Faça login para visualizar integrações.' : null);

  const formatDate = (value: Integration['lastSuccessAt'] | Integration['lastAttemptAt']) => {
    if (!value) return 'Nunca';
    const date = typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function'
      ? value.toDate()
      : value instanceof Date
        ? value
        : typeof value === 'string'
          ? new Date(value)
          : null;
    return date && Number.isFinite(date.getTime()) ? date.toLocaleString('pt-BR') : 'Nunca';
  };

  const handleProvisionCollector = async (integration: Integration) => {
    if (!userId || !integration.id) {
      setError('É necessário estar autenticado e selecionar uma integração válida.');
      return;
    }

    setProvisioningId(integration.id);
    setError(null);
    setProvisionedConfig(null);
    try {
      const credential = await provisionCollectorCredential(userId, integration.id);
      const command = [
        `$env:NODE_EXPORTER_URL = "${integration.baseUrl}"`,
        `$env:WATCHFLOW_INTEGRATION_ID = "${integration.id}"`,
        `$env:WATCHFLOW_DEVICE_ID = "${credential.deviceId}"`,
        `$env:WATCHFLOW_INGEST_URL = "${credential.ingestUrl}"`,
        `$env:WATCHFLOW_INGEST_TOKEN = "${credential.token}"`,
        '$env:COLLECTOR_INTERVAL_MS = "60000"',
        'npm run collector:start',
      ].join('\n');
      setProvisionedConfig({ integrationId: integration.id, command });
    } catch (provisionError: unknown) {
      const message = provisionError instanceof Error
        ? provisionError.message
        : 'Falha inesperada ao provisionar o coletor.';
      console.error('Falha ao provisionar credencial do coletor:', provisionError);
      setError(message);
    } finally {
      setProvisioningId(null);
    }
  };

  const copyProvisionedCommand = async () => {
    if (!provisionedConfig) return;
    try {
      await navigator.clipboard.writeText(provisionedConfig.command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch (copyError: unknown) {
      console.error('Não foi possível copiar o comando com credencial:', copyError);
      setError('Não foi possível copiar automaticamente; copie o comando exibido manualmente.');
    }
  };

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
            Cadastre configurações e execute uma verificação local; o envio ao Firestore ainda não está disponível.
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
            <p className="text-2xl font-bold text-orange-400 mt-1">{syncRate}</p>
          </div>
          <div className="p-3 bg-orange-500/10 rounded-lg text-orange-400">
            <Zap className="w-6 h-6" />
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Taxa de coleta = sucessos ÷ tentativas nos 24 buckets horários mais recentes (aproximadamente 24 horas). Sem tentativas reportadas pelo coletor, a taxa é indisponível (—).
      </p>

      {visibleError && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-300" role="alert">
          {visibleError}
        </div>
      )}

      {actualIntegrations.some((integration) => integration.type === 'node_exporter') && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h2 className="font-semibold text-zinc-100">Coleta local do Node Exporter</h2>
          <p className="mt-1 text-sm text-zinc-400">
            O Vercel não alcança IPs privados. Gere uma credencial de dispositivo e execute o coletor em um host da rede do agente. A credencial é exibida uma única vez; gerar outra revoga a anterior.
          </p>
          <p className="mt-2 text-xs text-amber-300">
            Gerar credencial grava somente o hash em <code>collectorCredentials</code> e seu vínculo de rotação em <code>collectorCredentialState</code>, após validar a sessão Firebase e a propriedade da integração. A primeira amostra válida cria <code>users/{'{uid}'}/devices/{'{deviceId}'}</code> e <code>metrics/{'{sampleId}'}</code>; não haverá gravação de métricas até executar o coletor.
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Credenciais expiram em 90 dias. Cada amostra válida atualiza o dispositivo e o status/tentativas da integração.
          </p>
          {actualIntegrations.filter((integration) => integration.type === 'node_exporter').map((integration) => (
            <div key={integration.id} className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <code className="overflow-auto rounded bg-zinc-950 p-2 text-xs text-zinc-300">
                $env:NODE_EXPORTER_URL = &quot;{integration.baseUrl}&quot;<br />
                $env:WATCHFLOW_INTEGRATION_ID = &quot;{integration.id ?? ''}&quot;<br />
                npm run collector:start <span className="text-zinc-500">(one-shot local)</span>
              </code>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={provisioningId === integration.id}
                  onClick={() => void handleProvisionCollector(integration)}
                  className="inline-flex items-center justify-center gap-2 rounded bg-orange-600 px-3 py-2 text-xs text-white hover:bg-orange-500 disabled:opacity-50"
                >
                  {provisioningId === integration.id
                    ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    : <Server className="h-3.5 w-3.5" />}
                  Gerar credencial do coletor
                </button>
              </div>
              {provisionedConfig && provisionedConfig.integrationId === integration.id && (
                <div className="w-full space-y-2">
                  <p className="text-xs text-amber-300">
                    Copie e execute em sessão segura. O token aparece somente nesta tela e não é recuperável depois de fechar ou recarregar.
                  </p>
                  <textarea
                    readOnly
                    value={provisionedConfig.command}
                    rows={7}
                    aria-label="Comando do coletor com credencial de uso único"
                    className="w-full resize-y rounded bg-zinc-950 p-2 font-mono text-xs text-zinc-300"
                  />
                  <button
                    type="button"
                    onClick={() => void copyProvisionedCommand()}
                    className="inline-flex items-center justify-center gap-2 rounded bg-zinc-800 px-3 py-2 text-xs text-zinc-200 hover:bg-zinc-700"
                  >
                    <Copy className="h-3.5 w-3.5" />{copied ? 'Copiado' : 'Copiar comando seguro'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* GRID DE CARDS DAS INTEGRAÇÕES */}
      {isLoading ? (
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
            Registre a configuração do Node Exporter, Telegraf ou Zabbix. A coleta automática ainda depende de um serviço de ingestão.
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
            const displayStatus = actualIntegrations.find((integration) => integration.id === item.id)?.status ?? 'pending';

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
                      {displayStatus === 'online' && (
                        <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-medium">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Online
                        </span>
                      )}
                      {(displayStatus === 'offline' || displayStatus === 'error') && (
                        <span className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md font-medium">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          Offline
                        </span>
                      )}
                      {displayStatus === 'syncing' && (
                        <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md font-medium">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Sincronizando
                        </span>
                      )}
                      {displayStatus === 'pending' && (
                        <span className="text-xs text-zinc-400 rounded-md bg-zinc-800 px-2 py-0.5 font-medium">
                          Aguardando coleta
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
                    <span>Última tentativa:</span>
                    <span className="text-zinc-300 font-mono">{formatDate(item.lastAttemptAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Última coleta bem-sucedida:</span>
                    <span className="text-zinc-300 font-mono">{formatDate(item.lastSuccessAt)}</span>
                  </div>
                  {item.lastError && <p className="text-rose-300">{item.lastError}</p>}
                  {item.type !== 'node_exporter' && (
                    <p className="text-amber-300">Coletor para este agente ainda não implementado.</p>
                  )}
                </div>

                {/* Ações do Card */}
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
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
              A configuração será salva como pendente. A conexão será confirmada somente por uma coleta real a partir da rede do agente.
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
                  placeholder="http://192.168.1.2:9100/metrics"
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
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};