export type Customer = {
  id: string
  identification: string
  first_name: string
  last_name: string
  country: string
  city: string
  is_active: boolean
  created_at?: string
}

export type CustomerContact = {
  mobile_phone_number: string
  base_phone_number: string
  email: string
}

export type Business = {
  id: string
  ruc: string
  the_name: string
  business_type: string
  website: string
  is_official_ruc: boolean
  tenant_name: string
  is_active: boolean
  created_at?: string
}

export type BusinessLocation = {
  id?: string
  country: string
  city: string
  province: string
  address1: string
  address2: string
}

export type BusinessContact = {
  mobile_phone_number: string
  base_phone_number: string
  email: string
}

export type CustomerBusinessAggregate = {
  business: Business
  business_location: BusinessLocation
  business_contact: BusinessContact
}

export type CustomerAggregate = {
  customer: Customer
  customer_contact: CustomerContact
  businesses: CustomerBusinessAggregate[]
}

export type BusinessModule = {
  id: string
  module_name: string
  module_description: string
  created_at: string
}

export type BusinessUserPayload = {
  first_name: string
  last_name: string
  user_name: string
  user_password: string
  rol: 'Admin' | 'General'
}

export type SubscriptionPayload = {
  subscription_type: 'TRIAL' | 'MONTHLY'
  trial_days: number
  monthly_payment: number
  how_many_users: number
  admin_user: number
  general_user: number
}

export type CreateCustomerPayload = {
  customer: Omit<Customer, 'id' | 'created_at'>
  customer_contact: CustomerContact
  business: Omit<Business, 'id' | 'created_at' | 'is_active'>
  business_location: Omit<BusinessLocation, 'id'>
  business_contact: BusinessContact
  business_module: number[]
  business_user: BusinessUserPayload[]
  subscription: SubscriptionPayload
}

export type UpdateCustomerPayload = {
  customer?: Partial<Omit<Customer, 'id' | 'created_at'>>
  customer_contact?: Partial<CustomerContact>
}

export type CustomerPagination = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ListCustomersResponse = {
  data: CustomerAggregate[]
  pagination: CustomerPagination
}

export type BusinessModulesResponse = {
  data: BusinessModule[]
}

export type ApiErrorDetail = {
  path: string
  message: string
}

export type CustomerApiErrorBody = {
  error?: {
    code?: string
    message?: string
    requestId?: string
    details?: ApiErrorDetail[] | Record<string, unknown>
  }
}

export class CustomerApiError extends Error {
  code: string
  status: number
  requestId?: string
  details?: ApiErrorDetail[] | Record<string, unknown>

  constructor(params: {
    code: string
    message: string
    status: number
    requestId?: string
    details?: ApiErrorDetail[] | Record<string, unknown>
  }) {
    super(params.message)
    this.name = 'CustomerApiError'
    this.code = params.code
    this.status = params.status
    this.requestId = params.requestId
    this.details = params.details
  }
}
