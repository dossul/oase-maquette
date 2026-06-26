import { useAuthStore } from '../stores/auth'

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1'

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
    throw new Error('Session expirée')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(err.message || res.statusText)
  }

  return res.json() as Promise<T>
}
