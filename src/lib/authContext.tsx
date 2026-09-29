import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { API_BASE } from './api'

export interface AuthUser {
  id: number
  name: string
  student_id: string
  email: string
  phone?: string
  faculty?: string
  year?: string
  bio?: string
  role?: string
  avatar_url?: string
  average_rating?: number
  reviews_count?: number
  completed_deals_count?: number
  campus_verified: boolean
  date_joined: string
}

export interface RegisterPayload {
  name: string
  student_id: string
  email: string
  password: string
  password_confirmation: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; errors?: Record<string, string[]> }>
  register: (payload: RegisterPayload) => Promise<{ success: boolean; message?: string; errors?: Record<string, string[]> }>
  logout: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: async () => {},
  clearError: () => {},
})

const TOKEN_KEY = 'nussy_auth_token'
const USER_KEY = 'nussy_auth_user'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY)
  })

  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  // Verify / fetch user on load if token exists
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch(`${API_BASE}/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })

        if (res.ok) {
          const data = await res.json()
          const fetchedUser = data.data || data.user || data
          setUser(fetchedUser)
          localStorage.setItem(USER_KEY, JSON.stringify(fetchedUser))
        } else if (res.status === 401) {
          // Token expired or invalid
          setToken(null)
          setUser(null)
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)
        }
      } catch {
        // network issue - preserve cached user
      } finally {
        setIsLoading(false)
      }
    }

    fetchCurrentUser()
  }, [token])

  const login = async (email: string, password: string) => {
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errMsg = data.message || 'Login failed. Please check your credentials.'
        setError(errMsg)
        setIsLoading(false)
        return { success: false, message: errMsg, errors: data.errors }
      }

      const receivedUser: AuthUser = data.user
      const receivedToken: string = data.token

      setUser(receivedUser)
      setToken(receivedToken)
      localStorage.setItem(TOKEN_KEY, receivedToken)
      localStorage.setItem(USER_KEY, JSON.stringify(receivedUser))

      setIsLoading(false)
      return { success: true }
    } catch (err: any) {
      const msg = err?.message || 'Network error connecting to campus server.'
      setError(msg)
      setIsLoading(false)
      return { success: false, message: msg }
    }
  }

  const register = async (payload: RegisterPayload) => {
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        const errMsg = data.message || 'Registration failed. Please verify your details.'
        setError(errMsg)
        setIsLoading(false)
        return { success: false, message: errMsg, errors: data.errors }
      }

      const receivedUser: AuthUser = data.user
      const receivedToken: string = data.token

      setUser(receivedUser)
      setToken(receivedToken)
      localStorage.setItem(TOKEN_KEY, receivedToken)
      localStorage.setItem(USER_KEY, JSON.stringify(receivedUser))

      setIsLoading(false)
      return { success: true }
    } catch (err: any) {
      const msg = err?.message || 'Network error connecting to campus server.'
      setError(msg)
      setIsLoading(false)
      return { success: false, message: msg }
    }
  }

  const logout = async () => {
    if (token) {
      try {
        await fetch(`${API_BASE}/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })
      } catch {
        // ignore
      }
    }

    setUser(null)
    setToken(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
