import type { IconType } from 'react-icons'
import { FiBriefcase, FiEye, FiFileText, FiGrid, FiLayers, FiPlusCircle, FiUsers } from 'react-icons/fi'

export type NavigationChild = {
  id: string
  label: string
  path: string
  icon: IconType
  permission: string
}

export type NavigationSection = {
  id: string
  label: string
  icon: IconType
  children: NavigationChild[]
}

export const navigationSections: NavigationSection[] = [
  {
    id: 'customer',
    label: 'Customer',
    icon: FiUsers,
    children: [
      {
        id: 'customer-create',
        label: 'Create',
        path: '/customer/create',
        icon: FiPlusCircle,
        permission: 'customers.create',
      },
      {
        id: 'customer-view',
        label: 'View',
        path: '/customer/view',
        icon: FiEye,
        permission: 'customers.read',
      },
    ],
  },
  {
    id: 'business',
    label: 'Business',
    icon: FiBriefcase,
    children: [
      {
        id: 'business-view',
        label: 'View',
        path: '/business/view',
        icon: FiEye,
        permission: 'businesses.read',
      },
      {
        id: 'business-categories',
        label: 'Categories',
        path: '/business/categories',
        icon: FiGrid,
        permission: 'businesses.types.read',
      },
      {
        id: 'business-types',
        label: 'Business types',
        path: '/business/types',
        icon: FiLayers,
        permission: 'businesses.types.read',
      },
    ],
  },
  {
    id: 'manager',
    label: 'Manager',
    icon: FiUsers,
    children: [
      {
        id: 'manager-view',
        label: 'View Users',
        path: '/manager/view',
        icon: FiEye,
        permission: 'users.read',
      },
      {
        id: 'permission-view',
        label: 'Permissions',
        path: '/manager/permissions',
        icon: FiEye,
        permission: 'permissions.read',
      },
      {
        id: 'logs-view',
        label: 'Logs',
        path: '/manager/logs',
        icon: FiFileText,
        permission: 'logs.read',
      },
    ],
  },
]
