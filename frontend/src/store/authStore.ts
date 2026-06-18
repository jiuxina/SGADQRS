import { create } from 'zustand'
import type { UserInfo } from '../api/types'
import { authApi } from '../api'

interface AuthState {
  token: string | null
  user: UserInfo | null
  isAuthenticated: boolean

  login: (username: string, password: string, role: string) => Promise<void>
  logout: () => void
  loadUser: () => Promise<void>
  setUser: (user: UserInfo) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('scms_token'),
  user: JSON.parse(localStorage.getItem('scms_user') || 'null'),
  isAuthenticated: !!localStorage.getItem('scms_token'),

  login: async (username: string, password: string, role: string) => {
    const result = await authApi.login({ username, password, role })
    localStorage.setItem('scms_token', result.token)
    localStorage.setItem('scms_user', JSON.stringify(result.user))
    set({
      token: result.token,
      user: result.user,
      isAuthenticated: true,
    })
  },

  logout: () => {
    localStorage.removeItem('scms_token')
    localStorage.removeItem('scms_user')
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    })
  },

  loadUser: async () => {
    try {
      const userInfo = await authApi.getUserInfo()
      localStorage.setItem('scms_user', JSON.stringify(userInfo))
      set({ user: userInfo })
    } catch {
      get().logout()
    }
  },

  setUser: (user: UserInfo) => {
    localStorage.setItem('scms_user', JSON.stringify(user))
    set({ user })
  },
}))
