import { create } from 'zustand'
import type { UserInfo } from '../api/types'
import { authApi } from '../api'
import { STORAGE_KEYS } from '../config/constants'

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
  token: localStorage.getItem(STORAGE_KEYS.TOKEN),
  user: JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null'),
  isAuthenticated: !!localStorage.getItem(STORAGE_KEYS.TOKEN),

  login: async (username: string, password: string, role: string) => {
    const result = await authApi.login({ username, password, role })
    localStorage.setItem(STORAGE_KEYS.TOKEN, result.token)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(result.user))
    set({
      token: result.token,
      user: result.user,
      isAuthenticated: true,
    })
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    set({
      token: null,
      user: null,
      isAuthenticated: false,
    })
  },

  loadUser: async () => {
    try {
      const userInfo = await authApi.getUserInfo()
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userInfo))
      set({ user: userInfo })
    } catch (e) {
      console.error('登录请求失败:', e)
      get().logout()
    }
  },

  setUser: (user: UserInfo) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user))
    set({ user })
  },
}))
