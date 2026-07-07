import { businessApiRoutes, customerApiRoutes } from '../../../shared/config/apiRoutes'
import type {
  BusinessModulesResponse,
  CreateCustomerPayload,
  CustomerApiErrorBody,
  ListCustomersResponse,
  UpdateCustomerPayload,
} from '../types/customer.types'
import { CustomerApiError } from '../types/customer.types'

type RequestOptions = {
  accessToken: string
}

type ListCustomersParams = RequestOptions & {
  page: number
  limit: number
  search?: string
}

async function parseCustomerResponse<T>(response: Response) {
  if (response.ok) {
    return (await response.json()) as T
  }

  let errorBody: CustomerApiErrorBody

  try {
    errorBody = (await response.json()) as CustomerApiErrorBody
  } catch {
    errorBody = {}
  }

  throw new CustomerApiError({
    code: errorBody.error?.code ?? response.statusText ?? 'CUSTOMER_ERROR',
    message: errorBody.error?.message ?? 'No se pudo completar la solicitud.',
    status: response.status,
    requestId: errorBody.error?.requestId,
    details: errorBody.error?.details,
  })
}

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  }
}

export async function getBusinessModulesRequest({ accessToken }: RequestOptions) {
  const response = await fetch(businessApiRoutes.modules(), {
    method: 'GET',
    headers: authHeaders(accessToken),
  })

  return parseCustomerResponse<BusinessModulesResponse>(response)
}

export async function createCustomerRequest(payload: CreateCustomerPayload, { accessToken }: RequestOptions) {
  const response = await fetch(customerApiRoutes.create(), {
    method: 'POST',
    headers: {
      ...authHeaders(accessToken),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return parseCustomerResponse(response)
}

export async function listCustomersRequest({ accessToken, page, limit, search }: ListCustomersParams) {
  const url = new URL(customerApiRoutes.list())
  url.searchParams.set('page', String(page))
  url.searchParams.set('limit', String(limit))

  if (search?.trim()) {
    url.searchParams.set('search', search.trim())
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: authHeaders(accessToken),
  })

  return parseCustomerResponse<ListCustomersResponse>(response)
}

export async function updateCustomerRequest(
  customerId: string,
  payload: UpdateCustomerPayload,
  { accessToken }: RequestOptions,
) {
  const response = await fetch(customerApiRoutes.update(customerId), {
    method: 'PATCH',
    headers: {
      ...authHeaders(accessToken),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  return parseCustomerResponse(response)
}
