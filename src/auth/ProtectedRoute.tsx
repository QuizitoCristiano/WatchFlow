import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/useAuth";

export const ProtectedRoute = () => {
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

  return <Outlet />;
};
