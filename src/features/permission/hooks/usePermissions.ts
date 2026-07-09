import { useCallback, useEffect, useState } from 'react'
import { listPermissionsRequest } from '../services/permissionApi'
import type { Permission, PermissionPagination, PermissionStatus } from '../types/permission.types'

const initialPagination: PermissionPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
}

export function usePermissions(accessToken: string | null, onUnauthorized?: (error: unknown) => void) {
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [pagination, setPagination] = useState<PermissionPagination>(initialPagination)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PermissionStatus>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPermissions = useCallback(async () => {
    if (!accessToken) {
      setPermissions([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await listPermissionsRequest({
        accessToken,
        page,
        limit: initialPagination.limit,
        search,
        status,
      })
      setPermissions(response.data)
      setPagination(response.pagination)
    } catch (requestError) {
      onUnauthorized?.(requestError)
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los permisos.')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, onUnauthorized, page, search, status])

  useEffect(() => {
    let isMounted = true

    async function loadInitialPermissions() {
      if (!accessToken) {
        if (isMounted) {
          setPermissions([])
        }
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await listPermissionsRequest({
          accessToken,
          page,
          limit: initialPagination.limit,
          search,
          status,
        })

        if (isMounted) {
          setPermissions(response.data)
          setPagination(response.pagination)
        }
      } catch (requestError) {
        if (isMounted) {
          onUnauthorized?.(requestError)
          setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los permisos.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialPermissions()

    return () => {
      isMounted = false
    }
  }, [accessToken, onUnauthorized, page, search, status])

  return {
    permissions,
    pagination,
    page,
    search,
    status,
    isLoading,
    error,
    setPage,
    setSearch,
    setStatus,
    reload: loadPermissions,
  }
}
