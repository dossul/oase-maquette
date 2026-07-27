import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface User {
  id: string
  email: string
  nom: string
  prenom: string
  role: string
  institutionId?: string
}

const USER_KEY = 'oase_user'

function loadUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as User) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(loadUser())
  const token = ref<string | null>(localStorage.getItem('oase_token'))
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  function setSession(newToken: string, newUser: User) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('oase_token', newToken)
    localStorage.setItem(USER_KEY, JSON.stringify(newUser))
  }

  function clearSession() {
    token.value = null
    user.value = null
    localStorage.removeItem('oase_token')
    localStorage.removeItem(USER_KEY)
  }

  function hasRole(roles: string[]) {
    if (!user.value) return false
    return roles.includes(user.value.role)
  }

  return { user, token, isAuthenticated, setSession, clearSession, hasRole }
})
