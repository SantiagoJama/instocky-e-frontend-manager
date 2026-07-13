import { useCallback, useEffect, useState } from 'react'
import { listBusinessTypeCatalogRequest } from '../services/categoryApi'
import type { BusinessTypeCatalogItem, CategoryPagination } from '../types/category.types'

const PAGE_LIMIT = 10

const initialPagination: CategoryPagination = {
  page: 1,
  limit: PAGE_LIMIT,
  total: 0,
  totalPages: 1,
}

export function useBusinessTypeCatalog(accessToken: string | null, onUnauthorized?: (error: unknown) => void) {
  const [businessTypes, setBusinessTypes] = useState<BusinessTypeCatalogItem[]>([])
  const [pagination, setPagination] = useState<CategoryPagination>(initialPagination)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const requestPage = Math.max(1, page)

  const loadBusinessTypes = useCallback(async () => {
    if (!accessToken) {
      setBusinessTypes([])
      setPagination(initialPagination)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await listBusinessTypeCatalogRequest({
        accessToken,
        page: requestPage,
        limit: PAGE_LIMIT,
        search,
      })
      setBusinessTypes(response.data)
      setPagination(normalizePagination(response.pagination))
    } catch (requestError) {
      onUnauthorized?.(requestError)
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los business types.')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, onUnauthorized, requestPage, search])

  useEffect(() => {
    let isMounted = true

    async function loadInitialBusinessTypes() {
      if (!accessToken) {
        if (isMounted) {
          setBusinessTypes([])
          setPagination(initialPagination)
        }
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await listBusinessTypeCatalogRequest({
          accessToken,
          page: requestPage,
          limit: PAGE_LIMIT,
          search,
        })

        if (isMounted) {
          setBusinessTypes(response.data)
          setPagination(normalizePagination(response.pagination))
        }
      } catch (requestError) {
        if (isMounted) {
          onUnauthorized?.(requestError)
          setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los business types.')
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
  }, [accessToken, onUnauthorized, requestPage, search])

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

function normalizePagination(pagination: CategoryPagination): CategoryPagination {
  return {
    page: Math.max(1, pagination.page),
    limit: pagination.limit || PAGE_LIMIT,
    total: Math.max(0, pagination.total),
    totalPages: Math.max(1, pagination.totalPages),
  }
}
