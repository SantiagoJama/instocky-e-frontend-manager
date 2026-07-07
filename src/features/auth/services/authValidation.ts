import type { LoginCredentials, LoginErrors } from '../types/auth.types'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const minPasswordLength = 8

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function validateLoginForm(credentials: LoginCredentials) {
  const errors: LoginErrors = {}
  const email = normalizeEmail(credentials.email)
  const password = credentials.password

  if (!email) {
    errors.email = 'El email es obligatorio.'
  } else if (!emailPattern.test(email)) {
    errors.email = 'Ingresa un email valido.'
  }

  if (!password) {
    errors.password = 'La contrasena es obligatoria.'
  } else if (password.length < minPasswordLength) {
    errors.password = `La contrasena debe tener al menos ${minPasswordLength} caracteres.`
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0,
    values: {
      email,
      password,
    },
  }
}
