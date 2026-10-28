import { CollectorError } from './config.ts';
import type { CollectorSample } from '../../api/collector/_lib/contracts.ts';

const MAX_SEND_ATTEMPTS = 3;
const RETRYABLE_STATUS_CODES = new Set([408, 425, 429]);

export type IngestFetcher = typeof fetch;
export type IngestWait = (milliseconds: number) => Promise<void>;

const wait: IngestWait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function postCollectorSample(
  endpoint: URL,
  token: string,
  sample: CollectorSample,
  timeoutMs: number,
  fetcher: IngestFetcher = fetch,
  waitBeforeRetry: IngestWait = wait,
): Promise<void> {
  let lastError = 'A API de ingestão não respondeu.';

  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt += 1) {
    try {
      const response = await fetcher(endpoint, {
        method: 'POST',
        redirect: 'error',
        headers: {
          authorization: `Bearer ${token}`,
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify(sample),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.ok) return;
      lastError = `API de ingestão respondeu com HTTP ${response.status}.`;
      const canRetry = RETRYABLE_STATUS_CODES.has(response.status) || response.status >= 500;
      if (!canRetry) throw new CollectorError(lastError);
    } catch (error: unknown) {
      if (error instanceof CollectorError) throw error;
      lastError = error instanceof Error && error.name === 'TimeoutError'
        ? `Tempo limite de ${timeoutMs} ms na API de ingestão.`
        : 'Falha de rede ao enviar a amostra para a API de ingestão.';
    }

    if (attempt < MAX_SEND_ATTEMPTS) {
      await waitBeforeRetry(500 * (2 ** (attempt - 1)));
    }
  }

  throw new CollectorError(lastError);
}
