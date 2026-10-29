import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { CollectorError, loadConfig } from './collector/src/config.ts'
import { collectMetrics } from './collector/src/collect.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'local-node-exporter-demo',
    configureServer(server) {
      let collectionInProgress = false;

      server.middlewares.use('/__local/collector-metrics', async (request, response) => {
        const requestHost = request.headers.host?.split(':')[0].toLowerCase();
        const remoteAddress = request.socket.remoteAddress;
        const isLoopbackAddress = remoteAddress === '127.0.0.1' ||
          remoteAddress === '::1' ||
          remoteAddress === '::ffff:127.0.0.1';
        const fetchSite = request.headers['sec-fetch-site'];

        if (
          (requestHost !== '127.0.0.1' && requestHost !== 'localhost') ||
          !isLoopbackAddress ||
          (fetchSite !== undefined && fetchSite !== 'same-origin')
        ) {
          response.statusCode = 403;
          response.end();
          return;
        }

        if (request.method !== 'GET') {
          response.statusCode = 405;
          response.setHeader('Allow', 'GET');
          response.end();
          return;
        }

        if (collectionInProgress) {
          response.statusCode = 429;
          response.setHeader('Content-Type', 'application/json; charset=utf-8');
          response.end(JSON.stringify({ error: 'Uma coleta local já está em andamento.' }));
          return;
        }

        collectionInProgress = true;
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('Content-Type', 'application/json; charset=utf-8');

        try {
          const config = loadConfig();
          const metrics = await collectMetrics(
            config.endpoint,
            config.timeoutMs,
            config.sampleIntervalMs,
          );

          response.statusCode = 200;
          response.end(JSON.stringify(metrics));
        } catch (error: unknown) {
          response.statusCode = 503;
          response.end(JSON.stringify({
            error: error instanceof CollectorError
              ? error.message
              : 'Falha ao consultar o Node Exporter local.',
          }));
        } finally {
          collectionInProgress = false;
        }
      });
    },
  }],
  server: {
    host: '127.0.0.1',
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  
})