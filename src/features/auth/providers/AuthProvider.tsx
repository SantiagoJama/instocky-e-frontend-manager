import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { loginRequest, logoutRequest, refreshAccessTokenRequest } from '../services/authApi'
import { clearStoredSession, getStoredSession, saveStoredSession } from '../services/authStorage'
import type { AuthUser, LoginCredentials } from '../types/auth.types'
import { AuthContext } from './context'

let restoreSessionRequest: ReturnType<typeof refreshAccessTokenRequest> | null = null

function restoreAccessTokenOnce() {
  restoreSessionRequest ??= refreshAccessTokenRequest().finally(() => {
    restoreSessionRequest = null
  })

  return restoreSessionRequest
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredSession())
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isRestoringSession, setIsRestoringSession] = useState(() => Boolean(getStoredSession()))

  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      const storedUser = getStoredSession()

      if (!storedUser) {
        setIsRestoringSession(false)
        return
      }

      try {
        const response = await restoreAccessTokenOnce()

        if (!isMounted) {
          return
        }

        setAccessToken(response.accessToken)
        setUser(storedUser)
      } catch {
        clearStoredSession()

        if (isMounted) {
          setAccessToken(null)
          setUser(null)
        }
      } finally {
        if (isMounted) {
          setIsRestoringSession(false)
        }
      }
    }

    void restoreSession()

    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await loginRequest(credentials)

    setAccessToken(response.accessToken)
    saveStoredSession(response.user)
    setUser(response.user)
    return response.user
  }, [])

  const logout = useCallback(async () => {
    setAccessToken(null)
    clearStoredSession()
    setUser(null)

    try {
      await logoutRequest()
    } catch {
      // The local access token must be deleted even when connectivity fails.
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isRestoringSession,
      login,
      logout,
    }),
    [accessToken, isRestoringSession, login, logout, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
