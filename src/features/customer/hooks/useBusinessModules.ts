import { useCallback, useEffect, useState } from 'react'
import { getBusinessModulesRequest } from '../services/customerApi'
import type { BusinessModule } from '../types/customer.types'

export function useBusinessModules(accessToken: string | null, onUnauthorized?: (error: unknown) => void) {
  const [modules, setModules] = useState<BusinessModule[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadModules = useCallback(async () => {
    if (!accessToken) {
      setModules([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await getBusinessModulesRequest({ accessToken })
      setModules(response.data)
    } catch (requestError) {
      onUnauthorized?.(requestError)
      setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los modulos.')
    } finally {
      setIsLoading(false)
    }
  }, [accessToken, onUnauthorized])

  useEffect(() => {
    let isMounted = true

    async function loadInitialModules() {
      if (!accessToken) {
        if (isMounted) {
          setModules([])
        }
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await getBusinessModulesRequest({ accessToken })

        if (isMounted) {
          setModules(response.data)
        }
      } catch (requestError) {
        if (isMounted) {
          onUnauthorized?.(requestError)
          setError(requestError instanceof Error ? requestError.message : 'No se pudieron cargar los modulos.')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialModules()

    return () => {
      isMounted = false
    }
  }, [accessToken, onUnauthorized])

  return {
    modules,
    isLoading,
    error,
    reload: loadModules,
  }
}
