import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Activity, Cpu, Server } from 'lucide-react';

interface CollectorMetrics {
  collectedAt: string;
  cpuUsagePercent: number;
  memoryUsagePercent: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseCollectorMetrics(value: unknown): CollectorMetrics | null {
  if (!isRecord(value)) return null;

  const { collectedAt, cpuUsagePercent, memoryUsagePercent } = value;
  if (
    typeof collectedAt !== 'string' || !Number.isFinite(Date.parse(collectedAt)) ||
    typeof cpuUsagePercent !== 'number' || !Number.isFinite(cpuUsagePercent) ||
    cpuUsagePercent < 0 || cpuUsagePercent > 100 ||
    typeof memoryUsagePercent !== 'number' || !Number.isFinite(memoryUsagePercent) ||
    memoryUsagePercent < 0 || memoryUsagePercent > 100
  ) {
    return null;
  }

  return { collectedAt, cpuUsagePercent, memoryUsagePercent };
}

export const CollectorDemo = () => {
  const [metrics, setMetrics] = useState<CollectorMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let requestInProgress = false;

    const refresh = async () => {
      if (requestInProgress) return;
      requestInProgress = true;

      try {
        const response = await fetch('/__local/collector-metrics', { cache: 'no-store' });
        const payload: unknown = await response.json();
        if (!response.ok) {
          const message = isRecord(payload) && typeof payload.error === 'string'
            ? payload.error
            : 'Não foi possível consultar o Node Exporter local.';
          throw new Error(message);
        }

        const result = parseCollectorMetrics(payload);
        if (!result) throw new Error('A resposta do coletor tem formato inválido.');

        if (active) {
          setMetrics(result);
          setError(null);
        }
      } catch (loadError: unknown) {
        if (active) {
          setError(loadError instanceof Error
            ? loadError.message
            : 'Falha ao consultar o coletor local.');
        }
      } finally {
        requestInProgress = false;
        if (active) setLoading(false);
      }
    };

    void refresh();
    const intervalId = window.setInterval(() => void refresh(), 60_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="border-b border-zinc-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-400">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Demonstração do coletor local</h1>
              <p className="mt-1 text-sm text-zinc-400">Node Exporter · leitura real, sem persistência</p>
            </div>
          </div>
        </header>

        <section className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase text-emerald-400">
            <Server className="h-4 w-4" /> Ambiente de desenvolvimento local
          </div>

          {loading && !metrics ? (
            <p className="mt-5 text-sm text-zinc-400">Consultando e calculando duas amostras...</p>
          ) : error && !metrics ? (
            <p role="alert" className="mt-5 text-sm text-rose-300">{error}</p>
          ) : metrics ? (
            <>
              {error && <p role="alert" className="mt-4 text-sm text-amber-300">Última atualização falhou: {error}</p>}
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <MetricValue
                  label="Uso de CPU"
                  value={metrics.cpuUsagePercent}
                  icon={<Cpu className="h-4 w-4" />}
                />
                <MetricValue
                  label="Uso de memória"
                  value={metrics.memoryUsagePercent}
                  icon={<Activity className="h-4 w-4" />}
                />
              </div>
              <p className="mt-5 text-xs text-zinc-500">
                Coletado em {new Date(metrics.collectedAt).toLocaleString()} · atualiza a cada 60 s
              </p>
            </>
          ) : null}
        </section>

        <p className="text-xs leading-relaxed text-zinc-500">
          Esta rota existe somente no Vite local. Os valores vêm do Node Exporter configurado para o coletor;
          não são enviados ao Firebase nem usados como dados persistidos do Dashboard.
        </p>
      </div>
    </main>
  );
};

interface MetricValueProps {
  label: string;
  value: number;
  icon: ReactNode;
}

const MetricValue = ({ label, value, icon }: MetricValueProps) => (
  <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
    <div className="flex items-center gap-2 text-sm text-zinc-400">
      {icon}
      {label}
    </div>
    <p className="mt-3 text-3xl font-semibold tabular-nums">{value.toFixed(2)}%</p>
  </div>
);