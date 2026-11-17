import { AuthProvider } from "./contexts/AuthProvider";
import { AppRoutes } from "./routes/AppRoutes";
import { Toaster } from "sonner";
import * as Sentry from "@sentry/react";

function App() {
  return (
    <AuthProvider>
      <Sentry.ErrorBoundary
        fallback={({ resetError }) => (
          <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--color-bg-app)] p-6 text-[var(--color-text-heading)]">
            <h1 className="text-xl font-semibold">Ocorreu um erro inesperado</h1>
            <p className="max-w-md text-center text-sm text-[var(--color-text-muted)]">
              O WatchFlow registrou a falha. Tente carregar a tela novamente.
            </p>
            <button
              type="button"
              className="rounded-md bg-[var(--color-brand-primary)] px-4 py-2 text-white"
              onClick={resetError}
            >
              Tentar novamente
            </button>
          </main>
        )}
      >
        <AppRoutes />
      </Sentry.ErrorBoundary>
      <Toaster position="top-right" richColors theme="dark" closeButton />
    </AuthProvider>
  );
}

export default App;
