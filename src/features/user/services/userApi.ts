import { userApiRoutes } from '../../../shared/config/apiRoutes'
import type {
  ListManagerUsersResponse,
  ManagerUser,
  ManagerUserPayload,
  ManagerUserStatus,
  UpdateManagerUserPayload,
  UserApiErrorBody,
} from '../types/user.types'
import { UserApiError } from '../types/user.types'

type RequestOptions = {
  accessToken: string
}

type ListManagerUsersParams = RequestOptions & {
  page: number
  limit: number
  search?: string
  status: ManagerUserStatus
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

async function parseUserResponse<T>(response: Response) {
  if (response.ok) {
    if (response.status === 204) {
      return undefined as T
    }

    return (await response.json()) as T
  }

  let errorBody: UserApiErrorBody

  try {
    errorBody = (await response.json()) as UserApiErrorBody
  } catch {
    errorBody = {}
  }

  throw new UserApiError({
    code: errorBody.error?.code ?? response.statusText ?? 'USER_ERROR',
    message: errorBody.error?.message ?? 'No se pudo completar la solicitud.',
    status: response.status,
    requestId: errorBody.error?.requestId,
    details: errorBody.error?.details,
  })
}

export async function listManagerUsersRequest({ accessToken, page, limit, search, status }: ListManagerUsersParams) {
  const url = new URL(userApiRoutes.list())
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

  return parseUserResponse<ListManagerUsersResponse>(response)
}

export async function createManagerUserRequest(payload: ManagerUserPayload, { accessToken }: RequestOptions) {
  const response = await fetch(userApiRoutes.create(), {
    method: 'POST',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify(payload),
  })

  return parseUserResponse<{ data: ManagerUser }>(response)
}

export async function updateManagerUserRequest(
  userId: string,
  payload: UpdateManagerUserPayload,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(userApiRoutes.update(userId), {
    method: 'PATCH',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify(payload),
  })

  return parseUserResponse<{ data: ManagerUser }>(response)
}

export async function updateManagerUserStatusRequest(
  userId: string,
  isActive: boolean,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(userApiRoutes.status(userId), {
    method: 'PATCH',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({ isActive }),
  })

  return parseUserResponse<{ data: ManagerUser }>(response)
}

export async function changeManagerUserPasswordRequest(userId: string, password: string, { accessToken }: RequestOptions) {
  const response = await fetch(userApiRoutes.password(userId), {
    method: 'PATCH',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({ password }),
  })

  return parseUserResponse<void>(response)
}
