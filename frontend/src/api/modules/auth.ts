import { request } from '../request'
import type { LoginParams, LoginResult, UserInfo } from '../types'

export const authApi = {
  /** 用户登录 */
  login: (data: LoginParams) => request.post<LoginResult>('/auth/login', data),

  /** 获取当前用户信息 */
  getUserInfo: () => request.get<UserInfo>('/auth/info'),
}
