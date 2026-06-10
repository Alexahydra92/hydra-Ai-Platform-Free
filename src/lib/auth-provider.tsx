'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { SessionProvider, useSession, signIn, signOut } from 'next-auth/react'

interface AuthUser {
  id: string
  name: string
  email: string
  image?: string | null
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isGuest: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>
  loginWithGithub: () => Promise<void>
  logout: () => Promise<void>
  enterGuest: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function AuthProviderInner({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [isGuest, setIsGuest] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hydra-guest-mode') === 'true'
    }
    return false
  })

  const isLoading = status === 'loading'
  const isAuthenticated = !!session?.user
  const user = session?.user ? {
    id: session.user.id || '',
    name: session.user.name || '',
    email: session.user.email || '',
    image: session.user.image,
  } : null

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        return { success: false, error: result.error }
      }
      setIsGuest(false)
      localStorage.removeItem('hydra-guest-mode')
      return { success: true }
    } catch {
      return { success: false, error: 'Gagal masuk' }
    }
  }, [])

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error || 'Gagal mendaftar' }
      }
      // Auto login after register
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        return { success: false, error: result.error }
      }
      setIsGuest(false)
      localStorage.removeItem('hydra-guest-mode')
      return { success: true }
    } catch {
      return { success: false, error: 'Gagal mendaftar' }
    }
  }, [])

  const loginWithGithub = useCallback(async () => {
    await signIn('github', { callbackUrl: '/' })
  }, [])

  const logout = useCallback(async () => {
    await signOut({ redirect: false })
    setIsGuest(false)
    localStorage.removeItem('hydra-guest-mode')
  }, [])

  const enterGuest = useCallback(() => {
    setIsGuest(true)
    localStorage.setItem('hydra-guest-mode', 'true')
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, isGuest, login, register, loginWithGithub, logout, enterGuest }}>
      {children}
    </AuthContext.Provider>
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <AuthProviderInner>{children}</AuthProviderInner>
    </SessionProvider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
