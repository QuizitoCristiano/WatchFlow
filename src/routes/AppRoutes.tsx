import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { ProtectedRoute } from '@/layouts/ProtectedRoute';
import { Login } from '@/auth/Login';
import { Register } from '@/auth/Register';
import { ForgotPassword } from '@/auth/ForgotPassword';
import { Dashboard } from '@/pages/Dashboard';
import { Integrations } from '@/pages/Integrations';
import { DispositivosPage } from '@/pages/Dispositivos';
import { MetricasPage } from '@/pages/Metrics';
import { EquipePage } from '@/pages/EquipePage';
import AlertsPage from '@/pages/Alerts';
import ReportsPage from '@/pages/Reports';
import SettingsPage from '@/pages/SettingsPage';
import ProfilePage from '@/pages/Profile';
import { NotFound } from '@/NotFound/NotFound';
import { VerifyEmail } from '@/auth/VerifyEmail';

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🔓 ROTAS PÚBLICAS */}
        <Route path="/auth/login" element={<Login />} />
        
        {/* Alias de redirecionamento de /login para /auth/login (Atende a issue WF-6) */}
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />

        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} /> {/* 👈 ROTA DA VERIFICAÇÃO */}
        <Route path="/auth/forgot-password" element={<ForgotPassword />} /> 

        {/* 🛡️ ROTAS PROTEGIDAS */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/integrations" element={<Integrations />} />
            <Route path="/devices" element={<DispositivosPage />} />
            <Route path="/metrics" element={<MetricasPage />} />
            <Route path="/about" element={<EquipePage />} />
            <Route path="/alerts" element={<AlertsPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

        {/* 🔄 ROTA 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}