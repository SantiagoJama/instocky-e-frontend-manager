import { useMemo, useState, type FormEvent } from 'react'
import { FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi'
import Swal from 'sweetalert2'
import { useAuth } from '../../hooks/useAuth'
import { validateLoginForm } from '../../services/authValidation'
import { AuthApiError, type LoginCredentials, type LoginErrors } from '../../types/auth.types'
import './LoginForm.css'

const initialValues: LoginCredentials = {
  email: '',
  password: '',
}

export function LoginForm() {
  const { login } = useAuth()
  const [values, setValues] = useState<LoginCredentials>(initialValues)
  const [errors, setErrors] = useState<LoginErrors>({})
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isFormReady = useMemo(
    () => values.email.trim().length > 0 && values.password.length > 0,
    [values.email, values.password],
  )

  function updateField(field: keyof LoginCredentials, value: string) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)

    const result = validateLoginForm(values)

    if (!result.isValid) {
      setErrors(result.errors)
      setIsSubmitting(false)
      return
    }

    try {
      await login(result.values)
      await Swal.fire({
        title: 'Sesion iniciada',
        text: 'Bienvenido a Instocky Manager.',
        icon: 'success',
        timer: 1200,
        showConfirmButton: false,
      })
    } catch (error) {
      const nextErrors = mapLoginError(error)

      if (nextErrors) {
        setErrors(nextErrors)
      }

      await Swal.fire({
        title: 'No se pudo iniciar sesion',
        text: getLoginErrorMessage(error),
        icon: 'error',
        confirmButtonText: 'Entendido',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="login-form" noValidate onSubmit={handleSubmit}>
      <div className="field-group">
        <label htmlFor="email">Email</label>
        <div className={`input-control ${errors.email ? 'input-control--error' : ''}`}>
          <FiMail aria-hidden="true" />
          <input
            id="email"
            name="email"
            type="email"
            value={values.email}
            autoComplete="username"
            inputMode="email"
            placeholder="admin@instocky.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
            onChange={(event) => updateField('email', event.target.value)}
          />
        </div>
        {errors.email ? (
          <p className="field-error" id="email-error">
            {errors.email}
          </p>
        ) : null}
      </div>

      <div className="field-group">
        <label htmlFor="password">Password</label>
        <div className={`input-control ${errors.password ? 'input-control--error' : ''}`}>
          <FiLock aria-hidden="true" />
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={values.password}
            autoComplete="current-password"
            placeholder="Minimo 8 caracteres"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
            onChange={(event) => updateField('password', event.target.value)}
          />
          <button
            className="icon-button"
            type="button"
            aria-label={showPassword ? 'Ocultar password' : 'Mostrar password'}
            onClick={() => setShowPassword((current) => !current)}
          >
            {showPassword ? <FiEyeOff aria-hidden="true" /> : <FiEye aria-hidden="true" />}
          </button>
        </div>
        {errors.password ? (
          <p className="field-error" id="password-error">
            {errors.password}
          </p>
        ) : null}
      </div>

      <button className="primary-button" type="submit" disabled={!isFormReady || isSubmitting}>
        {isSubmitting ? 'Validando...' : 'Ingresar'}
      </button>
    </form>
  )
}

function mapLoginError(error: unknown): LoginErrors | null {
  if (!(error instanceof AuthApiError) || error.details.length === 0) {
    return null
  }

  return error.details.reduce<LoginErrors>((currentErrors, detail) => {
    if (detail.path === 'email' || detail.path === 'password') {
      currentErrors[detail.path] = detail.message
    }

    return currentErrors
  }, {})
}

function getLoginErrorMessage(error: unknown) {
  if (!(error instanceof AuthApiError)) {
    return 'Revisa tu conexion e intenta nuevamente.'
  }

  if (error.status === 401) {
    return 'El email o password no son correctos.'
  }

  if (error.status === 429) {
    return 'Hay demasiados intentos. Espera un momento antes de intentar otra vez.'
  }

  if (error.code === 'VALIDATION_ERROR') {
    return 'Revisa los campos marcados e intenta nuevamente.'
  }

  return error.message
}
