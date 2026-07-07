export type AuthUser = {
  id: string
  email: string
  role: string
  firstName: string
  lastName: string
}

export type LoginCredentials = {
  email: string
  password: string
}

export type LoginErrors = Partial<Record<keyof LoginCredentials, string>>

export type AuthTokens = {
  accessToken: string
  expiresIn: number
}

export type LoginResponse = AuthTokens & {
  user: AuthUser
}

export type RefreshResponse = AuthTokens

export type ApiErrorDetail = {
  path: string
  message: string
}

export type ApiErrorBody = {
  error?: {
    code?: string
    message?: string
    requestId?: string
    details?: ApiErrorDetail[]
  }
}

export class AuthApiError extends Error {
  code: string
  status: number
  requestId?: string
  details: ApiErrorDetail[]

  constructor(params: {
    code: string
    message: string
    status: number
    requestId?: string
    details?: ApiErrorDetail[]
  }) {
    super(params.message)
    this.name = 'AuthApiError'
    this.code = params.code
    this.status = params.status
    this.requestId = params.requestId
    this.details = params.details ?? []
  }
}
