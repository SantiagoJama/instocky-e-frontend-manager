import { permissionApiRoutes } from '../../../shared/config/apiRoutes'
import type {
  CreatePermissionPayload,
  ListPermissionsResponse,
  Permission,
  PermissionApiErrorBody,
  PermissionStatus,
  UserPermission,
} from '../types/permission.types'
import { PermissionApiError } from '../types/permission.types'

type RequestOptions = {
  accessToken: string
}

type ListPermissionsParams = RequestOptions & {
  page: number
  limit: number
  search?: string
  status: PermissionStatus
}

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  }
}

function jsonHeaders(accessToken: string) {
  return {
    ...authHeaders(accessToken),
    'Content-Type': 'application/json',
  }
}

async function parsePermissionResponse<T>(response: Response) {
  if (response.ok) {
    return (await response.json()) as T
  }

  let errorBody: PermissionApiErrorBody

  try {
    errorBody = (await response.json()) as PermissionApiErrorBody
  } catch {
    errorBody = {}
  }

  throw new PermissionApiError({
    code: errorBody.error?.code ?? response.statusText ?? 'PERMISSION_ERROR',
    message: errorBody.error?.message ?? 'No se pudo completar la solicitud.',
    status: response.status,
    requestId: errorBody.error?.requestId,
    details: errorBody.error?.details,
  })
}

export async function listPermissionsRequest({ accessToken, page, limit, search, status }: ListPermissionsParams) {
  const url = new URL(permissionApiRoutes.list())
  url.searchParams.set('page', String(page))
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('status', status)

  if (search?.trim()) {
    url.searchParams.set('search', search.trim())
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: authHeaders(accessToken),
  })

  return parsePermissionResponse<ListPermissionsResponse>(response)
}

export async function createPermissionRequest(payload: CreatePermissionPayload, { accessToken }: RequestOptions) {
  const response = await fetch(permissionApiRoutes.create(), {
    method: 'POST',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify(payload),
  })

  return parsePermissionResponse<{ data: Permission }>(response)
}

export async function updatePermissionStatusRequest(
  permissionId: string,
  isActive: boolean,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(permissionApiRoutes.status(permissionId), {
    method: 'PATCH',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({ isActive }),
  })

  return parsePermissionResponse<{ data: Permission }>(response)
}

export async function listUserPermissionsRequest(userId: string, { accessToken }: RequestOptions) {
  const response = await fetch(permissionApiRoutes.userPermissions(userId), {
    method: 'GET',
    headers: authHeaders(accessToken),
  })

  return parsePermissionResponse<{ data: UserPermission[] }>(response)
}

export async function assignPermissionToUserRequest(
  userId: string,
  permissionId: string,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(permissionApiRoutes.assignToUser(userId), {
    method: 'POST',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({ permissionId }),
  })

  return parsePermissionResponse<{ data: UserPermission }>(response)
}

export async function updateUserPermissionStatusRequest(
  userId: string,
  permissionId: string,
  isActive: boolean,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(permissionApiRoutes.userPermissionStatus(userId, permissionId), {
    method: 'PATCH',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({ isActive }),
  })

  return parsePermissionResponse<{ data: UserPermission }>(response)
}
