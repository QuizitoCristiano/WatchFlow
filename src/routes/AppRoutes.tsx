import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/layouts/MainLayout';
import { ProtectedRoute } from '@/layouts/ProtectedRoute';
import { Login } from '@/auth/Login';
import { Register } from '@/auth/Register';
import { ForgotPassword } from '@/auth/ForgotPassword';
import { NotFound } from '@/NotFound/NotFound';

const Dashboard = lazy(() => import('@/pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const Integrations = lazy(() => import('@/pages/Integrations').then((module) => ({ default: module.Integrations })));
const DispositivosPage = lazy(() => import('@/pages/Dispositivos').then((module) => ({ default: module.DispositivosPage })));
const MetricasPage = lazy(() => import('@/pages/Metrics').then((module) => ({ default: module.MetricasPage })));
const EquipePage = lazy(() => import('@/pages/EquipePage').then((module) => ({ default: module.EquipePage })));
const AlertsPage = lazy(() => import('@/pages/Alerts'));
const ReportsPage = lazy(() => import('@/pages/Reports'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const ProfilePage = lazy(() => import('@/pages/Profile'));
const CollectorDemo = lazy(() => import('@/pages/CollectorDemo').then((module) => ({ default: module.CollectorDemo })));

function RouteLoadingFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-bg-app text-text-muted" role="status" aria-live="polite">
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent" />
      <span className="ml-3 text-sm">Carregando módulo...</span>
    </div>
  );
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          {/* ROTAS PÚBLICAS */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<Navigate to="/dashboard" replace />} />
          <Route path="/auth/forgot-password" element={<ForgotPassword />} />

          {/* ROTAS PROTEGIDAS */}
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
              {import.meta.env.DEV && <Route path="/collector-demo" element={<CollectorDemo />} />}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>

          {/* ROTA 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
