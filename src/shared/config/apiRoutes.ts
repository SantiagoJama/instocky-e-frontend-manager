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
    types: 'businesses/types',
    typesAll: 'businesses/types/all',
    typeById: (businessTypeId: string) => `businesses/types/${businessTypeId}`,
    categories: (businessTypeId: string) => `businesses/types/${businessTypeId}/categories`,
    categoryById: (businessTypeId: string, businessCategoryId: string) =>
      `businesses/types/${businessTypeId}/categories/${businessCategoryId}`,
  },
  users: {
    root: 'users',
    byId: (userId: string) => `users/${userId}`,
  },
  permissions: {
    root: 'permissions',
    byId: (permissionId: string) => `permissions/${permissionId}`,
    userRoot: (userId: string) => `permissions/users/${userId}`,
    userPermission: (userId: string, permissionId: string) => `permissions/users/${userId}/${permissionId}`,
  },
  customers: {
    root: 'customers',
    byId: (customerId: string) => `customers/${customerId}`,
  },
  logs: {
    root: 'logs',
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
  userStatus: (businessId: string, businessUserId: string) =>
    apiUrl(`${apiRoutes.businesses.byId(businessId)}/users/${businessUserId}/status`),
  userPassword: (businessId: string, businessUserId: string) =>
    apiUrl(`${apiRoutes.businesses.byId(businessId)}/users/${businessUserId}/password`),
  businessModules: (businessId: string) => apiUrl(`${apiRoutes.businesses.byId(businessId)}/modules`),
  moduleStatus: (businessId: string, moduleId: string) =>
    apiUrl(`${apiRoutes.businesses.byId(businessId)}/modules/${moduleId}/status`),
  modules: () => apiUrl(apiRoutes.businesses.modules),
  types: () => apiUrl(apiRoutes.businesses.types),
  typesAll: () => apiUrl(apiRoutes.businesses.typesAll),
  createType: () => apiUrl(apiRoutes.businesses.types),
  updateType: (businessTypeId: string) => apiUrl(apiRoutes.businesses.typeById(businessTypeId)),
  typeStatus: (businessTypeId: string) => apiUrl(`${apiRoutes.businesses.typeById(businessTypeId)}/status`),
  categories: (businessTypeId: string) => apiUrl(apiRoutes.businesses.categories(businessTypeId)),
  updateCategory: (businessTypeId: string, businessCategoryId: string) =>
    apiUrl(apiRoutes.businesses.categoryById(businessTypeId, businessCategoryId)),
  categoryStatus: (businessTypeId: string, businessCategoryId: string) =>
    apiUrl(`${apiRoutes.businesses.categoryById(businessTypeId, businessCategoryId)}/status`),
}

export const customerApiRoutes = {
  list: () => apiUrl(apiRoutes.customers.root),
  create: () => apiUrl(apiRoutes.customers.root),
  update: (customerId: string) => apiUrl(apiRoutes.customers.byId(customerId)),
}

export const userApiRoutes = {
  list: () => apiUrl(apiRoutes.users.root),
  create: () => apiUrl(apiRoutes.users.root),
  update: (userId: string) => apiUrl(apiRoutes.users.byId(userId)),
  status: (userId: string) => apiUrl(`${apiRoutes.users.byId(userId)}/status`),
  password: (userId: string) => apiUrl(`${apiRoutes.users.byId(userId)}/password`),
}

export const permissionApiRoutes = {
  list: () => apiUrl(apiRoutes.permissions.root),
  create: () => apiUrl(apiRoutes.permissions.root),
  status: (permissionId: string) => apiUrl(`${apiRoutes.permissions.byId(permissionId)}/status`),
  userPermissions: (userId: string) => apiUrl(apiRoutes.permissions.userRoot(userId)),
  assignToUser: (userId: string) => apiUrl(apiRoutes.permissions.userRoot(userId)),
  userPermissionStatus: (userId: string, permissionId: string) =>
    apiUrl(`${apiRoutes.permissions.userPermission(userId, permissionId)}/status`),
}

export const logApiRoutes = {
  list: () => apiUrl(apiRoutes.logs.root),
}
