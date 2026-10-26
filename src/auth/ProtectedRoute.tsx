import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";

export const ProtectedRoute = () => {
  // Alterado 'loading' para 'isLoading' conforme declarado no AuthContextType
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg-app flex items-center justify-center text-text-muted">
        Carregando...
      </div>
    );
  }

  // Se não está logado, vai para o login
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }

  // 🛡️ SECURITY BY DESIGN: Impede qualquer usuário com e-mail NÃO verificado de acessar a plataforma
  if (!user.emailVerified) {
    return <Navigate to="/verify-email" replace state={{ email: user.email }} />;
  }

  return <Outlet />;
};