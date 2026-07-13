import { businessApiRoutes } from '../../../shared/config/apiRoutes'
import type {
  BusinessCategory,
  BusinessTypeCatalogResponse,
  BusinessType,
  BusinessTypesResponse,
  CategoryApiErrorBody,
  CreateBusinessCategoryPayload,
  CreateBusinessTypePayload,
  UpdateBusinessCategoryPayload,
  UpdateBusinessTypePayload,
} from '../types/category.types'
import { CategoryApiError } from '../types/category.types'

type RequestOptions = {
  accessToken: string
}

type ListBusinessTypesParams = RequestOptions & {
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

async function parseCategoryResponse<T>(response: Response) {
  if (response.ok) {
    return (await response.json()) as T
  }

  let errorBody: CategoryApiErrorBody

  try {
    errorBody = (await response.json()) as CategoryApiErrorBody
  } catch {
    errorBody = {}
  }

  throw new CategoryApiError({
    code: errorBody.error?.code ?? response.statusText ?? 'CATEGORY_ERROR',
    message: errorBody.error?.message ?? 'No se pudo completar la solicitud.',
    status: response.status,
    requestId: errorBody.error?.requestId,
    details: errorBody.error?.details,
  })
}

export async function listBusinessTypesRequest({ accessToken, page, limit, search }: ListBusinessTypesParams) {
  const url = new URL(businessApiRoutes.types())
  url.searchParams.set('page', String(Math.max(1, page)))
  url.searchParams.set('limit', String(Math.min(100, Math.max(1, limit))))

  if (search?.trim()) {
    url.searchParams.set('search', search.trim())
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: authHeaders(accessToken),
  })

  return parseCategoryResponse<BusinessTypesResponse>(response)
}

export async function listBusinessTypeCatalogRequest({ accessToken, page, limit, search }: ListBusinessTypesParams) {
  const url = new URL(businessApiRoutes.typesAll())
  url.searchParams.set('page', String(Math.max(1, page)))
  url.searchParams.set('limit', String(Math.min(100, Math.max(1, limit))))

  if (search?.trim()) {
    url.searchParams.set('search', search.trim())
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: authHeaders(accessToken),
  })

  return parseCategoryResponse<BusinessTypeCatalogResponse>(response)
}

export async function createBusinessTypeRequest(payload: CreateBusinessTypePayload, { accessToken }: RequestOptions) {
  const response = await fetch(businessApiRoutes.createType(), {
    method: 'POST',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify(payload),
  })

  return parseCategoryResponse<{ data: BusinessType }>(response)
}

export async function updateBusinessTypeRequest(
  businessTypeId: string,
  payload: UpdateBusinessTypePayload,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(businessApiRoutes.updateType(businessTypeId), {
    method: 'PATCH',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify(payload),
  })

  return parseCategoryResponse<{ data: BusinessType }>(response)
}

export async function updateBusinessTypeStatusRequest(
  businessTypeId: string,
  isActive: boolean,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(businessApiRoutes.typeStatus(businessTypeId), {
    method: 'PATCH',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({ is_active: isActive }),
  })

  return parseCategoryResponse<{ data: BusinessType }>(response)
}

export async function createBusinessCategoryRequest(
  businessTypeId: string,
  payload: CreateBusinessCategoryPayload,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(businessApiRoutes.categories(businessTypeId), {
    method: 'POST',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify(payload),
  })

  return parseCategoryResponse<{ data: BusinessCategory }>(response)
}

export async function updateBusinessCategoryRequest(
  businessTypeId: string,
  businessCategoryId: string,
  payload: UpdateBusinessCategoryPayload,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(businessApiRoutes.updateCategory(businessTypeId, businessCategoryId), {
    method: 'PATCH',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify(payload),
  })

  return parseCategoryResponse<{ data: BusinessCategory }>(response)
}

export async function updateBusinessCategoryStatusRequest(
  businessTypeId: string,
  businessCategoryId: string,
  isActive: boolean,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(businessApiRoutes.categoryStatus(businessTypeId, businessCategoryId), {
    method: 'PATCH',
    headers: jsonHeaders(accessToken),
    body: JSON.stringify({ is_active: isActive }),
  })

  return parseCategoryResponse<{ data: BusinessCategory }>(response)
}
