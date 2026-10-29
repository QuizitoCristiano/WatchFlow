import { CollectorError } from './config.ts';

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

async function readLimitedBody(response: Response): Promise<string> {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    throw new CollectorError('Resposta do Node Exporter excede o limite permitido.');
  }
  if (!response.body) throw new CollectorError('Resposta do Node Exporter sem conteúdo.');

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const chunks: string[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        throw new CollectorError('Resposta do Node Exporter excede o limite permitido.');
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
  } catch (error: unknown) {
    if (error instanceof CollectorError) throw error;
    throw new CollectorError('Não foi possível ler a resposta do Node Exporter.');
  } finally {
    reader.releaseLock();
  }

  const text = chunks.join('');
  if (!text.trim()) throw new CollectorError('A resposta do Node Exporter está vazia.');
  return text;
}

export async function fetchMetricsText(
  endpoint: URL,
  timeoutMs: number,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  let response: Response;
  try {
    response = await fetcher(endpoint, {
      method: 'GET',
      redirect: 'error',
      headers: { accept: 'text/plain; version=0.0.4' },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new CollectorError(`Tempo limite de ${timeoutMs} ms ao consultar o Node Exporter.`);
    }
    throw new CollectorError('Falha de rede ao consultar o Node Exporter.');
  }

  if (!response.ok) {
    throw new CollectorError(`Node Exporter respondeu com HTTP ${response.status}.`);
  }

  return readLimitedBody(response);
}