import { timingSafeEqual } from 'node:crypto';
import { captureServerException, initServerSentry } from '../collector/_lib/sentry.ts';

interface TestRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
}

interface TestResponse {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body?: string): void;
}

function send(response: TestResponse, statusCode: number, body: Record<string, string>): void {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.setHeader('cache-control', 'no-store');
  response.end(JSON.stringify(body));
}

/**
 * Explicit backend Sentry smoke test.
 * Available only outside production and only when SENTRY_TEST_TOKEN is configured.
 */
export default async function handler(request: TestRequest, response: TestResponse): Promise<void> {
  if (process.env.NODE_ENV === 'production' || !process.env.SENTRY_TEST_TOKEN) {
    send(response, 404, { error: 'Not found.' });
    return;
  }

  if (request.method !== 'POST') {
    response.setHeader('allow', 'POST');
    send(response, 405, { error: 'Method not allowed.' });
    return;
  }

  const authorization = request.headers?.authorization;
  const match = typeof authorization === 'string'
    ? authorization.match(/^Bearer (.{32,})$/)
    : null;
  const supplied = match?.[1];
  const expected = process.env.SENTRY_TEST_TOKEN;

  if (!supplied || Buffer.byteLength(supplied) !== Buffer.byteLength(expected)) {
    send(response, 401, { error: 'Unauthorized.' });
    return;
  }

  if (!timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))) {
    send(response, 401, { error: 'Unauthorized.' });
    return;
  }

  if (!initServerSentry()) {
    send(response, 503, { error: 'Server-side Sentry is not configured.' });
    return;
  }

  const flushed = await captureServerException(
    new Error('WatchFlow Sentry backend self-test: controlled non-production event'),
    'observability.self-test',
  );

  if (!flushed) {
    send(response, 503, { error: 'Sentry did not confirm flushing the backend event.' });
    return;
  }

  send(response, 202, { status: 'accepted', message: 'Backend Sentry event flushed to the transport.' });
}
