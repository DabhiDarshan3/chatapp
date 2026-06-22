import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'

interface AuthUser {
  id: number
  name: string
  email: string
}

interface AuthContextType {
  user: AuthUser | null
  isLoading: boolean
  isAuthModalOpen: boolean
  openAuthModal: () => void
  closeAuthModal: () => void
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkEmail: (email: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

function getCsrfToken(): string {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')
  return meta?.content ?? ''
}

async function authRequest<T>(method: string, url: string, body?: unknown): Promise<T> {
  const opts: RequestInit = {
    method,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-CSRF-TOKEN': getCsrfToken(),
    },
  }
  if (body) opts.body = JSON.stringify(body)
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`)
  return data as T
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)

  // Fetch currently authenticated user on mount
  useEffect(() => {
    fetch('/api/auth/user', { headers: { 'Accept': 'application/json' }, credentials: 'same-origin' })
      .then(r => r.json())
      .then(data => setUser(data.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false))
  }, [])

  const openAuthModal = useCallback(() => setIsAuthModalOpen(true), [])
  const closeAuthModal = useCallback(() => setIsAuthModalOpen(false), [])

  const checkEmail = useCallback(async (email: string): Promise<boolean> => {
    const data = await authRequest<{ exists: boolean }>('POST', '/api/auth/check-email', { email })
    return data.exists
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await authRequest<{ success: boolean; user: AuthUser }>('POST', '/api/auth/login', { email, password })
    setUser(data.user)
    setIsAuthModalOpen(false)
  }, [])

  const register = useCallback(async (email: string, password: string) => {
    const data = await authRequest<{ success: boolean; user: AuthUser }>('POST', '/api/auth/register', {
      email,
      password,
      password_confirmation: password,
    })
    setUser(data.user)
    setIsAuthModalOpen(false)
  }, [])

  const logout = useCallback(async () => {
    await authRequest('POST', '/api/auth/logout')
    setUser(null)
    localStorage.removeItem('lastActiveChat')
    window.location.reload()
  }, [])

  return (
    <AuthContext.Provider value={{
      user, isLoading, isAuthModalOpen,
      openAuthModal, closeAuthModal,
      login, register, logout, checkEmail,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
