import React, { useEffect, useState } from 'react';
import { subscribeToDevices, deleteDevice, registerLocalDevice } from '@/services/deviceService';
import type { Device } from '@/types';
import { Server, HardDrive, Cpu, Activity, Trash2, Search, Plus, Laptop, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import { triggerTestErrorForAPM } from '@/lib/sentry';
import { Zap } from 'lucide-react';

export const DispositivosPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.uid;

  const [devices, setDevices] = useState<Device[]>([]);
  const [search, setSearch] = useState('');
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToDevices(userId, setDevices);
    return () => unsubscribe();
  }, [userId]);

  const handleRegisterLocal = async () => {
    if (!userId) {
      alert('Você precisa estar autenticado.');
      return;
    }
    try {
      setRegistering(true);
      await registerLocalDevice(userId, 'srv-local-pc');
    } catch (error) {
      console.error('Erro ao registrar dispositivo local:', error);
      alert('Erro ao registrar máquina local no Firestore.');
    } finally {
      setRegistering(false);
    }
  };

  // Busca segura evitando erros se hostname ou ip forem undefined
  const filteredDevices = devices.filter(
    (d) =>
      (d.hostname ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (d.ip ?? '').includes(search)
  );

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

        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por host ou IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-orange-500"
            />
          </div>

          <button
            onClick={() => {
              throw new Error("This is your first error!");
            }}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer"
            title="Dispara o primeiro erro exato esperado pelo Sentry"
          >
            <Zap className="w-4 h-4 text-purple-200" />
            <span>Break the world (Sentry Test)</span>
          </button>

          <button
            onClick={handleRegisterLocal}
            disabled={registering}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer disabled:opacity-50"
            title="Registra a máquina local no Firestore para demonstrar monitoramento"
          >
            {registering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Laptop className="w-4 h-4" />
            )}
            <span>Conectar Máquina Local</span>
          </button>
        </div>
      </div>

      {/* Condicional para tratar tela vazia ou sem resultados */}
      {filteredDevices.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-12 text-center text-gray-400">
          <Server className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
          <h3 className="text-lg font-medium text-white mb-1">
            {search ? 'Nenhum dispositivo encontrado' : 'Nenhum dispositivo monitorado'}
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            {search
              ? `Nenhum host ou IP corresponde à busca "${search}".`
              : 'Conecte o agente de monitoramento ou clique no botão acima para registrar este computador no WatchFlow.'}
          </p>
          <button
            onClick={handleRegisterLocal}
            disabled={registering}
            className="inline-flex items-center gap-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 px-5 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Registrar Meu Computador Agora
          </button>
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
                      <span className="text-gray-400 flex items-center gap-1"><Cpu className="w-3 h-3"/> CPU</span>
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
                      <span className="text-gray-400 flex items-center gap-1"><HardDrive className="w-3 h-3"/> Disco</span>
                      <span>{disk}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full transition-all duration-500"
                        style={{ width: `${Math.min(disk, 100)}%` }}
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
