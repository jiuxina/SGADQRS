import { useState, useEffect, useCallback } from 'react'
import { Send, Search, X, ChevronDown } from 'lucide-react'
import GlassModal from './GlassModal'
import { messageApi, userApi, deptApi } from '../api'
import type { UserItem, DeptItem } from '../api/types'
import { useAuthStore } from '../store/authStore'
import { toast } from './toastUtils'

interface ComposeMessageModalProps {
  open: boolean
  onClose: () => void
  onSent?: () => void
}

type TargetMode = 'user' | 'role' | 'dept' | 'all'

export default function ComposeMessageModal({ open, onClose, onSent }: ComposeMessageModalProps) {
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.userType === 3

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [targetMode, setTargetMode] = useState<TargetMode>('user')
  const [sending, setSending] = useState(false)

  // 用户选择相关
  const [userKeyword, setUserKeyword] = useState('')
  const [userList, setUserList] = useState<UserItem[]>([])
  const [selectedUsers, setSelectedUsers] = useState<UserItem[]>([])
  const [searching, setSearching] = useState(false)

  // 角色选择
  const [selectedUserType, setSelectedUserType] = useState<number>(1)

  // 院系选择
  const [deptList, setDeptList] = useState<DeptItem[]>([])
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null)

  // 加载院系列表
  useEffect(() => {
    if (open && isAdmin) {
      deptApi.list().then(setDeptList).catch(() => {})
    }
  }, [open, isAdmin])

  // 搜索用户
  const handleSearchUser = useCallback(async () => {
    if (!userKeyword.trim()) return
    setSearching(true)
    try {
      const result = await userApi.list({ current: 1, size: 20, keyword: userKeyword })
      setUserList(result.records.filter((u) => u.id !== user?.id))
    } catch (e) { console.error('发送消息失败:', e) }
    finally { setSearching(false) }
  }, [userKeyword, user?.id])

  const handleAddUser = (u: UserItem) => {
    if (!selectedUsers.find((s) => s.id === u.id)) {
      setSelectedUsers((prev) => [...prev, u])
    }
    setUserList([])
    setUserKeyword('')
  }

  const handleRemoveUser = (id: number) => {
    setSelectedUsers((prev) => prev.filter((u) => u.id !== id))
  }

  const handleSend = async () => {
    if (!title.trim()) { toast.error('请输入标题'); return }
    if (!content.trim()) { toast.error('请输入内容'); return }

    const payload: Record<string, unknown> = { title, content, targetType: targetMode }

    if (targetMode === 'user') {
      if (selectedUsers.length === 0) { toast.error('请选择接收人'); return }
      payload.userIds = selectedUsers.map((u) => u.id)
    } else if (targetMode === 'role') {
      payload.userType = selectedUserType
    } else if (targetMode === 'dept') {
      if (!selectedDeptId) { toast.error('请选择院系'); return }
      payload.deptId = selectedDeptId
    }

    setSending(true)
    try {
      await messageApi.send(payload as Parameters<typeof messageApi.send>[0])
      toast.success('发送成功')
      setTitle('')
      setContent('')
      setSelectedUsers([])
      onSent?.()
      onClose()
    } catch (e) {
      console.error('发送消息失败:', e)
      toast.error('发送失败')
    } finally { setSending(false) }
  }

  const resetForm = () => {
    setTitle('')
    setContent('')
    setSelectedUsers([])
    setUserKeyword('')
    setUserList([])
    setTargetMode('user')
  }

  return (
    <GlassModal open={open} onClose={() => { resetForm(); onClose() }} title="发送消息" maxWidth="520px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 发送目标类型 */}
        {isAdmin && (
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
              发送对象
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {([
                { key: 'user', label: '指定用户' },
                { key: 'role', label: '按角色' },
                { key: 'dept', label: '按院系' },
                { key: 'all', label: '全员发送' },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTargetMode(opt.key)}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                    border: targetMode === opt.key ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: targetMode === opt.key ? 'rgba(0,122,255,0.06)' : 'transparent',
                    color: targetMode === opt.key ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: targetMode === opt.key ? '600' : '400',
                    transition: 'all 0.15s',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 非管理员：指定用户模式 */}
        {!isAdmin && (
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
              接收人
            </label>
            {/* 搜索框 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                value={userKeyword}
                onChange={(e) => setUserKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                placeholder="搜索用户名或姓名"
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: '8px',
                  border: '1px solid var(--border)', background: 'var(--bg-input, rgba(0,0,0,0.03))',
                  fontSize: '13px', color: 'var(--text-primary)', outline: 'none',
                }}
              />
              <button
                onClick={handleSearchUser}
                disabled={searching}
                style={{
                  padding: '8px 12px', borderRadius: '8px', border: 'none',
                  background: 'var(--accent)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px',
                }}
              >
                <Search size={14} /> 搜索
              </button>
            </div>
            {/* 搜索结果 */}
            {userList.length > 0 && (
              <div style={{
                border: '1px solid var(--border)', borderRadius: '8px',
                maxHeight: '150px', overflow: 'auto', marginBottom: '8px',
              }}>
                {userList.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleAddUser(u)}
                    style={{
                      padding: '8px 12px', cursor: 'pointer', fontSize: '13px',
                      borderBottom: '1px solid rgba(0,0,0,0.04)',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.02)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ fontWeight: '500' }}>{u.realName}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>@{u.username}</span>
                    {u.deptName && <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginLeft: 'auto' }}>{u.deptName}</span>}
                  </div>
                ))}
              </div>
            )}
            {/* 已选用户 */}
            {selectedUsers.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedUsers.map((u) => (
                  <span key={u.id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '6px',
                    background: 'rgba(0,122,255,0.08)', color: 'var(--accent)',
                    fontSize: '12px', fontWeight: '500',
                  }}>
                    {u.realName}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveUser(u.id)} />
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 管理员 - 按角色选择 */}
        {isAdmin && targetMode === 'role' && (
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
              目标角色
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { value: 1, label: '全体学生' },
                { value: 2, label: '全体教师' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedUserType(opt.value)}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                    border: selectedUserType === opt.value ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: selectedUserType === opt.value ? 'rgba(0,122,255,0.06)' : 'transparent',
                    color: selectedUserType === opt.value ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: selectedUserType === opt.value ? '600' : '400',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 管理员 - 按院系选择 */}
        {isAdmin && targetMode === 'dept' && (
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
              目标院系
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={selectedDeptId ?? ''}
                onChange={(e) => setSelectedDeptId(e.target.value ? Number(e.target.value) : null)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '8px',
                  border: '1px solid var(--border)', background: 'var(--bg-input, rgba(0,0,0,0.03))',
                  fontSize: '13px', color: 'var(--text-primary)', outline: 'none',
                  appearance: 'none', cursor: 'pointer',
                }}
              >
                <option value="">请选择院系</option>
                {deptList.map((d) => (
                  <option key={d.id} value={d.id}>{d.deptName}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)' }} />
            </div>
          </div>
        )}

        {/* 管理员 - 指定用户搜索 */}
        {isAdmin && targetMode === 'user' && (
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
              接收人
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <input
                value={userKeyword}
                onChange={(e) => setUserKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUser()}
                placeholder="搜索用户名或姓名"
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: '8px',
                  border: '1px solid var(--border)', background: 'var(--bg-input, rgba(0,0,0,0.03))',
                  fontSize: '13px', color: 'var(--text-primary)', outline: 'none',
                }}
              />
              <button
                onClick={handleSearchUser}
                disabled={searching}
                style={{
                  padding: '8px 12px', borderRadius: '8px', border: 'none',
                  background: 'var(--accent)', color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px',
                }}
              >
                <Search size={14} /> 搜索
              </button>
            </div>
            {userList.length > 0 && (
              <div style={{
                border: '1px solid var(--border)', borderRadius: '8px',
                maxHeight: '150px', overflow: 'auto', marginBottom: '8px',
              }}>
                {userList.map((u) => (
                  <div
                    key={u.id}
                    onClick={() => handleAddUser(u)}
                    style={{
                      padding: '8px 12px', cursor: 'pointer', fontSize: '13px',
                      borderBottom: '1px solid rgba(0,0,0,0.04)',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      color: 'var(--text-primary)',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.02)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ fontWeight: '500' }}>{u.realName}</span>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>@{u.username}</span>
                    {u.deptName && <span style={{ color: 'var(--text-tertiary)', fontSize: '12px', marginLeft: 'auto' }}>{u.deptName}</span>}
                  </div>
                ))}
              </div>
            )}
            {selectedUsers.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedUsers.map((u) => (
                  <span key={u.id} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '6px',
                    background: 'rgba(0,122,255,0.08)', color: 'var(--accent)',
                    fontSize: '12px', fontWeight: '500',
                  }}>
                    {u.realName}
                    <X size={12} style={{ cursor: 'pointer' }} onClick={() => handleRemoveUser(u.id)} />
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 标题 */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
            标题
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="请输入消息标题"
            maxLength={100}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'var(--bg-input, rgba(0,0,0,0.03))',
              fontSize: '13px', color: 'var(--text-primary)', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 内容 */}
        <div>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>
            内容
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="请输入消息内容"
            rows={5}
            maxLength={1000}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'var(--bg-input, rgba(0,0,0,0.03))',
              fontSize: '13px', color: 'var(--text-primary)', outline: 'none',
              resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
            }}
          />
          <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
            {content.length}/1000
          </div>
        </div>

        {/* 发送按钮 */}
        <button
          onClick={handleSend}
          disabled={sending}
          style={{
            width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
            background: sending ? 'var(--gray-3)' : 'var(--accent)',
            color: '#fff', fontSize: '14px', fontWeight: '600',
            cursor: sending ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'background 0.15s',
          }}
        >
          <Send size={15} />
          {sending ? '发送中...' : '发送'}
        </button>
      </div>
    </GlassModal>
  )
}
