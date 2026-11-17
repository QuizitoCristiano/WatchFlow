import { AuthProvider } from "./contexts/AuthProvider"
import { PreferencesProvider } from "./contexts/PreferencesProvider"
import { AppRoutes } from "./routes/AppRoutes"
import { Toaster } from "sonner"

function App() {
  return (
    <>
      <AuthProvider>
        <PreferencesProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors theme="dark" closeButton />
        </PreferencesProvider>
      </AuthProvider>
    </>
  )
}

export default App
