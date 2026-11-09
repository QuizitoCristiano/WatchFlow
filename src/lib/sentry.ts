import * as Sentry from "@sentry/react";

/**
 * Inicialização oficial da APM Sentry no WatchFlow
 * Projeto: watchflow-app (Organização: watchflow)
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN || "https://e0f60973d14ecee78fdbdbb743c5967d@o4512403331481600.ingest.de.sentry.io/4512403371917392";

  try {
    Sentry.init({
      dsn,
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      // 100% das transações capturadas para a apresentação acadêmica
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
 */
export function captureAppException(error: Error | unknown, context?: Record<string, any>) {
  console.warn("📡 [WatchFlow APM] Despachando evento ao Sentry:", error, context);
  Sentry.captureException(error, { extra: context });
}

/**
 * Função de demonstração ao vivo para a banca e para o professor:
 * Dispara um evento real no dashboard do Sentry!
 */
export function triggerTestErrorForAPM() {
  Sentry.captureMessage("WatchFlow APM Conectado: Validação de telemetria e integridade para a banca UTP", "info");
}
