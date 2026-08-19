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



export function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🔓 ROTAS PÚBLICAS / AUTENTICAÇÃO */}
        <Route path="/auth/login" element={<Login />} />
         <Route path="/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} /> 

        {/* 🛡️ ROTAS PROTEGIDAS (Exigem Login e usam o MainLayout) */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
           <Route path="/dashboard" element={<Dashboard />} />
             <Route path="/integrations" element={<Integrations/>} />
             <Route path="/devices" element={<DispositivosPage/>} />
              <Route path="/metrics" element={<MetricasPage />} />
              <Route path='/about' element={<EquipePage/>}/>
               <Route path="/alerts" element={<AlertsPage />} />
               <Route path='/reports' element={<ReportsPage/>}/>
               <Route path='/settings' element={<SettingsPage/>}/>
               <Route path="/profile" element={<ProfilePage />} />
            
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

        {/* 🔄 REDIRECIONAMENTO DE SEGURANÇA (Rota não encontrada) */}
        <Route path="*" element={<NotFound/>} />
      </Routes>
    </BrowserRouter>
  );
}