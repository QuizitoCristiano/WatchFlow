import { getCollectorServerContext } from './_lib/firebaseAdmin.ts';
import { HttpError } from './_lib/errors.ts';
import { createProvisionHandler } from './_lib/httpHandlers.ts';
import type { ApiRequest, ApiResponse } from './_lib/httpHandlers.ts';

export default async function handler(request: ApiRequest, response: ApiResponse): Promise<void> {
  if (request.method !== 'POST') {
    response.statusCode = 405;
    response.setHeader('allow', 'POST');
    response.setHeader('content-type', 'application/json; charset=utf-8');
    response.setHeader('cache-control', 'no-store');
    response.end(JSON.stringify({ error: 'Método não permitido.' }));
    return;
  }
  try {
    const context = getCollectorServerContext();
    await createProvisionHandler({
      verifyIdToken: context.verifyIdToken,
      provision: context.service.provision,
    })(request, response);
  } catch (error: unknown) {
    if (error instanceof HttpError) {
      response.statusCode = error.statusCode;
      response.setHeader('content-type', 'application/json; charset=utf-8');
      response.setHeader('cache-control', 'no-store');
      response.end(JSON.stringify({ error: error.message }));
      return;
    }
    console.error('Falha ao inicializar endpoint de provisionamento:', error instanceof Error ? error.name : 'unknown');
    response.statusCode = 503;
    response.setHeader('content-type', 'application/json; charset=utf-8');
    response.setHeader('cache-control', 'no-store');
    response.end(JSON.stringify({ error: 'Serviço de ingestão indisponível.' }));
  }
}
