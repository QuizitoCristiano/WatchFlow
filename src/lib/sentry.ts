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
const DEFAULT_SENTRY_DSN = "https://e8f60973d14ecee78fdbdbb743c5967d:8e4519e9b907d75b17e4af845ee4bbc1@o4512403331481600.ingest.de.sentry.io/4512403371917392";

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

/** Inicializa a APM do frontend. */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim() || DEFAULT_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || "development",
    release: import.meta.env.VITE_APP_RELEASE || "watchflow@1.0.0",
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 1.0,
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
  return Boolean(import.meta.env.VITE_SENTRY_DSN?.trim() || DEFAULT_SENTRY_DSN);
}

/**
 * Envia alertas e eventos como captureMessage com fingerprint 100% exclusivo
 * (sem stacktrace compartilhado), garantindo que cada alerta crie uma linha própria no Sentry!
 */
export function captureAppException(
  error: unknown,
  context?: Record<string, string | number | boolean | null>,
): void {
  const message = error instanceof Error ? error.message : String(error);
  const metricKey = String(context?.metric || context?.operation || "general");
  const hostKey = String(context?.host || "default-host");

  Sentry.withScope((scope) => {
    scope.setLevel("fatal");
    scope.setFingerprint(["wf-unique-v2", metricKey, hostKey, message]);
    scope.setTag("application", "watchflow");
    scope.setTag("resource", metricKey);
    scope.setTag("host", hostKey);
    if (context) {
      for (const [key, value] of Object.entries(context)) {
        if (value !== null && /^(host|metric|module|operation|integration|device_id)$/i.test(key)) {
          scope.setTag(key, String(value));
        }
      }
    }
    Sentry.captureMessage(message, "fatal");
  });
}

/** Registra evento de conexão de dispositivo com linha própria no Sentry. */
export async function captureLocalDeviceConnected(device: LocalDeviceContext, customHost?: string): Promise<boolean> {
  const hostLabel = customHost || device.operatingSystem || "host-local";
  const title = `[WatchFlow Lifecycle] Dispositivo Conectado com Sucesso: ${hostLabel}`;
  Sentry.withScope((scope) => {
    scope.setLevel("info");
    scope.setFingerprint(["wf-connected-v2", hostLabel]);
    scope.setTag("feature", "local-device-demo");
    scope.setTag("host", hostLabel);
    scope.setTag("resource", "DeviceLifecycle");
    scope.setContext("local_device", device);
    Sentry.captureMessage(title, "info");
  });
  return Sentry.flush(2000);
}

/** Dispara 3 Issues separadas no Sentry (CPU, RAM e GPU) sem agrupar na mesma linha! */
export async function captureOverloadSimulation(host: string): Promise<boolean> {
  const alerts = [
    {
      metric: "CPU",
      title: `[WatchFlow Alert] Uso Excessivo de CPU (94%) em ${host}`,
      value: "94%",
    },
    {
      metric: "RAM",
      title: `[WatchFlow Alert] Esgotamento Crítico de Memória RAM (92%) em ${host}`,
      value: "92%",
    },
    {
      metric: "GPU",
      title: `[WatchFlow Alert] Sobrecarga Crítica de GPU (96%) em ${host}`,
      value: "96%",
    },
  ];

  for (const item of alerts) {
    Sentry.withScope((scope) => {
      scope.setLevel("fatal");
      scope.setFingerprint(["wf-overload-v2", item.metric, host, item.title]);
      scope.setTag("feature", "overload-demo");
      scope.setTag("host", host);
      scope.setTag("metric", item.metric);
      scope.setTag("resource", item.metric);
      scope.setContext("hardware_alert", {
        host,
        metric: item.metric,
        value: item.value,
        threshold: "90%",
      });
      Sentry.captureMessage(item.title, "fatal");
    });
  }

  return Sentry.flush(2500);
}

/** Erro sintético de teste para validação da APM. */
export function triggerTestErrorForAPM(): void {
  Sentry.withScope((scope) => {
    scope.setFingerprint(["wf-manual-test-v2"]);
    scope.setTag("test_event", "true");
    scope.setTag("application", "watchflow");
    Sentry.captureMessage("[WatchFlow Test] Exceção controlada para validação da APM", "error");
  });
}
