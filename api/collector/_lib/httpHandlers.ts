import { HttpError } from './errors.ts';

export interface ApiRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface ApiResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}

export interface ApiHandler {
  (request: ApiRequest, response: ApiResponse): Promise<void>;
}

interface ProvisionDependencies {
  verifyIdToken(token: string): Promise<{ uid: string }>;
  provision(uid: string, body: unknown): Promise<{ token: string; deviceId: string }>;
}

interface IngestDependencies {
  ingest(token: string, body: unknown): Promise<{ result: string }>;
}

const MAX_BODY_BYTES = 64 * 1024;

function header(request: ApiRequest, name: string): string | undefined {
  const headers = request.headers ?? {};
  const value = Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1];
  return typeof value === 'string' ? value : undefined;
}

function send(response: ApiResponse, statusCode: number, body: unknown): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.setHeader('cache-control', 'no-store');
  response.end(JSON.stringify(body));
}

function requireMethod(request: ApiRequest, response: ApiResponse): boolean {
  if (request.method === 'POST') return true;
  response.setHeader('allow', 'POST');
  send(response, 405, { error: 'Método não permitido.' });
  return false;
}

function requireJson(request: ApiRequest): void {
  const contentType = header(request, 'content-type');
  if (!contentType?.toLowerCase().match(/^application\/json(?:\s*;|$)/)) {
    throw new HttpError(415, 'Content-Type deve ser application/json.');
  }
}

function readJsonBody(request: ApiRequest): unknown {
  const declaredLength = header(request, 'content-length');
  if (declaredLength !== undefined) {
    const length = Number(declaredLength);
    if (!Number.isSafeInteger(length) || length < 0 || length > MAX_BODY_BYTES) {
      throw new HttpError(413, 'Payload excede o limite de 64 KiB.');
    }
  }

  const body = request.body;
  if (typeof body === 'string') {
    if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
      throw new HttpError(413, 'Payload excede o limite de 64 KiB.');
    }
    try {
      return JSON.parse(body) as unknown;
    } catch {
      throw new HttpError(400, 'JSON inválido.');
    }
  }
  if (body === undefined || body === null) throw new HttpError(400, 'Corpo JSON obrigatório.');

  let serialized: string;
  try {
    serialized = JSON.stringify(body);
  } catch {
    throw new HttpError(400, 'Corpo JSON inválido.');
  }
  if (Buffer.byteLength(serialized, 'utf8') > MAX_BODY_BYTES) {
    throw new HttpError(413, 'Payload excede o limite de 64 KiB.');
  }
  return body;
}

function requireBearerToken(request: ApiRequest): string {
  const authorization = header(request, 'authorization');
  const match = authorization?.match(/^Bearer ([A-Za-z0-9._~-]{20,8192})$/);
  if (!match) throw new HttpError(401, 'Credencial Bearer obrigatória.');
  return match[1];
}

function handleError(response: ApiResponse, error: unknown): void {
  if (error instanceof HttpError) {
    send(response, error.statusCode, { error: error.message });
    return;
  }
  console.error('Falha inesperada na API de ingestão:', error instanceof Error ? error.name : 'unknown');
  send(response, 500, { error: 'Falha interna ao processar a requisição.' });
}

export function createProvisionHandler(dependencies: ProvisionDependencies): ApiHandler {
  return async (request, response) => {
    if (!requireMethod(request, response)) return;
    try {
      requireJson(request);
      const idToken = requireBearerToken(request);
      let verified: { uid: string };
      try {
        verified = await dependencies.verifyIdToken(idToken);
      } catch (error: unknown) {
        const code = typeof error === 'object' && error !== null && 'code' in error
          ? error.code
          : null;
        if (
          typeof code === 'string' &&
          ['auth/argument-error', 'auth/id-token-expired', 'auth/id-token-revoked', 'auth/invalid-id-token', 'auth/user-disabled']
            .includes(code)
        ) {
          throw new HttpError(401, 'Token Firebase inválido, expirado ou revogado.');
        }
        throw new HttpError(503, 'Não foi possível validar a sessão Firebase.');
      }
      const body = readJsonBody(request);
      const provisioned = await dependencies.provision(verified.uid, body);
      send(response, 200, {
        ...provisioned,
        ingestUrl: '/api/collector/ingest',
      });
    } catch (error: unknown) {
      handleError(response, error);
    }
  };
}

export function createIngestHandler(dependencies: IngestDependencies): ApiHandler {
  return async (request, response) => {
    if (!requireMethod(request, response)) return;
    try {
      requireJson(request);
      const token = requireBearerToken(request);
      const body = readJsonBody(request);
      const result = await dependencies.ingest(token, body);
      send(response, 200, result);
    } catch (error: unknown) {
      handleError(response, error);
    }
  };
}
