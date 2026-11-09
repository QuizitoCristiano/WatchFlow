import { AuthProvider } from "./contexts/AuthProvider"
import { AppRoutes } from "./routes/AppRoutes"
import { Toaster } from "sonner"

function App() {
  return (
    <>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" richColors theme="dark" closeButton />
      </AuthProvider>
    </>
  )
}

export default App
