import { getApiBaseUrl } from './env'

const apiRoutes = {
  auth: {
    login: 'auth/login',
    refresh: 'auth/refresh',
    logout: 'auth/logout',
  },
  businesses: {
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
  modules: () => apiUrl(apiRoutes.businesses.modules),
}

export const customerApiRoutes = {
  list: () => apiUrl(apiRoutes.customers.root),
  create: () => apiUrl(apiRoutes.customers.root),
  update: (customerId: string) => apiUrl(apiRoutes.customers.byId(customerId)),
}
