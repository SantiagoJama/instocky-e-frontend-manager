import { AuthProvider } from './features/auth/providers/AuthProvider'
import { HomePage } from './pages/home/HomePage'
import { ProtectedView } from './shared/components/ProtectedView'

function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <ProtectedView>
          <HomePage />
        </ProtectedView>
      </div>
    </AuthProvider>
  )
}

export default App
