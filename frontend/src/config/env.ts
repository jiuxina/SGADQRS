/**
 * 环境变量封装
 * 使用 import.meta.env 访问 Vite 环境变量
 */

export const env = {
  /** API 基础地址 */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',

  /** API 超时时间 (ms) */
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 15000,

  /** 应用标题 */
  appTitle: import.meta.env.VITE_APP_TITLE || '学生竞赛信息管理系统',

  /** 应用版本 */
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',

  /** 是否使用 Mock 数据 */
  useMock: import.meta.env.VITE_USE_MOCK === 'true',

  /** 是否开发环境 */
  isDev: import.meta.env.DEV,

  /** 是否生产环境 */
  isProd: import.meta.env.PROD,
} as const
