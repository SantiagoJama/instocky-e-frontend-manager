export type ManagerUserRole = 'admin' | 'support'
export type ManagerUserStatus = 'all' | 'active' | 'inactive'

export type ManagerUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  role: ManagerUserRole
  isActive: boolean
  passwordChangedAt: string | null
  lastLoginAt: string | null
  createdAt: string
}

export type ManagerUserPayload = {
  firstName: string
  lastName: string
  email: string
  password: string
  role: ManagerUserRole
}

export type UpdateManagerUserPayload = Partial<Pick<ManagerUserPayload, 'firstName' | 'lastName' | 'email'>>

export type UserPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ListManagerUsersResponse = {
  data: ManagerUser[]
  pagination: UserPagination
}

export type UserApiErrorBody = {
  error?: {
    code?: string
    message?: string
    requestId?: string
    details?: unknown
  }
}

export class UserApiError extends Error {
  code: string
  status: number
  requestId?: string
  details?: unknown

  constructor(params: { code: string; message: string; status: number; requestId?: string; details?: unknown }) {
    super(params.message)
    this.name = 'UserApiError'
    this.code = params.code
    this.status = params.status
    this.requestId = params.requestId
    this.details = params.details
  }
}
