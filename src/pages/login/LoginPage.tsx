import { LoginForm } from '../../features/auth/components/login-form/LoginForm'
import './LoginPage.css'

export function LoginPage() {
  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-brand">
          <span className="login-brand__mark" aria-hidden="true">
            IM
          </span>
          <div>
            <p className="login-brand__eyebrow">Admin console</p>
            <h1 id="login-title">Instocky Manager</h1>
          </div>
        </div>

        <LoginForm />
      </section>
    </main>
  )
}
