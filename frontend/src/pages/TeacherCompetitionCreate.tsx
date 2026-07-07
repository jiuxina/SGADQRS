import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  Upload,
  X,
  ImageIcon,
} from 'lucide-react'
import { fadeSlideUp, staggerContainer, staggerItem } from '../motion/variants'
import { competitionApi, fileApi } from '../api'
import { useAuthStore } from '../store/authStore'
import { toast } from '../components/Toast'
import { useIsMobile } from '../hooks/useIsMobile'

interface FormData {
  name: string
  organizer: string
  description: string
  rules: string
  registrationStart: string
  registrationEnd: string
  competitionStart: string
  competitionEnd: string
  location: string
  maxMembers: string
  maxTeams: string
}

export default function TeacherCompetitionCreate() {
  const navigate = useNavigate()
  useAuthStore((s) => s.user)
  const [submitting, setSubmitting] = useState(false)
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState<FormData>({
    name: '',
    organizer: '',
    description: '',
    rules: '',
    registrationStart: '',
    registrationEnd: '',
    competitionStart: '',
    competitionEnd: '',
    location: '',
    maxMembers: '5',
    maxTeams: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const isMobile = useIsMobile()

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  /** 拼接后端图片完整 URL */
  function resolveCoverUrl(url: string | null | undefined): string | null {
    if (!url) return null
    if (url.startsWith('/uploads')) return `http://localhost:8080${url}`
    return url
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await fileApi.upload(file)
      setCoverImage(url)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '封面上传失败')
    } finally {
      setUploading(false)
      // 重置 input 以允许重复上传同一文件
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!form.name.trim()) newErrors.name = '请输入竞赛名称'
    if (!form.organizer.trim()) newErrors.organizer = '请输入主办单位'
    if (!form.registrationStart) newErrors.registrationStart = '请选择报名开始时间'
    if (!form.registrationEnd) newErrors.registrationEnd = '请选择报名截止时间'
    if (!form.competitionStart) newErrors.competitionStart = '请选择比赛开始时间'
    if (!form.competitionEnd) newErrors.competitionEnd = '请选择比赛结束时间'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSaveDraft() {
    try {
      await competitionApi.create({
        competitionName: form.name,
        organizer: form.organizer,
        coverImage: coverImage ?? undefined,
        description: form.description,
        rules: form.rules,
        registrationStart: form.registrationStart + ' 00:00:00',
        registrationEnd: form.registrationEnd + ' 23:59:59',
        competitionStart: form.competitionStart + ' 00:00:00',
        competitionEnd: form.competitionEnd + ' 23:59:59',
        location: form.location,
        maxMembers: Number(form.maxMembers) || 1,
        maxTeams: form.maxTeams ? Number(form.maxTeams) : undefined,
        status: 0,
      })
      navigate(-1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    }
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      await competitionApi.create({
        competitionName: form.name,
        organizer: form.organizer,
        coverImage: coverImage ?? undefined,
        description: form.description,
        rules: form.rules,
        registrationStart: form.registrationStart + ' 00:00:00',
        registrationEnd: form.registrationEnd + ' 23:59:59',
        competitionStart: form.competitionStart + ' 00:00:00',
        competitionEnd: form.competitionEnd + ' 23:59:59',
        location: form.location,
        maxMembers: Number(form.maxMembers) || 1,
        maxTeams: form.maxTeams ? Number(form.maxTeams) : undefined,
        status: 1,
      })
      navigate(-1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '提交失败')
    } finally {
      setSubmitting(false)
    }
  }

  const labelStyle: React.CSSProperties = { display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '6px' }
  const errorStyle: React.CSSProperties = { fontSize: '11px', color: 'var(--danger)', marginTop: '4px' }
  const fieldGroupStyle: React.CSSProperties = { marginBottom: '20px' }
  const textareaStyle: React.CSSProperties = {
    width: '100%', minHeight: '100px', padding: '12px 14px', borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.55)', background: 'rgba(255, 255, 255, 0.32)',
    backdropFilter: 'blur(18px) saturate(1.5)', WebkitBackdropFilter: 'blur(18px) saturate(1.5)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.55), inset 0 2px 4px rgba(0, 0, 0, 0.04), 0 0 0 0.5px rgba(255, 255, 255, 0.35)',
    fontSize: '14px', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', transition: 'all 0.2s ease', resize: 'vertical',
  }
  const selectStyle: React.CSSProperties = {
    width: '100%', height: '42px', padding: '0 14px', borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.55)', background: 'rgba(255, 255, 255, 0.32)',
    backdropFilter: 'blur(18px) saturate(1.5)', WebkitBackdropFilter: 'blur(18px) saturate(1.5)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.55), inset 0 2px 4px rgba(0, 0, 0, 0.04), 0 0 0 0.5px rgba(255, 255, 255, 0.35)',
    fontSize: '14px', color: 'var(--text-primary)', outline: 'none', fontFamily: 'inherit', cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none',
  }

  return (
    <>
      <motion.div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }} variants={fadeSlideUp} initial="hidden" animate="visible">
        <button className="btn ghost" onClick={() => navigate(-1)} style={{ width: '36px', height: '36px', padding: 0 }}>
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>发布新竞赛</div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>填写竞赛信息并提交审核</div>
        </div>
      </motion.div>

      <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '28px' }} variants={fadeSlideUp} initial="hidden" animate="visible">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible">
          <motion.div style={fieldGroupStyle} variants={staggerItem}>
            <label style={labelStyle}>竞赛名称 <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="glass-input" placeholder="请输入竞赛名称" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
            {errors.name && <div style={errorStyle}>{errors.name}</div>}
          </motion.div>

          {/* 封面图上传 */}
          <motion.div style={fieldGroupStyle} variants={staggerItem}>
            <label style={labelStyle}>封面图</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleCoverUpload}
            />
            {resolveCoverUrl(coverImage) ? (
              <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                <img
                  src={resolveCoverUrl(coverImage)!}
                  alt="封面预览"
                  style={{
                    width: '100%', height: '180px', objectFit: 'cover',
                    borderRadius: '12px', display: 'block',
                    border: '1px solid rgba(255,255,255,0.55)',
                  }}
                />
                <button
                  onClick={() => setCoverImage(null)}
                  style={{
                    position: 'absolute', top: '8px', right: '8px',
                    width: '28px', height: '28px', borderRadius: '50%',
                    background: 'rgba(0,0,0,0.5)', border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            ) : (
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                style={{
                  width: '100%', maxWidth: '320px', height: '140px',
                  border: '2px dashed var(--accent)',
                  borderRadius: '12px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', cursor: uploading ? 'wait' : 'pointer',
                  background: 'rgba(99,102,241,0.04)',
                  transition: 'all 0.2s ease',
                }}
              >
                {uploading ? (
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>上传中...</span>
                ) : (
                  <>
                    <Upload size={24} strokeWidth={1.5} style={{ color: 'var(--accent)', opacity: 0.6 }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>点击上传封面图</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', opacity: 0.6 }}>支持 JPG / PNG，建议 16:9</span>
                  </>
                )}
              </div>
            )}
          </motion.div>

          <motion.div style={{ marginBottom: '20px' }} variants={staggerItem}>
            <label style={labelStyle}>主办单位 <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="glass-input" placeholder="请输入主办单位" value={form.organizer} onChange={(e) => updateField('organizer', e.target.value)} />
            {errors.organizer && <div style={errorStyle}>{errors.organizer}</div>}
          </motion.div>

          <motion.div style={fieldGroupStyle} variants={staggerItem}>
            <label style={labelStyle}>竞赛描述</label>
            <textarea style={textareaStyle} placeholder="请输入竞赛描述" value={form.description} onChange={(e) => updateField('description', e.target.value)} />
          </motion.div>

          <motion.div style={fieldGroupStyle} variants={staggerItem}>
            <label style={labelStyle}>竞赛规则</label>
            <textarea style={textareaStyle} placeholder="请输入竞赛规则" value={form.rules} onChange={(e) => updateField('rules', e.target.value)} />
          </motion.div>

          <motion.div style={{ marginBottom: '20px' }} variants={staggerItem}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '12px' }}>时间安排</div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ ...labelStyle, fontSize: '12px', color: 'var(--text-secondary)' }}>报名开始时间 <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className="glass-input" type="date" value={form.registrationStart} onChange={(e) => updateField('registrationStart', e.target.value)} />
                {errors.registrationStart && <div style={errorStyle}>{errors.registrationStart}</div>}
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: '12px', color: 'var(--text-secondary)' }}>报名截止时间 <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className="glass-input" type="date" value={form.registrationEnd} onChange={(e) => updateField('registrationEnd', e.target.value)} />
                {errors.registrationEnd && <div style={errorStyle}>{errors.registrationEnd}</div>}
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: '12px', color: 'var(--text-secondary)' }}>比赛开始时间 <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className="glass-input" type="date" value={form.competitionStart} onChange={(e) => updateField('competitionStart', e.target.value)} />
                {errors.competitionStart && <div style={errorStyle}>{errors.competitionStart}</div>}
              </div>
              <div>
                <label style={{ ...labelStyle, fontSize: '12px', color: 'var(--text-secondary)' }}>比赛结束时间 <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input className="glass-input" type="date" value={form.competitionEnd} onChange={(e) => updateField('competitionEnd', e.target.value)} />
                {errors.competitionEnd && <div style={errorStyle}>{errors.competitionEnd}</div>}
              </div>
            </div>
          </motion.div>

          <motion.div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr', gap: '20px', marginBottom: '28px' }} variants={staggerItem}>
            <div>
              <label style={labelStyle}>竞赛地点</label>
              <input className="glass-input" placeholder="请输入竞赛地点" value={form.location} onChange={(e) => updateField('location', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>每队最大人数</label>
              <input className="glass-input" type="number" min={1} max={20} value={form.maxMembers} onChange={(e) => updateField('maxMembers', e.target.value)} />
            </div>
            <div>
              <label style={{ ...labelStyle, color: 'var(--text-secondary)' }}>最大报名队伍数</label>
              <input className="glass-input" type="number" min={0} placeholder="不限" value={form.maxTeams} onChange={(e) => updateField('maxTeams', e.target.value)} />
            </div>
          </motion.div>

          <motion.div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }} variants={staggerItem}>
            <button className="btn ghost" onClick={handleSaveDraft} disabled={submitting}>
              保存草稿
            </button>
            <button className="btn filled-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '提交中...' : '提交审核'}
            </button>
          </motion.div>
        </motion.div>
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
