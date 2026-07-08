import { getApiBaseUrl } from './env'

const apiRoutes = {
  auth: {
    login: 'auth/login',
    refresh: 'auth/refresh',
    logout: 'auth/logout',
  },
  businesses: {
    root: 'businesses',
    byId: (businessId: string) => `businesses/${businessId}`,
    modules: 'businesses/modules',
  },
  customers: {
    root: 'customers',
    byId: (customerId: string) => `customers/${customerId}`,
  },
} as const

function joinUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
}

export function apiUrl(path: string) {
  return joinUrl(getApiBaseUrl(), path)
}

export const authApiRoutes = {
  login: () => apiUrl(apiRoutes.auth.login),
  refresh: () => apiUrl(apiRoutes.auth.refresh),
  logout: () => apiUrl(apiRoutes.auth.logout),
}

export const businessApiRoutes = {
  list: () => apiUrl(apiRoutes.businesses.root),
  detail: (businessId: string) => apiUrl(apiRoutes.businesses.byId(businessId)),
  update: (businessId: string) => apiUrl(apiRoutes.businesses.byId(businessId)),
  status: (businessId: string) => apiUrl(`${apiRoutes.businesses.byId(businessId)}/status`),
  users: (businessId: string) => apiUrl(`${apiRoutes.businesses.byId(businessId)}/users`),
  user: (businessId: string, businessUserId: string) =>
    apiUrl(`${apiRoutes.businesses.byId(businessId)}/users/${businessUserId}`),
  userPassword: (businessId: string, businessUserId: string) =>
    apiUrl(`${apiRoutes.businesses.byId(businessId)}/users/${businessUserId}/password`),
  moduleStatus: (businessId: string, moduleId: string) =>
    apiUrl(`${apiRoutes.businesses.byId(businessId)}/modules/${moduleId}/status`),
  modules: () => apiUrl(apiRoutes.businesses.modules),
}

export const customerApiRoutes = {
  list: () => apiUrl(apiRoutes.customers.root),
  create: () => apiUrl(apiRoutes.customers.root),
  update: (customerId: string) => apiUrl(apiRoutes.customers.byId(customerId)),
}
