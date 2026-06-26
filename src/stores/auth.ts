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

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('oase_token'))
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  function setSession(newToken: string, newUser: User) {
    token.value = newToken
    user.value = newUser
    localStorage.setItem('oase_token', newToken)
  }

  function clearSession() {
    token.value = null
    user.value = null
    localStorage.removeItem('oase_token')
  }

  function hasRole(roles: string[]) {
    if (!user.value) return false
    return roles.includes(user.value.role)
  }

  return { user, token, isAuthenticated, setSession, clearSession, hasRole }
})
