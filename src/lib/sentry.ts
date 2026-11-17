import * as Sentry from "@sentry/react";

const isProduction = import.meta.env.PROD;

function scrubSensitiveData(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.env;

    if (event.request.headers) {
      const headers = { ...event.request.headers };
      for (const key of Object.keys(headers)) {
        if (/authorization|cookie|token|secret|password|api[-_]?key/i.test(key)) {
          headers[key] = "[Filtered]";
        }
      }
      event.request.headers = headers;
    }

    if (event.request.url) {
      try {
        const url = new URL(event.request.url);
        url.search = "";
        url.hash = "";
        event.request.url = url.toString();
      } catch {
        event.request.url = "[Filtered URL]";
      }
    }
  }

  if (event.user) {
    // Não enviar e-mail, IP ou identificadores de usuário por padrão.
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
    delete event.user.id;
  }

  return event;
}

/**
 * Inicializa o monitoramento do frontend WatchFlow.
 * O DSN é público por definição; nunca coloque auth tokens aqui.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || "development",
    release: import.meta.env.VITE_APP_RELEASE || "watchflow@1.0.0",
    integrations: [Sentry.browserTracingIntegration()],
    sendDefaultPii: false,
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    tracePropagationTargets: [
      /^https:\/\/watch-flow-six\.vercel\.app\//,
      /^http:\/\/localhost:5173\//,
    ],
    beforeSend: scrubSensitiveData,
    enabled: true,
    debug: !isProduction && import.meta.env.VITE_SENTRY_DEBUG === "true",
  });
}

/** Registra exceções operacionais sem promover erros comuns a nível fatal. */
export function captureAppException(
  error: unknown,
  context?: Record<string, string | number | boolean | null>,
): void {
  const normalizedError =
    error instanceof Error ? error : new Error(String(error));

  Sentry.withScope((scope) => {
    scope.setLevel("error");
    scope.setTag("application", "watchflow");
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        if (value !== null && /^(host|metric|module|operation|integration)$/i.test(key)) {
          scope.setTag(key, String(value));
        }
      }
    }
    Sentry.captureException(normalizedError);
  });
}

/** Erro sintético para validar a integração em ambiente de desenvolvimento. */
export function triggerTestErrorForAPM(): void {
  if (isProduction && import.meta.env.VITE_SENTRY_ALLOW_TEST_ERRORS !== "true") {
    return;
  }

  Sentry.captureException(
    new Error("WatchFlow Sentry test: controlled frontend exception"),
    { tags: { test_event: "true", application: "watchflow" } },
  );
}
