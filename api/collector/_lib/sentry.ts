import * as Sentry from '@sentry/node';

let initialized = false;

function scrubServerEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.env;

    if (event.request.headers) {
      const headers = { ...event.request.headers };
      for (const key of Object.keys(headers)) {
        if (/authorization|cookie|token|secret|password|api[-_]?key/i.test(key)) {
          headers[key] = '[Filtered]';
        }
      }
      event.request.headers = headers;
    }

    if (event.request.url) {
      try {
        const url = new URL(event.request.url);
        url.search = '';
        url.hash = '';
        event.request.url = url.toString();
      } catch {
        event.request.url = '[Filtered URL]';
      }
    }
  }

  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
    delete event.user.id;
  }

  return event;
}

/** Initializes Sentry once per serverless instance. No DSN means a safe no-op. */
export function initServerSentry(): boolean {
  if (initialized) return Boolean(process.env.SENTRY_DSN?.trim());

  const dsn = process.env.SENTRY_DSN?.trim();
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment:
      process.env.SENTRY_ENVIRONMENT ||
      process.env.VERCEL_ENV ||
      process.env.NODE_ENV ||
      'development',
    release: process.env.SENTRY_RELEASE || 'watchflow@1.0.0',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
    sendDefaultPii: false,
    beforeSend: scrubServerEvent,
  });

  initialized = true;
  return true;
}

/** Captures unexpected API failures, then flushes before the serverless response ends. */
export async function captureServerException(
  error: unknown,
  endpoint: 'collector.provision' | 'collector.ingest',
): Promise<void> {
  if (!initServerSentry()) return;

  Sentry.withScope((scope) => {
    scope.setLevel('error');
    scope.setTag('application', 'watchflow');
    scope.setTag('runtime', 'vercel-serverless');
    scope.setTag('endpoint', endpoint);
    Sentry.captureException(error);
  });

  await Sentry.flush(1500);
}
