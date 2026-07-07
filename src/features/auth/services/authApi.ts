import type { LoginCredentials, LoginResponse, RefreshResponse } from '../types/auth.types'
import { AuthApiError, type ApiErrorBody } from '../types/auth.types'
import { authApiRoutes } from '../../../shared/config/apiRoutes'

async function parseAuthResponse<T>(response: Response) {
  if (response.ok) {
    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }

  let errorBody: ApiErrorBody

  try {
    errorBody = (await response.json()) as ApiErrorBody
  } catch {
    errorBody = {}
  }

  throw new AuthApiError({
    code: errorBody.error?.code ?? response.statusText ?? 'AUTH_ERROR',
    message: errorBody.error?.message ?? 'No se pudo completar la autenticacion.',
    status: response.status,
    requestId: errorBody.error?.requestId,
    details: errorBody.error?.details,
  })
}

export async function loginRequest(credentials: LoginCredentials) {
  const response = await fetch(authApiRoutes.login(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(credentials),
  })

  return parseAuthResponse<LoginResponse>(response)
}

export async function refreshAccessTokenRequest() {
  const response = await fetch(authApiRoutes.refresh(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({}),
  })

  return parseAuthResponse<RefreshResponse>(response)
}

export async function logoutRequest() {
  const response = await fetch(authApiRoutes.logout(), {
    method: 'POST',
    credentials: 'include',
  })

  return parseAuthResponse<void>(response)
}
