import { useCallback, useEffect, useRef } from 'react'
import { useAuth } from './useAuth'

const logoutDelayMs = 2500

type MaybeUnauthorizedError = {
  status?: number
  message?: string
}

export function useLogoutOnUnauthorized() {
  const { logout } = useAuth()
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return useCallback(
    (error: unknown) => {
      if (!isUnauthorizedError(error) || timeoutRef.current) {
        return false
      }

      timeoutRef.current = window.setTimeout(() => {
        timeoutRef.current = null
        void logout()
      }, logoutDelayMs)

      return true
    },
    [logout],
  )
}

function isUnauthorizedError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false
  }

  const authError = error as MaybeUnauthorizedError
  const message = authError.message?.toLowerCase() ?? ''

  return (
    authError.status === 401 ||
    message.includes('invalid or expired access token') ||
    (message.includes('invalid') && message.includes('access token')) ||
    (message.includes('expired') && message.includes('access token'))
  )
}
