import { useState } from 'react'
import GlassModal from './GlassModal'
import EmptyState from './EmptyState'
import { registrationApi, fileApi } from '../api'
import type { TeamItem } from '../api/types'
import { toast } from './toastUtils'

interface RegistrationModalProps {
  open: boolean
  onClose: () => void
  competitionId: number | null
  competitionName: string
  onSuccess: () => void
  onFail: (message: string) => void
}

const phoneRegex = /^1[3-9]\d{9}$/

export default function RegistrationModal({
  open,
  onClose,
  competitionId,
  competitionName,
  onSuccess,
  onFail,
}: RegistrationModalProps) {
  const [contactPhone, setContactPhone] = useState('')
  const [remark, setRemark] = useState('')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [isTeamRegistration, setIsTeamRegistration] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [teamList, setTeamList] = useState<TeamItem[]>([])
  const [teamsLoading, setTeamsLoading] = useState(false)

  const phoneError = contactPhone.length > 0 && !phoneRegex.test(contactPhone) ? '请输入正确的手机号' : ''

  // 加载团队列表
  const loadTeamList = async (compId: number) => {
    setTeamsLoading(true)
    try {
      const res = await registrationApi.teamList({ competitionId: compId, current: 1, size: 50 })
      setTeamList(res.records)
    } catch (err) {
      toast.error('加载团队列表失败')
      console.error('加载团队列表失败:', err)
    } finally {
      setTeamsLoading(false)
    }
  }

  // 文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await fileApi.upload(file)
      setAttachmentUrl(res.url)
    } catch (err) {
      toast.error('上传附件失败')
      console.error('上传附件失败:', err)
    } finally {
      setUploading(false)
    }
  }

  // 提交报名
  const handleRegister = async () => {
    if (!competitionId) return
    if (contactPhone && !phoneRegex.test(contactPhone)) return
    try {
      await registrationApi.register({
        competitionId,
        contactPhone,
        teamId: isTeamRegistration ? selectedTeamId ?? undefined : undefined,
        remark: remark || undefined,
        attachmentUrl: attachmentUrl || undefined,
      })
      resetForm()
      onClose()
      onSuccess()
    } catch (err) {
      onFail(err instanceof Error ? err.message : '报名失败')
    }
  }

  // 重置表单
  const resetForm = () => {
    setContactPhone('')
    setRemark('')
    setAttachmentUrl('')
    setIsTeamRegistration(false)
    setSelectedTeamId(null)
    setTeamList([])
  }

  // 关闭时重置表单
  const handleClose = () => {
    resetForm()
    onClose()
  }

  // 切换团队报名时加载团队列表
  const handleTeamToggle = (checked: boolean) => {
    setIsTeamRegistration(checked)
    setSelectedTeamId(null)
    if (checked && competitionId) {
      loadTeamList(competitionId)
    }
  }

  return (
    <GlassModal open={open} onClose={handleClose} title="确认报名" maxWidth="420px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
        {competitionName}
      </div>
      <div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--text-primary)' }}>
          <input
            type="checkbox"
            checked={isTeamRegistration}
            onChange={(e) => handleTeamToggle(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent)' }}
          />
          以团队身份报名
        </label>
      </div>
      {isTeamRegistration && (
        <div>
          <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>选择团队</label>
          {teamsLoading ? (
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', padding: '8px 0' }}>加载中...</div>
          ) : teamList.length === 0 ? (
            <EmptyState text="暂无可用团队，请先创建团队" />
          ) : (
            <select
              value={selectedTeamId ?? ''}
              onChange={(e) => setSelectedTeamId(e.target.value ? Number(e.target.value) : null)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '8px',
                border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: '13px', outline: 'none',
              }}
            >
              <option value="">请选择团队</option>
              {teamList.map((team) => (
                <option key={team.id} value={team.id}>{team.teamName}</option>
              ))}
            </select>
          )}
        </div>
      )}
      <div>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>联系电话</label>
        <input
          type="tel"
          className="glass-search"
          placeholder="请输入联系电话"
          value={contactPhone}
          onChange={(e) => setContactPhone(e.target.value)}
          style={{ width: '100%', marginBottom: 0, borderColor: phoneError ? 'var(--danger, #ef4444)' : undefined }}
        />
        {phoneError && (
          <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>{phoneError}</div>
        )}
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>参赛备注</label>
        <textarea
          className="glass-search"
          placeholder="选填，填写参赛备注信息"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          rows={3}
          style={{ width: '100%', marginBottom: 0, resize: 'vertical', fontFamily: 'inherit', paddingTop: '8px' }}
        />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '6px' }}>附件材料</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="file"
            id="registration-modal-file-input"
            style={{ display: 'none' }}
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.zip,.rar,.jpg,.png"
          />
          <button
            className="btn ghost"
            type="button"
            style={{ height: '32px', fontSize: '12px' }}
            onClick={() => document.getElementById('registration-modal-file-input')?.click()}
            disabled={uploading}
          >
            {uploading ? '上传中...' : '选择文件'}
          </button>
          {attachmentUrl && (
            <span style={{ fontSize: '12px', color: 'var(--accent)' }}>
              已上传
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button className="btn ghost" onClick={handleClose}>取消</button>
        <button className="btn ghost" onClick={handleRegister}>确认报名</button>
      </div>
      </div>
    </GlassModal>
  )
}
