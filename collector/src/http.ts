import { CollectorError } from './config.ts';

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

async function readLimitedBody(
  response: Response,
  signal: AbortSignal,
  timeoutMs: number,
): Promise<string> {
  const declaredLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    throw new CollectorError('Resposta do Exporter excede o limite permitido.');
  }
  if (!response.body) throw new CollectorError('Resposta do Exporter sem conteúdo.');

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
        throw new CollectorError('Resposta do Exporter excede o limite permitido.');
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }
    chunks.push(decoder.decode());
  } catch (error: unknown) {
    if (error instanceof CollectorError) throw error;
    if (signal.aborted) {
      throw new CollectorError(`Tempo limite de ${timeoutMs} ms ao consultar o Exporter.`);
    }
    throw new CollectorError('Não foi possível ler a resposta do Exporter.');
  } finally {
    reader.releaseLock();
  }

  const text = chunks.join('');
  if (!text.trim()) throw new CollectorError('A resposta do Exporter está vazia.');
  return text;
}

export async function fetchMetricsText(
  endpoint: URL,
  timeoutMs: number,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetcher(endpoint, {
      method: 'GET',
      redirect: 'error',
      headers: { accept: 'text/plain; version=0.0.4' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new CollectorError(`Exporter respondeu com HTTP ${response.status}.`);
    }

    return await readLimitedBody(response, controller.signal, timeoutMs);
  } catch (error: unknown) {
    if (error instanceof CollectorError) throw error;
    if (controller.signal.aborted || (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError'))) {
      throw new CollectorError(`Tempo limite de ${timeoutMs} ms ao consultar o Exporter.`);
    }
    throw new CollectorError('Falha de rede ao consultar o Exporter.');
  } finally {
    clearTimeout(timeout);
  }
}
