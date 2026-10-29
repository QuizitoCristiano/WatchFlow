import { loadConfig } from './config.ts';
import { collectMetrics } from './collect.ts';
import { CollectorError, type CollectorConfig } from './config.ts';
import { createSampleId } from '../../api/collector/_lib/domain.ts';
import type { CollectorSample } from '../../api/collector/_lib/contracts.ts';
import { postCollectorSample } from './ingest.ts';

function waitForNextCycle(milliseconds: number, isStopping: () => boolean): Promise<void> {
  if (milliseconds <= 0 || isStopping()) return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(finish, milliseconds);
    const stop = () => finish();
    function finish() {
      clearTimeout(timer);
      process.removeListener('SIGINT', stop);
      process.removeListener('SIGTERM', stop);
      resolve();
    }
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  });
}

async function main(): Promise<void> {
  let config: CollectorConfig | null = null;
  try {
    config = loadConfig();
    if (!config.ingestUrl || !config.ingestToken || !config.integrationId) {
      const metrics = await collectMetrics(
        config.endpoint,
        config.timeoutMs,
        config.sampleIntervalMs,
        fetch,
        undefined,
        config.deviceId,
      );
      console.log(JSON.stringify({
        ...metrics,
        sampleId: createSampleId(),
        integrationId: config.integrationId,
      }));
      return;
    }

    let stopping = false;
    const stop = () => { stopping = true; };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);

    while (!stopping) {
      const cycleStartedAt = Date.now();
      const sampleId = createSampleId();
      let metrics: Awaited<ReturnType<typeof collectMetrics>> | null = null;
      let collectionError: unknown = null;
      try {
        metrics = await collectMetrics(
          config.endpoint,
          config.timeoutMs,
          config.sampleIntervalMs,
          fetch,
          undefined,
          config.deviceId,
        );
      } catch (error: unknown) {
        collectionError = error;
      }

      if (metrics) {
        const payload: CollectorSample = {
          ...metrics,
          sampleId,
          integrationId: config.integrationId,
        };
        try {
          await postCollectorSample(config.ingestUrl, config.ingestToken, payload, config.timeoutMs);
          console.log(JSON.stringify({
            operation: 'success',
            sampleId,
            deviceId: config.deviceId,
            collectedAt: metrics.collectedAt,
            persisted: true,
          }));
        } catch (error: unknown) {
          const message = error instanceof CollectorError
            ? error.message
            : 'Falha inesperada ao enviar a amostra.';
          console.error(JSON.stringify({
            operation: 'delivery_failure',
            sampleId,
            deviceId: config.deviceId,
            collectedAt: metrics.collectedAt,
            error: message,
            persisted: false,
          }));
        }
      } else {
        const message = collectionError instanceof CollectorError
          ? collectionError.message
          : 'Falha inesperada durante a coleta.';
        const failure: CollectorSample = {
          schemaVersion: 1,
          operation: 'error',
          sampleId,
          integrationId: config.integrationId,
          deviceId: config.deviceId,
          collectedAt: new Date().toISOString(),
          error: message,
        };
        let reportPersisted = false;
        try {
          await postCollectorSample(config.ingestUrl, config.ingestToken, failure, config.timeoutMs);
          reportPersisted = true;
        } catch {
          reportPersisted = false;
        }
        console.log(JSON.stringify({
          operation: 'failure',
          sampleId,
          deviceId: config.deviceId,
          collectedAt: failure.collectedAt,
          error: message,
          reportPersisted,
        }));
      }

      await waitForNextCycle(
        config.collectionIntervalMs - (Date.now() - cycleStartedAt),
        () => stopping,
      );
    }

    process.removeListener('SIGINT', stop);
    process.removeListener('SIGTERM', stop);
  } catch (error: unknown) {
    const message = error instanceof CollectorError
      ? error.message
      : 'Falha inesperada durante a coleta.';
    console.error(JSON.stringify({
      schemaVersion: 1,
      operation: 'error',
      deviceId: config?.deviceId ?? 'unknown',
      integrationId: config?.integrationId ?? null,
      collectedAt: new Date().toISOString(),
      error: message,
    }));
    process.exitCode = 1;
  }
}

void main();