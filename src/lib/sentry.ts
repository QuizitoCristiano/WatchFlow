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

/**
 * Inicialização da APM Sentry no WatchFlow.
 * O DSN deve ser fornecido por VITE_SENTRY_DSN no ambiente de execução.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) {
    console.warn("[APM] Sentry não inicializado: VITE_SENTRY_DSN não configurado.");
    return;
  }

  try {
    Sentry.init({
      dsn,
      integrations: [Sentry.browserTracingIntegration()],
      tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
      tracePropagationTargets: ["localhost", /^https:\/\/.*\.vercel\.app/],
      environment: import.meta.env.MODE || "development",
      release: "watchflow@1.0.0",
    });
    console.info("[APM] Sentry inicializado.");
  } catch (error) {
    console.error("[APM] Falha ao inicializar o Sentry:", error);
  }
}

export function isSentryConfigured(): boolean {
  return Boolean(import.meta.env.VITE_SENTRY_DSN);
}

/** Envia exceções reais do frontend ao Sentry. */
export function captureAppException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  const errorObj = error instanceof Error
    ? error
    : new Error(typeof error === "string" ? error : String(error));

  Sentry.withScope((scope) => {
    scope.setLevel("error");
    if (context) {
      scope.setExtras(context);
      if (typeof context.host === "string") scope.setTag("host", context.host);
      if (typeof context.metric === "string") scope.setTag("resource", context.metric);
    }
    Sentry.captureException(errorObj);
  });
}

/**
 * Registra no Sentry que o usuário solicitou a conexão deste navegador.
 * Os dados são metadados disponíveis no navegador, não métricas físicas de CPU.
 */
export function captureLocalDeviceConnected(device: LocalDeviceContext): void {
  Sentry.withScope((scope) => {
    scope.setLevel("info");
    scope.setTag("feature", "local-device-demo");
    scope.setContext("local_device", device);
    Sentry.captureMessage("WatchFlow: dispositivo local conectado pelo usuário");
  });
}

/**
 * Envia uma simulação identificada como demonstração. Não gera carga real
 * na máquina e não deve ser interpretada como telemetria física.
 */
export function captureOverloadSimulation(host: string): void {
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
}

/** Mantido para testes manuais controlados da integração APM. */
export function triggerTestErrorForAPM(): void {
  Sentry.captureException(
    new Error("WatchFlow APM Test Error: falha controlada para validar a integração"),
  );
}
