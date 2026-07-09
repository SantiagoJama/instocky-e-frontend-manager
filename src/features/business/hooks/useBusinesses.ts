import { useCallback, useEffect, useState } from 'react'
import { listBusinessesRequest } from '../services/businessApi'
import type { BusinessAggregate, BusinessPagination } from '../types/business.types'

const initialPagination: BusinessPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
}

export function useBusinesses(accessToken: string | null, onUnauthorized?: (error: unknown) => void) {
  const [businesses, setBusinesses] = useState<BusinessAggregate[]>([])
  const [pagination, setPagination] = useState<BusinessPagination>(initialPagination)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadBusinesses = useCallback(async () => {
    if (!accessToken) {
      setBusinesses([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await listBusinessesRequest({
        accessToken,
        page,
        limit: initialPagination.limit,
        search,
      })
      setBusinesses(response.data)
      setPagination(response.pagination)
    } catch (requestError) {
      onUnauthorized?.(requestError)
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los businesses.')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, onUnauthorized, page, search])

  useEffect(() => {
    let isMounted = true

    async function loadInitialBusinesses() {
      if (!accessToken) {
        if (isMounted) {
          setBusinesses([])
        }
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await listBusinessesRequest({
          accessToken,
          page,
          limit: initialPagination.limit,
          search,
        })

        if (isMounted) {
          setBusinesses(response.data)
          setPagination(response.pagination)
        }
      } catch (requestError) {
        if (isMounted) {
          onUnauthorized?.(requestError)
          setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los businesses.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialBusinesses()

    return () => {
      isMounted = false
    }
  }, [accessToken, onUnauthorized, page, search])

  return {
    businesses,
    pagination,
    page,
    search,
    isLoading,
    error,
    setPage,
    setSearch,
    reload: loadBusinesses,
  }
}
