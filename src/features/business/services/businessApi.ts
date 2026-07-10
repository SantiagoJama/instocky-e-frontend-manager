import { businessApiRoutes } from '../../../shared/config/apiRoutes'
import type {
  AvailableBusinessModule,
  BusinessApiErrorBody,
  BusinessAggregate,
  BusinessModule,
  BusinessUser,
  BusinessUserPayload,
  ListBusinessesResponse,
  UpdateBusinessPayload,
  UpdateBusinessUserPayload,
} from '../types/business.types'
import { BusinessApiError } from '../types/business.types'

type RequestOptions = {
  accessToken: string
}

type ListBusinessesParams = RequestOptions & {
  page: number
  limit: number
  search?: string
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

async function parseBusinessResponse<T>(response: Response) {
  if (response.ok) {
    return (await response.json()) as T
  }

  let errorBody: BusinessApiErrorBody

  try {
    errorBody = (await response.json()) as BusinessApiErrorBody
  } catch {
    errorBody = {}
  }

  throw new BusinessApiError({
    code: errorBody.error?.code ?? response.statusText ?? 'BUSINESS_ERROR',
    message: errorBody.error?.message ?? 'No se pudo completar la solicitud.',
    status: response.status,
    requestId: errorBody.error?.requestId,
    details: errorBody.error?.details,
  })
}

export async function listBusinessesRequest({ accessToken, page, limit, search }: ListBusinessesParams) {
  const url = new URL(businessApiRoutes.list())
  url.searchParams.set('page', String(page))
  url.searchParams.set('limit', String(limit))

  if (search?.trim()) {
    url.searchParams.set('search', search.trim())
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: authHeaders(accessToken),
  })

  return parseBusinessResponse<ListBusinessesResponse>(response)
}

export async function getBusinessDetailRequest(businessId: string, { accessToken }: RequestOptions) {
  const response = await fetch(businessApiRoutes.detail(businessId), {
    method: 'GET',
    headers: authHeaders(accessToken),
  })

  return parseBusinessResponse<{ data: BusinessAggregate }>(response)
}

export async function listAvailableBusinessModulesRequest({ accessToken }: RequestOptions) {
  const response = await fetch(businessApiRoutes.modules(), {
    method: 'GET',
    headers: authHeaders(accessToken),
  })

  return parseBusinessResponse<{ data: AvailableBusinessModule[] }>(response)
}

export async function updateBusinessRequest(
  businessId: string,
  payload: UpdateBusinessPayload,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(businessApiRoutes.update(businessId), {
    method: 'PATCH',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify(payload),
  })

  return parseBusinessResponse<{ data: BusinessAggregate }>(response)
}

export async function updateBusinessStatusRequest(
  businessId: string,
  isActive: boolean,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(businessApiRoutes.status(businessId), {
    method: 'PATCH',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({ is_active: isActive }),
  })

  return parseBusinessResponse<{ data: BusinessAggregate }>(response)
}

export async function createBusinessUserRequest(
  businessId: string,
  payload: Required<BusinessUserPayload>,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(businessApiRoutes.users(businessId), {
    method: 'POST',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify(payload),
  })

  return parseBusinessResponse<{ data: BusinessUser }>(response)
}

export async function updateBusinessUserRequest(
  businessId: string,
  businessUserId: string,
  payload: UpdateBusinessUserPayload,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(businessApiRoutes.user(businessId, businessUserId), {
    method: 'PATCH',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify(payload),
  })

  return parseBusinessResponse<{ data: BusinessUser }>(response)
}

export async function updateBusinessUserStatusRequest(
  businessId: string,
  businessUserId: string,
  isActive: boolean,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(businessApiRoutes.userStatus(businessId, businessUserId), {
    method: 'PATCH',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({ is_active: isActive }),
  })

  return parseBusinessResponse<{ data: BusinessUser }>(response)
}

export async function changeBusinessUserPasswordRequest(
  businessId: string,
  businessUserId: string,
  password: string,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(businessApiRoutes.userPassword(businessId, businessUserId), {
    method: 'PATCH',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({ password }),
  })

  return parseBusinessResponse<{ data: BusinessUser }>(response)
}

export async function updateBusinessModuleStatusRequest(
  businessId: string,
  moduleId: string,
  isActive: boolean,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(businessApiRoutes.moduleStatus(businessId, moduleId), {
    method: 'PATCH',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({ is_active: isActive }),
  })

  return parseBusinessResponse<{ data: BusinessModule }>(response)
}

export async function addBusinessModuleRequest(
  businessId: string,
  moduleId: string,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(businessApiRoutes.businessModules(businessId), {
    method: 'POST',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({ module_id: Number(moduleId) }),
  })

  return parseBusinessResponse<{ data: BusinessModule }>(response)
}
