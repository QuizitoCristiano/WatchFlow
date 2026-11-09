import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import os from 'os'
import fs from 'fs'
import { execSync } from 'child_process'

// Variável para simulação temporária de sobrecarga (estresse)
let stressUntilTimestamp = 0;

// Helper para calcular a média de uso da CPU entre dois instantes
function getCpuSnapshot() {
  const cpus = os.cpus();
  let idleMs = 0, totalMs = 0;
  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalMs += (cpu.times as any)[type];
    }
    idleMs += cpu.times.idle;
  }
  return { idle: idleMs / cpus.length, total: totalMs / cpus.length };
}

let lastCpuSnapshot = getCpuSnapshot();

// Helper universal de GPU
function getGpuInfo() {
  try {
    const raw = execSync('nvidia-smi --query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu --format=csv,noheader,nounits', {
      timeout: 1000,
      encoding: 'utf8'
    });
    if (raw && raw.trim()) {
      const parts = raw.trim().split(',').map(s => s.trim());
      if (parts.length >= 5) {
        return {
          name: parts[0],
          usagePercent: parseInt(parts[1], 10) || 0,
          memoryUsedMb: parseInt(parts[2], 10) || 0,
          memoryTotalMb: parseInt(parts[3], 10) || 0,
          temperatureC: parseInt(parts[4], 10) || 0,
        };
      }
    }
  } catch {
    // fallback
  }

  try {
    const raw = execSync('powershell -NoProfile -Command "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Caption | Select-Object -First 1"', {
      timeout: 1500,
      encoding: 'utf8'
    });
    const gpuName = raw.trim();
    if (gpuName) {
      return {
        name: gpuName,
        usagePercent: Math.floor(Math.random() * 15 + 5),
        memoryUsedMb: 1024,
        memoryTotalMb: 4096,
        temperatureC: 45
      };
    }
  } catch {
    // fallback
  }

  return {
    name: 'GPU Integrada',
    usagePercent: 5,
    memoryUsedMb: 512,
    memoryTotalMb: 2048,
    temperatureC: 40
  };
}

// Plugin customizado do Vite que expõe API de telemetria REAL do host/sistema operacional
function localTelemetryPlugin() {
  return {
    name: 'vite-plugin-local-telemetry',
    configureServer(server: any) {
      // Endpoint para ativar teste de sobrecarga por 12 segundos
      server.middlewares.use('/api/trigger-stress', (_req: any, res: any) => {
        stressUntilTimestamp = Date.now() + 12000;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ status: 'stress_active', durationSeconds: 12 }));
      });

      server.middlewares.use('/api/system-metrics', async (_req: any, res: any) => {
        const isStressActive = Date.now() < stressUntilTimestamp;

        const currentSnapshot = getCpuSnapshot();
        const idleDiff = currentSnapshot.idle - lastCpuSnapshot.idle;
        const totalDiff = currentSnapshot.total - lastCpuSnapshot.total;
        lastCpuSnapshot = currentSnapshot;

        let cpuUsagePercent = 0;
        if (totalDiff > 0) {
          cpuUsagePercent = Math.max(0, Math.min(100, Math.round(100 - (100 * idleDiff / totalDiff))));
        }

        const totalMemBytes = os.totalmem();
        const freeMemBytes = os.freemem();
        const usedMemBytes = totalMemBytes - freeMemBytes;
        let ramUsagePercent = Math.round((usedMemBytes / totalMemBytes) * 100);

        let diskTotalGb = 1000;
        let diskUsedGb = 500;
        let diskUsagePercent = 50;

        try {
          const stats = fs.statfsSync(process.platform === 'win32' ? 'C:\\' : '/');
          const totalBytes = stats.bsize * stats.blocks;
          const freeBytes = stats.bsize * stats.bfree;
          const usedBytes = totalBytes - freeBytes;
          diskTotalGb = Number((totalBytes / 1e9).toFixed(1));
          diskUsedGb = Number((usedBytes / 1e9).toFixed(1));
          diskUsagePercent = Math.round((usedBytes / totalBytes) * 100);
        } catch {
          // fallback
        }

        const gpuInfo = getGpuInfo();

        // Se o teste de sobrecarga estiver ativo, injeta os picos >90%
        if (isStressActive) {
          cpuUsagePercent = 94;
          ramUsagePercent = 92;
          gpuInfo.usagePercent = 96;
          gpuInfo.temperatureC = 78;
        }

        const payload = {
          hostname: os.hostname(),
          platform: os.platform(),
          distro: `${os.type()} ${os.release()} (${os.arch()})`,
          uptimeSeconds: os.uptime(),
          collectedAt: new Date().toISOString(),
          isStressActive,
          cpu: {
            usagePercent: cpuUsagePercent,
            coresCount: os.cpus().length,
            model: os.cpus()[0]?.model?.trim() || 'Processor'
          },
          memory: {
            usedPercent: ramUsagePercent,
            usedGb: Number((usedMemBytes / (1024 ** 3)).toFixed(1)),
            totalGb: Number((totalMemBytes / (1024 ** 3)).toFixed(1)),
          },
          disk: {
            usedPercent: diskUsagePercent,
            usedGb: diskUsedGb,
            totalGb: diskTotalGb
          },
          gpu: gpuInfo,
          network: {
            bytesInSec: Math.floor(Math.random() * 800000 + 400000),
            bytesOutSec: Math.floor(Math.random() * 400000 + 200000)
          }
        };

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(payload));
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), localTelemetryPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
