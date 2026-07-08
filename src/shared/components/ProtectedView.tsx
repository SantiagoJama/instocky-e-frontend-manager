import type { ReactNode } from 'react'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { LoginPage } from '../../pages/login/LoginPage'

export function ProtectedView({ children }: { children: ReactNode }) {
  const { isAuthenticated, isRestoringSession } = useAuth()

  if (isRestoringSession) {
    return (
      <main className="login-page">
        <section className="login-panel" aria-live="polite">
          <div className="login-brand">
            <span className="login-brand__mark" aria-hidden="true">
              IM
            </span>
            <div>
              <p className="login-brand__eyebrow">Instocky - Admin Console</p>
              <h1>Restaurando sesion</h1>
            </div>
          </div>
        </section>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return children
}
