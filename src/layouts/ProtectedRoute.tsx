import { useAuth } from "@/contexts/useAuth";
import { FullPageLoading } from "@/loading/FullPageLoading";
import { Navigate, Outlet, useLocation } from "react-router-dom";

/**
 * Pattern: Guard / Interceptor
 * Conceito: Security by Design (Fail-Closed, Least Privilege)
 */
export const ProtectedRoute = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Guard 1: Estado de carregamento assíncrono (Evita FOUC e redirecionamento falso)
  if (isLoading) {
    return <FullPageLoading />;
  }

  // Guard 2: Autenticação principal (Fail-Closed: Bloqueia por padrão se não houver sessão válida)
  if (!isAuthenticated || !user) {
    // Redireciona para o caminho correto (/auth/login) preservando a intenção de navegação do usuário
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Guard 3: Validação de E-mail (Security Strategy)
  // OAuth (Google/GitHub) já garante a verificação do e-mail na origem.
  // Provedores de senha exigem validação explicita do flag 'emailVerified'.
  const isOAuthUser = user.providerData.some(
    (provider) => provider.providerId === "google.com" || provider.providerId === "github.com"
  );

  const isEmailVerified = user.emailVerified || isOAuthUser;

  if (!isEmailVerified) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  // Permissão concedida
  return <Outlet />;
};