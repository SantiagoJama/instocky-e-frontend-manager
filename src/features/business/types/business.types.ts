export type Business = {
  id: string
  customer_id: string
  bus_location_id: string
  ruc: string
  the_name: string
  business_type: string
  website: string
  is_official_ruc: boolean
  tenant_name: string
  is_active: boolean
  created_at: string
}

export type BusinessContact = {
  id: string
  mobile_phone_number: string
  base_phone_number: string
  email: string
  created_at: string
}

export type BusinessLocation = {
  id: string
  country: string
  city: string
  province: string
  address1: string
  address2: string
  created_at: string
}

export type BusinessPayment = {
  id: string
  the_provider: string
  external_resource_type: string
  external_resource_id: string
  event_name: string
  the_status: string
  amount_in_cents: string
  refunded_amount_in_cents: string
  currency: string
  is_test_mode: boolean
  payment_details: Record<string, unknown>
  provider_created_at: string
  provider_updated_at: string
  received_at: string
  created_at: string
  updated_at: string
}

export type BusinessUser = {
  id: string
  first_name: string
  last_name: string
  user_name: string
  rol: 'Admin' | 'General'
  is_active: boolean
  created_at: string
}

export type BusinessModule = {
  id: string
  module_name: string
  module_description: string
  is_active: boolean
  created_at: string
}

export type AvailableBusinessModule = Omit<BusinessModule, 'is_active'>

export type BusinessSubscription = {
  id: string
  subscription_type: 'TRIAL' | 'MONTHLY'
  trial_start: string | null
  trial_end: string | null
  trial_days: number
  monthly_start: string
  end_subscription: string
  monthly_payment: string
  how_many_users: number
  admin_user: number
  general_user: number
  subscription_status: boolean
  created_at: string
}

export type BusinessAggregate = {
  business: Business
  business_contact: BusinessContact
  business_location: BusinessLocation
  payments: BusinessPayment[]
  business_users: BusinessUser[]
  business_modules: BusinessModule[]
  subscription: BusinessSubscription | null
}

export type UpdateBusinessPayload = {
  business?: Partial<Pick<Business, 'ruc' | 'the_name' | 'business_type' | 'website' | 'is_official_ruc' | 'tenant_name'>>
  business_location?: Partial<Pick<BusinessLocation, 'country' | 'city' | 'province' | 'address1' | 'address2'>>
  business_contact?: Partial<Pick<BusinessContact, 'mobile_phone_number' | 'base_phone_number' | 'email'>>
}

export type BusinessUserPayload = {
  first_name: string
  last_name: string
  user_name: string
  user_password?: string
  rol: BusinessUser['rol']
}

export type UpdateBusinessUserPayload = Partial<BusinessUserPayload>

export type BusinessPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ListBusinessesResponse = {
  data: BusinessAggregate[]
  pagination: BusinessPagination
}

export type BusinessApiErrorBody = {
  error?: {
    code?: string
    message?: string
    requestId?: string
    details?: unknown
  }
}

export class BusinessApiError extends Error {
  code: string
  status: number
  requestId?: string
  details?: unknown

  constructor(params: { code: string; message: string; status: number; requestId?: string; details?: unknown }) {
    super(params.message)
    this.name = 'BusinessApiError'
    this.code = params.code
    this.status = params.status
    this.requestId = params.requestId
    this.details = params.details
  }
}
