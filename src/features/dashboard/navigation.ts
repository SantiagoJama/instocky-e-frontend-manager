import type { IconType } from 'react-icons'
import { FiBriefcase, FiEye, FiPlusCircle, FiUsers } from 'react-icons/fi'

export type NavigationChild = {
  id: string
  label: string
  path: string
  icon: IconType
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
      },
      {
        id: 'customer-view',
        label: 'View',
        path: '/customer/view',
        icon: FiEye,
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
      },
    ],
  },
]
