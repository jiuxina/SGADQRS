import { useState, useEffect, useRef, startTransition } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { User, Lock, Save, Camera, Sparkles, ExternalLink } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { userApi, fileApi } from '../api'
import { toast } from '../components/toastUtils'
import { fadeSlideUp } from '../motion/variants'
import { env } from '../config/env'

export default function ProfilePage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)

  const [formData, setFormData] = useState({
    nickname: '',
    gender: 0,
    avatar: '',
    bio: '',
    skills: '',
  })
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB')
      return
    }
    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      toast.error('仅支持 JPG/PNG/GIF/WebP 格式')
      return
    }
    setUploading(true)
    try {
      const res = await fileApi.upload(file)
      setFormData((prev) => ({ ...prev, avatar: res.url }))
      toast.success('头像上传成功')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
      // 重置 input 以便再次选择同一文件
      e.target.value = ''
    }
  }

  useEffect(() => {
    if (user) {
      startTransition(() => {
        setFormData({
          nickname: user.nickname || '',
          gender: user.gender || 0,
          avatar: user.avatar || '',
          bio: user.bio || '',
          skills: user.skills || '',
        })
      })
    }
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return
    if (formData.nickname.trim().length > 50) {
      toast.error('昵称最多 50 个字符')
      return
    }
    setSaving(true)
    try {
      await userApi.updateProfile({
        nickname: formData.nickname.trim(),
        gender: formData.gender,
        avatar: formData.avatar,
        bio: formData.bio,
        skills: formData.skills.trim(),
      })
      // 更新本地用户信息
      setUser({
        ...user,
        nickname: formData.nickname.trim() || null,
        gender: formData.gender,
        avatar: formData.avatar,
        bio: formData.bio || null,
        skills: formData.skills.trim() || null,
      })
      toast.success('个人信息更新成功')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '更新失败')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.oldPassword) {
      toast.error('请输入原密码')
      return
    }
    if (!passwordData.newPassword) {
      toast.error('请输入新密码')
      return
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('新密码至少6位')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('两次输入的密码不一致')
      return
    }
    setChangingPassword(true)
    try {
      await userApi.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      })
      logout()
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' })
      toast.success('密码已修改，请重新登录')
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '密码修改失败')
    } finally {
      setChangingPassword(false)
    }
  }

  const getAvatarSrc = () => {
    if (formData.avatar) {
      if (formData.avatar.startsWith('/uploads')) {
        return `${env.apiBaseUrl.replace('/api', '')}${formData.avatar}`
      }
      return formData.avatar
    }
    const gender = formData.gender || 3
    const index = user ? (user.id % 20) + 1 : 1
    return `/avatar/s${gender}-${index}.webp`
  }

  const genderLabel = (g: number) => {
    if (g === 1) return '男'
    if (g === 2) return '女'
    return '未知'
  }

  if (!user) return null

  return (
    <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" style={{ maxWidth: '720px', margin: '0 auto' }}>
      {/* 用户信息卡片 */}
      <div className="glass-card glass-card-static" style={{ padding: '20px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        {/* 隐藏的文件选择器 */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleAvatarUpload}
          style={{ display: 'none' }}
        />
        <div
          style={{ position: 'relative', cursor: 'pointer' }}
          onClick={() => fileInputRef.current?.click()}
        >
          <img
            src={getAvatarSrc()}
            alt="avatar"
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '3px solid rgba(0, 122, 255, 0.2)',
              opacity: uploading ? 0.6 : 1,
              transition: 'opacity 0.2s',
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = `/avatar/s3-1.webp`
            }}
          />
          <div style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            pointerEvents: 'none',
          }}>
            <Camera size={14} color="var(--text-secondary)" />
          </div>
          {uploading && (
            <div style={{
              position: 'absolute',
              inset: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <div className="spinner" style={{
                width: '24px',
                height: '24px',
                border: '3px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: '200px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 4px 0' }}>
            {user.nickname || user.realName || user.username}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 8px 0' }}>
            {user.role === 'admin' ? '管理员' : user.role === 'teacher' ? '教师' : '学生'} · {user.username}
          </p>
          {user.role === 'student' && (
            <button
              className="btn ghost"
              style={{ height: '28px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}
              onClick={() => navigate(`/student/u/${user.id}`)}
            >
              <ExternalLink size={13} strokeWidth={1.5} />
              查看我的公开主页
            </button>
          )}
        </div>
      </div>

      {/* 编辑个人信息 */}
      <div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <User size={18} strokeWidth={1.8} color="#007AFF" />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            个人信息
          </h3>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              真实姓名
            </label>
            <input
              className="glass-input"
              value={user.realName || ''}
              disabled
              style={{ width: '100%', boxSizing: 'border-box', opacity: 0.7 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              社区昵称（招募广场/组队帖展示用）
            </label>
            <input
              className="glass-input"
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              placeholder="不填则展示打码后的姓名"
              maxLength={50}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              个人简介
            </label>
            <textarea
              className="glass-input"
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="介绍你的方向、经历与兴趣，让队友更了解你（解锁后完整可见，未解锁展示前 60 字）"
              maxLength={500}
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Sparkles size={13} strokeWidth={1.8} /> 技能标签（逗号分隔）
              </span>
            </label>
            <input
              className="glass-input"
              value={formData.skills}
              onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
              placeholder="例：C++,算法,数学建模"
              maxLength={255}
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              性别
            </label>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[1, 2, 0].map((g) => (
                <label
                  key={g}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: `1px solid ${formData.gender === g ? '#007AFF' : 'rgba(0,0,0,0.1)'}`,
                    background: formData.gender === g ? 'rgba(0, 122, 255, 0.1)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={g}
                    checked={formData.gender === g}
                    onChange={() => setFormData({ ...formData, gender: g })}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{genderLabel(g)}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            className="btn"
            onClick={handleSaveProfile}
            disabled={saving}
            style={{ justifySelf: 'start', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', background: 'transparent' }}
          >
            <Save size={16} />
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </div>

      {/* 修改密码 */}
      <div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Lock size={18} strokeWidth={1.8} color="#007AFF" />
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
            修改密码
          </h3>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              原密码
            </label>
            <input
              className="glass-input"
              type="password"
              value={passwordData.oldPassword}
              onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
              placeholder="请输入原密码"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              新密码
            </label>
            <input
              className="glass-input"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="请输入新密码（至少6位）"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              确认新密码
            </label>
            <input
              className="glass-input"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="请再次输入新密码"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>

          <button
            className="btn"
            onClick={handleChangePassword}
            disabled={changingPassword}
            style={{ justifySelf: 'start', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent)', background: 'transparent' }}
          >
            <Lock size={16} />
            {changingPassword ? '修改中...' : '修改密码'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
