import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import type { Result } from './types'
import { env } from '../config/env'
import { STORAGE_KEYS, API_CONFIG, ROUTES } from '../config/constants'

const BASE_URL = env.apiBaseUrl

const instance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: env.apiTimeout,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器：自动附加 Token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN)
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 防止多个并发401同时触发跳转
let isRedirecting = false

// 响应拦截器：统一错误处理
instance.interceptors.response.use(
  (response: AxiosResponse<Result>) => {
    const { data } = response
    if (data.code !== API_CONFIG.SUCCESS_CODE) {
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return response
  },
  (error) => {
    const status = error.response?.status
    const url = error.config?.url || ''

    // 只在以下情况清除token并跳转登录页：
    // 1. 非登录接口返回401（真正的token过期）
    // 2. 没有正在跳转（防止并发请求重复触发）
    if (status === API_CONFIG.AUTH_EXPIRED_STATUS && !url.includes('/auth/login') && !isRedirecting) {
      isRedirecting = true
      localStorage.removeItem(STORAGE_KEYS.TOKEN)
      localStorage.removeItem(STORAGE_KEYS.USER)
      window.location.href = ROUTES.LOGIN
      // 重置标记（页面刷新后自然重置）
      setTimeout(() => { isRedirecting = false }, 3000)
    }
    const message = error.response?.data?.message || error.message || '网络错误'
    return Promise.reject(new Error(message))
  }
)

// 封装请求方法
export const request = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.get<Result<T>>(url, config).then((res) => res.data.data)
  },

  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.post<Result<T>>(url, data, config).then((res) => res.data.data)
  },

  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return instance.put<Result<T>>(url, data, config).then((res) => res.data.data)
  },

  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return instance.delete<Result<T>>(url, config).then((res) => res.data.data)
  },
}

export default instance
