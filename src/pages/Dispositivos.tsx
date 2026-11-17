import React, { useEffect, useState } from 'react';
import { subscribeToDevices, deleteDevice, registerBrowserDevice } from '@/services/deviceService';
import {
  captureLocalDeviceConnected,
  captureOverloadSimulation,
  isSentryConfigured,
} from '@/lib/sentry';
import type { Device } from '@/types';
import {
  Server, HardDrive, Cpu, Activity, Trash2, Monitor,
  Laptop, Flame, Loader2, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import { toast } from 'sonner';

export const DispositivosPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid;

  const [devicesState, setDevicesState] = useState<{ userId: string; items: Device[] } | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const devices = userId && devicesState?.userId === userId ? devicesState.items : [];

  useEffect(() => {
    if (!userId) return;
    return subscribeToDevices(userId, (items) => setDevicesState({ userId, items }));
  }, [userId]);

  const handleConnectLocal = async () => {
    if (!userId) {
      toast.error('Faça login para conectar este dispositivo.');
      return;
    }

    if (!isSentryConfigured()) {
      toast.error('Sentry não configurado. Defina VITE_SENTRY_DSN no ambiente e reinicie o Vite.');
      return;
    }

    setConnecting(true);
    try {
      await registerBrowserDevice(userId);

      const deviceContext = {
        browser: navigator.userAgent,
        operatingSystem: navigator.userAgentData?.platform || navigator.platform || 'Não identificado',
        platform: navigator.platform || 'Não informado',
        language: navigator.language,
        logicalProcessors: navigator.hardwareConcurrency ?? null,
        deviceMemoryGb: navigator.deviceMemory ?? null,
        screen: `${window.screen.width}x${window.screen.height}`,
        online: navigator.onLine,
      };

      const delivered = await captureLocalDeviceConnected(deviceContext);
      if (delivered) {
        toast.success('Dispositivo vinculado e evento enviado ao Sentry.');
      } else {
        toast.warning('Dispositivo vinculado, mas o Sentry não confirmou o envio. Confira o DSN e a rede.');
      }
    } catch (error) {
      console.error('Falha ao conectar dispositivo local:', error);
      toast.error('Não foi possível conectar o dispositivo local.');
    } finally {
      setConnecting(false);
    }
  };

  const handleOverloadSimulation = async () => {
    if (!isSentryConfigured()) {
      toast.error('Sentry não configurado. Defina VITE_SENTRY_DSN no ambiente e reinicie o Vite.');
      return;
    }

    setSimulating(true);
    try {
      const host = user?.displayName || user?.email || 'WatchFlow local browser';
      const delivered = await captureOverloadSimulation(host);
      if (delivered) {
        toast.success('Evento de sobrecarga simulado e enviado ao Sentry.');
      } else {
        toast.warning('Evento gerado, mas o Sentry não confirmou o envio. Confira o DSN e a rede.');
      }
    } catch (error) {
      console.error('Falha ao enviar simulação ao Sentry:', error);
      toast.error('Não foi possível enviar a simulação ao Sentry.');
    } finally {
      setSimulating(false);
    }
  };

  const filteredDevices = devices;

  const formatLastSeen = (lastSeen: Device['lastSeen']) => {
    if (!lastSeen) return 'N/A';
    if (typeof lastSeen === 'object' && 'toDate' in lastSeen && typeof lastSeen.toDate === 'function') {
      return lastSeen.toDate().toLocaleTimeString();
    }
    return 'Agora mesmo';
  };

  return (
    <div className="p-6 text-white max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server className="text-orange-500" /> Dispositivos Monitorados
          </h1>
          <p className="text-gray-400 text-sm">
            Conecte este navegador e valide os eventos de APM no Sentry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleOverloadSimulation}
            disabled={simulating || connecting}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            title="Envia um evento de demonstração ao Sentry; não gera carga real no computador."
          >
            {simulating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
            <span>Simular Sobrecarga (&gt;90%)</span>
          </button>

          <button
            type="button"
            onClick={handleConnectLocal}
            disabled={connecting || simulating}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
            title="Vincula este navegador à conta e envia seu contexto técnico permitido ao Sentry."
          >
            {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Laptop className="w-4 h-4" />}
            <span>Conectar Máquina Local</span>
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-100">
        <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
        <p>
          A conexão envia ao Sentry informações disponíveis no navegador. A simulação gera um evento
          identificado como demonstração; não representa uso físico real de CPU, RAM ou GPU.
          Métricas de hardware exigem um agente local, que será integrado posteriormente.
        </p>
      </div>

      {filteredDevices.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-12 text-center text-gray-400">
          <Server className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
          <h3 className="text-lg font-medium text-white mb-1">
            Nenhum dispositivo monitorado
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Clique em “Conectar Máquina Local” para vincular este navegador e enviar o evento de conexão ao Sentry.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDevices.map((device) => {
            const cpu = device.latestMetricsSummary?.cpu ?? 0;
            const memory = device.latestMetricsSummary?.memory ?? 0;
            const disk = device.latestMetricsSummary?.disk ?? 0;
            const distro = device.os?.distro ?? device.os?.hostname ?? 'N/A';

            return (
              <div
                key={device.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4 hover:border-zinc-700 transition"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{device.hostname}</h3>
                    <span className="text-xs text-gray-400">{device.ip} • {distro}</span>
                    {device.isDemoData && (
                      <span className="block mt-1 text-xs text-orange-300">Vínculo de demonstração Sentry</span>
                    )}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    device.status === 'online'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : device.status === 'warning'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {device.status ? device.status.toUpperCase() : 'DESCONHECIDO'}
                  </span>
                </div>

                {device.isDemoData ? (
                  <div className="rounded-lg bg-zinc-800/70 p-3 text-sm text-gray-300">
                    Navegador vinculado. Métricas físicas de CPU, RAM, disco e GPU serão exibidas quando o agente local estiver integrado.
                  </div>
                ) : (
                  <div className="space-y-3 pt-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400 flex items-center gap-1"><Cpu className="w-3 h-3"/> CPU</span>
                        <span>{cpu}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-orange-500 h-full transition-all duration-500" style={{ width: `${Math.min(cpu, 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400 flex items-center gap-1"><Activity className="w-3 h-3"/> RAM</span>
                        <span>{memory}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${Math.min(memory, 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400 flex items-center gap-1"><HardDrive className="w-3 h-3"/> Disco</span>
                        <span>{disk}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full transition-all duration-500" style={{ width: `${Math.min(disk, 100)}%` }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-400 flex items-center gap-1" title={device.latestMetricsSummary?.gpu?.name || 'GPU'}>
                          <Monitor className="w-3 h-3 text-emerald-400"/> GPU
                        </span>
                        <span>{device.latestMetricsSummary?.gpu?.usagePercent ?? 'N/A'}{device.latestMetricsSummary?.gpu ? '%' : ''}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-zinc-800 flex justify-between items-center text-xs text-gray-500">
                  <span>Último visto: {formatLastSeen(device.lastSeen)}</span>
                  <button
                    type="button"
                    onClick={() => userId && device.id && deleteDevice(userId, device.id)}
                    className="text-gray-400 hover:text-red-400 p-1 transition cursor-pointer"
                    title="Remover Dispositivo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DispositivosPage;
