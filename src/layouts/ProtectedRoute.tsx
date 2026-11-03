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
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Guard 3: Validação de E-mail (Security Strategy)
  const providerData = user.providerData || [];
  const isOAuthUser = providerData.some(
    (provider) => provider.providerId === "google.com" || provider.providerId === "github.com"
  );

  const isEmailVerified = user.emailVerified || isOAuthUser;

  if (!isEmailVerified) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />;
  }

  // Permissão concedida
  return <Outlet />;
};
