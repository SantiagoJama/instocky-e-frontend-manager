import { useCallback, useEffect, useState } from 'react'
import { listManagerUsersRequest } from '../services/userApi'
import type { ManagerUser, ManagerUserStatus, UserPagination } from '../types/user.types'

const initialPagination: UserPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
}

export function useManagerUsers(accessToken: string | null, onUnauthorized?: (error: unknown) => void) {
  const [users, setUsers] = useState<ManagerUser[]>([])
  const [pagination, setPagination] = useState<UserPagination>(initialPagination)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ManagerUserStatus>('all')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    if (!accessToken) {
      setUsers([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await listManagerUsersRequest({
        accessToken,
        page,
        limit: initialPagination.limit,
        search,
        status,
      })
      setUsers(response.data)
      setPagination(response.pagination)
    } catch (requestError) {
      onUnauthorized?.(requestError)
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los usuarios.')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, onUnauthorized, page, search, status])

  useEffect(() => {
    let isMounted = true

    async function loadInitialUsers() {
      if (!accessToken) {
        if (isMounted) {
          setUsers([])
        }
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await listManagerUsersRequest({
          accessToken,
          page,
          limit: initialPagination.limit,
          search,
          status,
        })

        if (isMounted) {
          setUsers(response.data)
          setPagination(response.pagination)
        }
      } catch (requestError) {
        if (isMounted) {
          onUnauthorized?.(requestError)
          setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los usuarios.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialUsers()

    return () => {
      isMounted = false
    }
  }, [accessToken, onUnauthorized, page, search, status])

  return {
    users,
    pagination,
    page,
    search,
    status,
    isLoading,
    error,
    setPage,
    setSearch,
    setStatus,
    reload: loadUsers,
  }
}
