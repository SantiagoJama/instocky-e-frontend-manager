import { useCallback, useEffect, useState } from 'react'
import { listBusinessTypesRequest } from '../services/categoryApi'
import type { BusinessType, CategoryPagination } from '../types/category.types'

type UseBusinessTypesOptions = {
  limit?: number
}

const DEFAULT_LIMIT = 10

const initialPagination = (limit: number): CategoryPagination => ({
  page: 1,
  limit,
  total: 0,
  totalPages: 1,
})

export function useBusinessTypes(
  accessToken: string | null,
  onUnauthorized?: (error: unknown) => void,
  options: UseBusinessTypesOptions = {},
) {
  const limit = options.limit ?? DEFAULT_LIMIT
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([])
  const [pagination, setPagination] = useState<CategoryPagination>(() => initialPagination(limit))
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestPage = Math.max(1, page)

  const loadBusinessTypes = useCallback(async () => {
    if (!accessToken) {
      setBusinessTypes([])
      setPagination(initialPagination(limit))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await listBusinessTypesRequest({
        accessToken,
        page: requestPage,
        limit,
        search,
      })
      setBusinessTypes(response.data)
      setPagination(normalizePagination(response.pagination, limit))
    } catch (requestError) {
      onUnauthorized?.(requestError)
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar las categorias.')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, limit, onUnauthorized, requestPage, search])

  useEffect(() => {
    let isMounted = true

    async function loadInitialBusinessTypes() {
      if (!accessToken) {
        if (isMounted) {
          setBusinessTypes([])
          setPagination(initialPagination(limit))
        }
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await listBusinessTypesRequest({
          accessToken,
          page: requestPage,
          limit,
          search,
        })

        if (isMounted) {
          setBusinessTypes(response.data)
          setPagination(normalizePagination(response.pagination, limit))
        }
      } catch (requestError) {
        if (isMounted) {
          onUnauthorized?.(requestError)
          setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar las categorias.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialBusinessTypes()

    return () => {
      isMounted = false
    }
  }, [accessToken, limit, onUnauthorized, requestPage, search])

  useEffect(() => {
    const safeTotalPages = Math.max(1, pagination.totalPages)

    if (page < 1) {
      setPage(1)
      return
    }

    if (page > safeTotalPages) {
      setPage(safeTotalPages)
    }
  }, [page, pagination.totalPages])

  return {
    businessTypes,
    pagination,
    page,
    search,
    isLoading,
    error,
    setPage,
    setSearch,
    reload: loadBusinessTypes,
  }
}

function normalizePagination(pagination: CategoryPagination, fallbackLimit: number): CategoryPagination {
  const totalPages = Math.max(1, pagination.totalPages)

  return {
    page: Math.max(1, pagination.page),
    limit: pagination.limit || fallbackLimit,
    total: Math.max(0, pagination.total),
    totalPages,
  }
}
