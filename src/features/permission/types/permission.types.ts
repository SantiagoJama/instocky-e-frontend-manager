export type PermissionStatus = 'all' | 'active' | 'inactive'

export type Permission = {
  id: string
  code: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type UserPermission = {
  id: string
  userId: string
  permission: Permission
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type CreatePermissionPayload = {
  code: string
  name: string
  description: string
}

export type PermissionPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ListPermissionsResponse = {
  data: Permission[]
  pagination: PermissionPagination
}

export type PermissionApiErrorBody = {
  error?: {
    code?: string
    message?: string
    requestId?: string
    details?: unknown
  }
}

export class PermissionApiError extends Error {
  code: string
  status: number
  requestId?: string
  details?: unknown

  constructor(params: { code: string; message: string; status: number; requestId?: string; details?: unknown }) {
    super(params.message)
    this.name = 'PermissionApiError'
    this.code = params.code
    this.status = params.status
    this.requestId = params.requestId
    this.details = params.details
  }
}
