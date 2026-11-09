import * as Sentry from "@sentry/react";

/**
 * Inicialização oficial da APM Sentry no WatchFlow
 * Projeto: watchflow-app (Organização: watchflow)
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN || "https://e8f60973d14ecee78fdbdbb743c5967d:8e4519e9b907d75b17e4af845ee4bbc1@o4512403331481600.ingest.de.sentry.io/4512403371917392";

  try {
    Sentry.init({
      dsn,
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      tracesSampleRate: 1.0,
      tracePropagationTargets: ["localhost", /^https:\/\/.*\.vercel\.app/],
      environment: import.meta.env.MODE || "development",
      release: "watchflow@1.0.0",
    });

    console.log("🚀 [APM] Sentry inicializado com sucesso no WatchFlow!");
  } catch (err) {
    console.error("Falha ao inicializar o Sentry:", err);
  }
}

/**
 * Envia uma mensagem ou exceção manual para o dashboard do Sentry
 * Garante nível de severidade e fingerprint para aparecer como Issue separada
 */
export function captureAppException(error: Error | string | unknown, context?: Record<string, any>) {
  console.warn("📡 [WatchFlow APM] Despachando evento ao Sentry:", error, context);

  const errorObj = typeof error === 'string' ? new Error(error) : (error instanceof Error ? error : new Error(String(error)));
  const metricTag = context?.metric || 'General';

  Sentry.withScope((scope) => {
    scope.setLevel('fatal');
    scope.setFingerprint([errorObj.message, metricTag]);
    if (context) {
      scope.setExtras(context);
      if (context.host) scope.setTag('host', context.host);
      if (context.metric) scope.setTag('resource', context.metric);
    }
    Sentry.captureException(errorObj);
  });
}

/**
 * Função de demonstração ao vivo para a banca e para o professor:
 */
export function triggerTestErrorForAPM() {
  try {
    throw new Error("WatchFlow APM Test Error: Simulação de falha controlada para validação na banca UTP");
  } catch (err) {
    Sentry.captureException(err);
  }
}
