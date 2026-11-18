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
 * Registra exceções e alertas operacionais com fingerprint único por métrica/título
 * para que cada alerta fique separado na lista do Sentry sem sobrescrever os anteriores!
 */
export function captureAppException(
  error: unknown,
  context?: Record<string, string | number | boolean | null>,
): void {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = error instanceof Error ? error : new Error(message);
  const metricKey = String(context?.metric || context?.operation || message);
  const hostKey = String(context?.host || "default-host");

  Sentry.withScope((scope) => {
    scope.setLevel("fatal");
    // Fingerprint exclusivo garante que CPU, RAM, GPU e Conexão criem Issues separadas no Sentry!
    scope.setFingerprint(["watchflow-issue", metricKey, hostKey, message]);
    scope.setTag("application", "watchflow");
    scope.setTag("resource", metricKey);
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

/** Registra evento de conexão de dispositivo com fingerprint próprio para nunca sumir da lista. */
export async function captureLocalDeviceConnected(device: LocalDeviceContext): Promise<boolean> {
  const hostLabel = device.operatingSystem || "host-local";
  Sentry.withScope((scope) => {
    scope.setLevel("info");
    scope.setFingerprint(["watchflow-device-connected", hostLabel]);
    scope.setTag("feature", "local-device-demo");
    scope.setTag("resource", "DeviceLifecycle");
    scope.setContext("local_device", device);
    Sentry.captureMessage(`[WatchFlow Lifecycle] Dispositivo Conectado com Sucesso: ${hostLabel}`);
  });
  return Sentry.flush(2000);
}

/** Dispara os alertas individuais de sobrecarga (CPU, RAM e GPU) com fingerprints separados por host no Sentry. */
export async function captureOverloadSimulation(host: string): Promise<boolean> {
  const alerts = [
    {
      metric: "CPU",
      title: `[WatchFlow Alert] Uso Excessivo de CPU (>90%) em ${host}`,
      value: "94%",
    },
    {
      metric: "RAM",
      title: `[WatchFlow Alert] Esgotamento Crítico de Memória RAM (>90%) em ${host}`,
      value: "92%",
    },
    {
      metric: "GPU",
      title: `[WatchFlow Alert] Sobrecarga Crítica de GPU (>90%) em ${host}`,
      value: "96%",
    },
  ];

  for (const item of alerts) {
    Sentry.withScope((scope) => {
      scope.setLevel("fatal");
      scope.setFingerprint(["watchflow-overload-alert", item.metric, host]);
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
      Sentry.captureException(new Error(item.title));
    });
  }

  return Sentry.flush(2500);
}

/** Erro sintético de teste para validação da APM. */
export function triggerTestErrorForAPM(): void {
  Sentry.withScope((scope) => {
    scope.setFingerprint(["watchflow-manual-test-error"]);
    scope.setTag("test_event", "true");
    scope.setTag("application", "watchflow");
    Sentry.captureException(new Error("WatchFlow Sentry test: controlled frontend exception"));
  });
}
