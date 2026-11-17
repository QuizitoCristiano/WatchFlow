import { AuthProvider } from './contexts/AuthProvider';
import { PreferencesProvider, usePreferences } from './contexts/PreferencesProvider';
import { AppRoutes } from './routes/AppRoutes';
import { Toaster } from 'sonner';

function AppShell() {
  const { preferences } = usePreferences();
  return (
    <>
      <AppRoutes />
      <Toaster position="top-right" richColors theme={preferences.theme} closeButton />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <AppShell />
      </PreferencesProvider>
    </AuthProvider>
  );
}

export default App;
