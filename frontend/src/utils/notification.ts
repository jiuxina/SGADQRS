import type { NotificationItem } from '../api/types'

/** 通知跳转映射所需的字段 */
export type NotificationRef = Pick<NotificationItem, 'refType' | 'refId' | 'title'>

const INNER_TAB_KEYS = ['received2', 'received3', 'unlock', 'sent']

/** URL ?tab= 是否指向组队中心的内层请求标签 */
export function isTeamInnerTab(tab: string | null): boolean {
  return !!tab && INNER_TAB_KEYS.includes(tab)
}

/**
 * 消息 → 页面跳转映射(通知仅发送给学生端,统一使用学生路由)。
 * 返回空字符串表示该消息没有对应落地页(如公告,内容已直接展示)。
 *
 * refType 语义(与后端 NotificationService 发送点一致):
 * - request: 社区互动请求(资料互看 / 入队申请 / 入队邀请),refId=请求ID
 * - recruit: 招募帖,refId=帖子ID → 招募广场
 * - team:    队伍参赛审核结果,refId=队伍ID → 我的队伍
 * - user:    成绩已发布,refId=学生ID → 成绩单
 * - notice:  全员公告,无独立落地页
 */
export function notificationTarget(n: NotificationRef): string {
  const title = n.title || ''
  switch (n.refType) {
    case 'request': {
      if (title.includes('已通过') || title.includes('已接受')) return '/student/teams'
      if (title.includes('互看')) {
        // 「收到资料互看请求」发给接收者→互看请求页;已同意/被拒绝发给发起者→我发出的
        return title.includes('收到') ? '/student/teams?tab=unlock' : '/student/teams?tab=sent'
      }
      if (title.includes('入队邀请')) {
        return title.includes('收到') ? '/student/teams?tab=received3' : '/student/teams?tab=sent'
      }
      if (title.includes('入队申请')) {
        return title.includes('收到') ? '/student/teams?tab=received2' : '/student/teams?tab=sent'
      }
      return '/student/teams?tab=sent'
    }
    case 'recruit':
      return '/student/teams?tab=recruit'
    case 'team':
      return '/student/teams'
    case 'user':
      return '/student/history?tab=transcript'
    default:
      return ''
  }
}

/** 按角色返回消息收件箱路径(铃铛「查看全部」与无落地页消息的兜底) */
export function inboxPathByRole(role: string | undefined): string {
  if (role === 'admin') return '/admin/notices'
  if (role === 'teacher') return '/teacher/dashboard'
  return '/student/notifications'
}
