import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

interface AuthContextValue {
  token: string | null
  name: string | null
  isAuthenticated: boolean
  login: (token: string, name: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function isExpired(token: string | null): boolean {
  if (!token) return true
  try {
    const payload = token.split('.')[1]
    const claims: { exp?: number } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof claims.exp === 'number' && claims.exp * 1000 <= Date.now()
  } catch {
    return true
  }
}

function expirationDelay(token: string | null): number | null {
  if (!token) return null
  try {
    const payload = token.split('.')[1]
    const claims: { exp?: number } = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    return typeof claims.exp === 'number' ? Math.max(0, claims.exp * 1000 - Date.now()) : null
  } catch {
    return 0
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('adotapet_token'))
  const [name, setName] = useState<string | null>(() => localStorage.getItem('adotapet_name'))

  const logout = useCallback(() => {
    localStorage.removeItem('adotapet_token')
    localStorage.removeItem('adotapet_name')
    setToken(null)
    setName(null)
  }, [])

  const login = useCallback((nextToken: string, nextName: string) => {
    localStorage.setItem('adotapet_token', nextToken)
    localStorage.setItem('adotapet_name', nextName)
    setToken(nextToken)
    setName(nextName)
  }, [])

  useEffect(() => {
    if (isExpired(token)) logout()
  }, [logout, token])

  useEffect(() => {
    const delay = expirationDelay(token)
    if (delay === null) return
    const timer = window.setTimeout(logout, delay)
    return () => window.clearTimeout(timer)
  }, [logout, token])

  useEffect(() => {
    window.addEventListener('adotapet:unauthorized', logout)
    return () => window.removeEventListener('adotapet:unauthorized', logout)
  }, [logout])

  const value = useMemo(() => ({
    token: isExpired(token) ? null : token,
    name: isExpired(token) ? null : name,
    isAuthenticated: !isExpired(token),
    login,
    logout,
  }), [login, logout, name, token])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth precisa estar dentro de AuthProvider')
  return value
}
