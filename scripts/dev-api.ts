import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { getCollectorServerContext } from '../api/collector/_lib/firebaseAdmin.ts';
import { createProvisionHandler, createIngestHandler } from '../api/collector/_lib/httpHandlers.ts';

const PORT = Number(process.env.WATCHFLOW_API_PORT ?? 3001);
const MAX_BODY_BYTES = 64 * 1024;

function readBody(request: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = '';
    let bytes = 0;
    request.setEncoding('utf8');
    request.on('data', (chunk: string) => {
      bytes += Buffer.byteLength(chunk, 'utf8');
      if (bytes > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Payload excede 64 KiB.'), { statusCode: 413 }));
        request.destroy();
        return;
      }
      body += chunk;
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });
}

function send(response: ServerResponse, statusCode: number, payload: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.setHeader('cache-control', 'no-store');
  response.end(JSON.stringify(payload));
}

const server = createServer(async (request, response) => {
  const path = new URL(request.url ?? '/', `http://127.0.0.1:${PORT}`).pathname;
  if (request.method !== 'POST' || !['/api/collector/provision', '/api/collector/ingest'].includes(path)) {
    send(response, 404, { error: 'Not found.' });
    return;
  }

  try {
    const body = await readBody(request);
    const context = getCollectorServerContext();
    const apiRequest = {
      method: request.method,
      headers: request.headers as Record<string, string | string[] | undefined>,
      body,
    };
    const apiResponse = {
      statusCode: 200,
      setHeader: (name: string, value: string) => response.setHeader(name, value),
      end: (value?: string) => {
        response.statusCode = apiResponse.statusCode;
        response.end(value);
      },
    };
    const handler = path.endsWith('/provision')
      ? createProvisionHandler({ verifyIdToken: context.verifyIdToken, provision: context.service.provision })
      : createIngestHandler({ ingest: context.service.ingest });
    await handler(apiRequest, apiResponse);
  } catch (error) {
    const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error &&
      typeof error.statusCode === 'number' ? error.statusCode : 500;
    send(response, statusCode, { error: statusCode === 500 ? 'Falha ao inicializar a API local.' : 'Payload inválido.' });
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`WatchFlow local API pronta em http://127.0.0.1:${PORT}`);
});
