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
             {/* <Route path="/agents" element={<Agents />} />

             
            
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/profile" element={<Profile />} /> */}

            {/* Redireciona a raiz '/' para o Dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

        {/* 🔄 REDIRECIONAMENTO DE SEGURANÇA (Rota não encontrada) */}
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}