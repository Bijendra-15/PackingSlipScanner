import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface LoginUser {
  UserId: number
  RoleId: number
  UserName?: string
  AppName?: string
  [key: string]: unknown
}

interface AuthContextType {
  token: string | null
  user: LoginUser | null
  setAuth: (token: string, user: LoginUser) => void
  setToken: (token: string | null) => void
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null)
  const [user, setUser] = useState<LoginUser | null>(null)

  const setAuth = useCallback((newToken: string, newUser: LoginUser) => {
    console.log('setAuth called', newToken)
    setTokenState(newToken)
    setUser(newUser)
  }, [])

  const setToken = useCallback((newToken: string | null) => {
    setTokenState(newToken)
  }, [])

  const logout = useCallback(() => {
    setTokenState(null)
    setUser(null)
  }, [])

  const value = {
    token,
    user,
    setAuth,
    setToken,
    logout,
    isAuthenticated: !!token,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}