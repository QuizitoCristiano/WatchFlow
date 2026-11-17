import { AuthProvider } from './contexts/AuthProvider';
import { PreferencesProvider } from './contexts/PreferencesProvider';
import { usePreferences } from './contexts/usePreferences';
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
