import { useAuthStore } from '../stores/auth'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

/** Erreur API enrichie : conserve le code HTTP et le code métier backend (ex: PIN_INVALIDE). */
export class ApiError extends Error {
  status: number
  code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const auth = useAuthStore()
  const url = `${API_BASE}${path}`

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}),
      ...options.headers,
    },
  })

  if (res.status === 401) {
    auth.clearSession()
    window.location.href = '/login'
    throw new ApiError(401, 'Session expirée')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    const message = Array.isArray(err.message) ? err.message.join(', ') : err.message
    throw new ApiError(res.status, message || err.code || res.statusText, err.code)
  }

  return res.json() as Promise<T>
}
