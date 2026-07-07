import { useCallback, useEffect, useState } from 'react'
import { listCustomersRequest } from '../services/customerApi'
import type { CustomerAggregate, CustomerPagination } from '../types/customer.types'

const initialPagination: CustomerPagination = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
}

export function useCustomers(accessToken: string | null) {
  const [customers, setCustomers] = useState<CustomerAggregate[]>([])
  const [pagination, setPagination] = useState<CustomerPagination>(initialPagination)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCustomers = useCallback(async () => {
    if (!accessToken) {
      setCustomers([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await listCustomersRequest({
        accessToken,
        page,
        limit: initialPagination.limit,
        search,
      })
      setCustomers(response.data)
      setPagination(response.pagination)
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los customers.')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, page, search])

  useEffect(() => {
    let isMounted = true

    async function loadInitialCustomers() {
      if (!accessToken) {
        if (isMounted) {
          setCustomers([])
        }
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await listCustomersRequest({
          accessToken,
          page,
          limit: initialPagination.limit,
          search,
        })

        if (isMounted) {
          setCustomers(response.data)
          setPagination(response.pagination)
        }
      } catch (requestError) {
        if (isMounted) {
          setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los customers.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialCustomers()

    return () => {
      isMounted = false
    }
  }, [accessToken, page, search])

  return {
    customers,
    pagination,
    page,
    search,
    isLoading,
    error,
    setPage,
    setSearch,
    reload: loadCustomers,
  }
}
