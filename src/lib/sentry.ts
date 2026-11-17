import * as Sentry from "@sentry/react";

type LocalDeviceContext = {
  browser: string;
  operatingSystem: string;
  platform: string;
  language: string;
  logicalProcessors: number | null;
  deviceMemoryGb: number | null;
  screen: string;
  online: boolean;
};

const isProduction = import.meta.env.PROD;

function scrubSensitiveData(event: Sentry.ErrorEvent): Sentry.ErrorEvent | null {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.data;
    delete event.request.env;
    if (event.request.headers) {
      const headers = { ...event.request.headers };
      for (const key of Object.keys(headers)) {
        if (/authorization|cookie|token|secret|password|api[-_]?key/i.test(key)) headers[key] = "[Filtered]";
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
    delete event.user.email;
    delete event.user.ip_address;
    delete event.user.username;
    delete event.user.id;
  }
  return event;
}

/** Inicializa a APM do frontend. Sem DSN, a aplicação segue normalmente. */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || "development",
    release: import.meta.env.VITE_APP_RELEASE || "watchflow@1.0.0",
    integrations: [Sentry.browserTracingIntegration()],
    sendDefaultPii: false,
    tracesSampleRate: isProduction ? 0.1 : 1,
    tracePropagationTargets: [
      /^https:\/\/watch-flow-six\.vercel\.app\//,
      /^https:\/\/.*\.vercel\.app\//,
      /^http:\/\/localhost(?::\d+)?\//,
    ],
    beforeSend: scrubSensitiveData,
    enabled: true,
    debug: !isProduction && import.meta.env.VITE_SENTRY_DEBUG === "true",
  });
}

export function isSentryConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SENTRY_DSN?.trim());
}

/** Registra exceções operacionais sem anexar payloads ou dados pessoais. */
export function captureAppException(
  error: unknown,
  context?: Record<string, string | number | boolean | null>,
): void {
  const normalized = error instanceof Error ? error : new Error(String(error));
  Sentry.withScope((scope) => {
    scope.setLevel("error");
    scope.setTag("application", "watchflow");
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        if (value !== null && /^(host|metric|module|operation|integration|device_id)$/i.test(key)) {
          scope.setTag(key, String(value));
        }
      }
    }
    Sentry.captureException(normalized);
  });
}

/** Registra metadados de conectividade do navegador, não métricas físicas de CPU. */
export async function captureLocalDeviceConnected(device: LocalDeviceContext): Promise<boolean> {
  Sentry.withScope((scope) => {
    scope.setLevel("info");
    scope.setTag("feature", "local-device-demo");
    scope.setContext("local_device", device);
    Sentry.captureMessage("WatchFlow: dispositivo local conectado pelo usuário");
  });
  return Sentry.flush(2000);
}

/** Evento explicitamente sintético; não representa carga real da máquina. */
export async function captureOverloadSimulation(host: string): Promise<boolean> {
  const simulatedMetrics = {
    cpuUsagePercent: 94,
    memoryUsagePercent: 92,
    gpuUsagePercent: 96,
    simulated: true,
    durationSeconds: 12,
  };
  Sentry.withScope((scope) => {
    scope.setLevel("warning");
    scope.setTag("feature", "overload-demo");
    scope.setTag("host", host);
    scope.setContext("simulated_metrics", simulatedMetrics);
    Sentry.captureMessage("WatchFlow: simulação de sobrecarga acima de 90%");
  });
  return Sentry.flush(2000);
}

/** Erro sintético permitido em desenvolvimento; bloqueado em produção por padrão. */
export function triggerTestErrorForAPM(): void {
  if (isProduction && import.meta.env.VITE_SENTRY_ALLOW_TEST_ERRORS !== "true") return;
  Sentry.captureException(new Error("WatchFlow Sentry test: controlled frontend exception"), {
    tags: { test_event: "true", application: "watchflow" },
  });
}
