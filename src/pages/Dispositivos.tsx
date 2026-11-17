import React, { useEffect, useState } from 'react';
import { subscribeToDevices, deleteDevice } from '@/services/deviceService';
import type { Device } from '@/types';
import { Server, HardDrive, Cpu, Activity, Trash2, Monitor } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import { useI18n } from '@/i18n/useI18n';

export const DispositivosPage: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const userId = user?.uid;

  const [devicesState, setDevicesState] = useState<{ userId: string; items: Device[] } | null>(null);
  const devices = userId && devicesState?.userId === userId ? devicesState.items : [];

  useEffect(() => {
    if (!userId) return;
    return subscribeToDevices(userId, (items) => setDevicesState({ userId, items }));
  }, [userId]);

  // Busca segura evitando erros se hostname ou ip forem undefined
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Server className="text-orange-500" /> Dispositivos Monitorados
          </h1>
          <p className="text-gray-400 text-sm">
            Visualização de hosts e estatísticas de uso em tempo real
          </p>
        </div>

        <p className="text-xs text-zinc-500">{t('Os dispositivos aparecem aqui somente depois de serem vinculados à sua conta por uma integração autenticada.')}</p>
      </div>

      {/* Condicional para tratar tela vazia ou sem resultados */}
      {filteredDevices.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-12 text-center text-gray-400">
          <Server className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
          <h3 className="text-lg font-medium text-white mb-1">
            Nenhum dispositivo monitorado
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            Cadastre uma integração Node Exporter e execute o Collector para vincular uma máquina à sua conta.
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
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                      device.status === 'online'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : device.status === 'warning'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}
                  >
                    {device.status ? device.status.toUpperCase() : 'DESCONHECIDO'}
                  </span>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400 flex items-center gap-1"><Cpu className="w-3 h-3"/> {t('CPU')}</span>
                      <span>{cpu}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-orange-500 h-full transition-all duration-500"
                        style={{ width: `${Math.min(cpu, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400 flex items-center gap-1"><Activity className="w-3 h-3"/> RAM</span>
                      <span>{memory}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all duration-500"
                        style={{ width: `${Math.min(memory, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400 flex items-center gap-1"><HardDrive className="w-3 h-3"/> {t('Disco')}</span>
                      <span>{disk}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full transition-all duration-500"
                        style={{ width: `${Math.min(disk, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400 flex items-center gap-1" title={device.latestMetricsSummary?.gpu?.name || 'GPU'}>
                        <Monitor className="w-3 h-3 text-emerald-400"/> GPU
                      </span>
                      <span className={(device.latestMetricsSummary?.gpu?.usagePercent ?? 0) >= 90 ? 'text-red-400 font-bold' : ''}>
                        {device.latestMetricsSummary?.gpu?.usagePercent ?? 20}%
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${(device.latestMetricsSummary?.gpu?.usagePercent ?? 20) >= 90 ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(device.latestMetricsSummary?.gpu?.usagePercent ?? 20, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-zinc-800 flex justify-between items-center text-xs text-gray-500">
                  <span>Último visto: {formatLastSeen(device.lastSeen)}</span>
                  <button
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
