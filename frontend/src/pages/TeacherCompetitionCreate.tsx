import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowLeft,
} from 'lucide-react'
import { fadeSlideUp, staggerContainer, staggerItem } from '../motion/variants'
import { competitionApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { CompetitionCategory } from '../api/types'
import { toast } from '../components/Toast'
import { useIsMobile } from '../hooks/useIsMobile'

interface FormData {
  name: string
  categoryId: string
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
  const [categories, setCategories] = useState<CompetitionCategory[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<FormData>({
    name: '',
    categoryId: '',
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

  useEffect(() => {
    competitionApi.categories().then(setCategories).catch(console.error)
  }, [])

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormData, string>> = {}
    if (!form.name.trim()) newErrors.name = '请输入竞赛名称'
    if (!form.categoryId) newErrors.categoryId = '请选择竞赛分类'
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
        categoryId: Number(form.categoryId),
        organizer: form.organizer,
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
        categoryId: Number(form.categoryId),
        organizer: form.organizer,
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

          <motion.div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '20px' }} variants={staggerItem}>
            <div>
              <label style={labelStyle}>竞赛分类 <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select style={selectStyle} value={form.categoryId} onChange={(e) => updateField('categoryId', e.target.value)}>
                <option value="">请选择分类</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.categoryName}</option>
                ))}
              </select>
              {errors.categoryId && <div style={errorStyle}>{errors.categoryId}</div>}
            </div>
            <div>
              <label style={labelStyle}>主办单位 <span style={{ color: 'var(--danger)' }}>*</span></label>
              <input className="glass-input" placeholder="请输入主办单位" value={form.organizer} onChange={(e) => updateField('organizer', e.target.value)} />
              {errors.organizer && <div style={errorStyle}>{errors.organizer}</div>}
            </div>
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
