export type BusinessCategory = {
  id: string
  business_type_id: string
  category: string
  is_active: boolean
  created_at: string
}

export type BusinessType = {
  id: string
  business_type: string
  short_description: string
  is_active: boolean
  created_at: string
  categories: BusinessCategory[]
}

export type BusinessTypeCatalogItem = Omit<BusinessType, 'categories'>

export type CategoryTableItem = BusinessCategory & {
  business_type: string
  business_type_description: string
}

export type CategoryPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type CreateBusinessCategoryPayload = {
  category: string
}

export type CreateBusinessTypePayload = {
  business_type: string
  short_description: string
}

export type UpdateBusinessCategoryPayload = Partial<CreateBusinessCategoryPayload>

export type UpdateBusinessTypePayload = Partial<Pick<BusinessType, 'business_type' | 'short_description'>>

export type BusinessTypesResponse = {
  data: BusinessType[]
  pagination: CategoryPagination
}

export type BusinessTypeCatalogResponse = {
  data: BusinessTypeCatalogItem[]
  pagination: CategoryPagination
}

export type CategoryApiErrorBody = {
  error?: {
    code?: string
    message?: string
    requestId?: string
    details?: unknown
  }
}

export class CategoryApiError extends Error {
  code: string
  status: number
  requestId?: string
  details?: unknown

  constructor(params: { code: string; message: string; status: number; requestId?: string; details?: unknown }) {
    super(params.message)
    this.name = 'CategoryApiError'
    this.code = params.code
    this.status = params.status
    this.requestId = params.requestId
    this.details = params.details
  }
}
