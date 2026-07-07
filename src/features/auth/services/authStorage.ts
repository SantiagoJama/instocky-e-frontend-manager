import type { AuthUser } from '../types/auth.types'

const sessionKey = 'instocky-manager.user'

type StoredSession = {
  user: AuthUser
}

export function getStoredSession(): AuthUser | null {
  try {
    const value = window.sessionStorage.getItem(sessionKey)

    if (!value) {
      return null
    }

    const session = JSON.parse(value) as StoredSession

    if (!session.user?.id || !session.user.email) {
      clearStoredSession()
      return null
    }

    return session.user
  } catch {
    clearStoredSession()
    return null
  }
}

export function saveStoredSession(user: AuthUser) {
  const session: StoredSession = { user }

  window.sessionStorage.setItem(sessionKey, JSON.stringify(session))
}

export function clearStoredSession() {
  window.sessionStorage.removeItem(sessionKey)
}
