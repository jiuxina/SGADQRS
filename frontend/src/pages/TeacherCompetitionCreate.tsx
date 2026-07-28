import { useState, useRef, useEffect, startTransition } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  Upload,
  X,
  File,
} from 'lucide-react'
import type { CompetitionAttachment } from '../api/types'
import { fadeSlideUp, instant } from '../motion/variants'
import { competitionApi, fileApi } from '../api'
import { useAuthStore } from '../store/authStore'
import { toast } from '../components/toastUtils'
import { useIsMobile } from '../hooks/useIsMobile'
import { resolveCoverUrl } from '../utils/format'

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

interface AwardItem {
  name: string
  level: number
}

/** 从日期时间字符串中提取日期部分 YYYY-MM-DD */
function extractDate(datetime: string | null | undefined): string {
  if (!datetime) return ''
  return datetime.slice(0, 10)
}

export default function TeacherCompetitionCreate() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const editId = id ? Number(id) : undefined
  useAuthStore((s) => s.user)
  const [submitting, setSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachments, setAttachments] = useState<CompetitionAttachment[]>([])
  const [uploadingAttachment, setUploadingAttachment] = useState(false)
  const attachmentInputRef = useRef<HTMLInputElement>(null)
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
  const [awards, setAwards] = useState<AwardItem[]>([])
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const isMobile = useIsMobile()

  // 编辑模式：加载已有竞赛数据
  useEffect(() => {
    if (!isEdit || !editId) return
    startTransition(() => setLoadingData(true))
    competitionApi.getById(editId)
      .then((comp) => {
        setForm({
          name: comp.competitionName ?? '',
          organizer: comp.organizer ?? '',
          description: comp.description ?? '',
          rules: comp.rules ?? '',
          registrationStart: extractDate(comp.registrationStart),
          registrationEnd: extractDate(comp.registrationEnd),
          competitionStart: extractDate(comp.competitionStart),
          competitionEnd: extractDate(comp.competitionEnd),
          location: comp.location ?? '',
          maxMembers: String(comp.maxMembers ?? 5),
          maxTeams: comp.maxTeams != null ? String(comp.maxTeams) : '',
        })
        if (comp.awards) setAwards(comp.awards)
        if (comp.coverImage) setCoverImage(comp.coverImage)
        if (comp.attachments) setAttachments(comp.attachments)
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : '加载竞赛数据失败')
        navigate(-1)
      })
      .finally(() => setLoadingData(false))
  }, [isEdit, editId, navigate])

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => { const next = { ...prev }; delete next[field]; return next })
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const result = await fileApi.upload(file)
      setCoverImage(result.url)
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

    // 四个时间均已填写时，校验先后顺序：报名开始 < 报名结束 < 竞赛开始 < 竞赛结束
    if (form.registrationStart && form.registrationEnd && form.competitionStart && form.competitionEnd) {
      if (form.registrationStart >= form.registrationEnd) {
        newErrors.registrationEnd = '报名截止时间必须晚于报名开始时间'
      }
      if (form.registrationEnd >= form.competitionStart) {
        newErrors.competitionStart = '比赛开始时间必须晚于报名截止时间'
      }
      if (form.competitionStart >= form.competitionEnd) {
        newErrors.competitionEnd = '比赛结束时间必须晚于比赛开始时间'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleAttachmentUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || !files.length) return
    setUploadingAttachment(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const result = await fileApi.upload(file)
        setAttachments((prev) => [...prev, {
          fileName: result.fileName,
          fileUrl: result.url,
          fileSize: result.fileSize,
          fileType: result.fileType,
        }])
      }
      toast.success('附件上传成功')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '附件上传失败')
    } finally {
      setUploadingAttachment(false)
      if (attachmentInputRef.current) attachmentInputRef.current.value = ''
    }
  }

  function handleDeleteAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSaveDraft() {
    try {
      const payload = {
        ...(isEdit ? { id: editId } : {}),
        competitionName: form.name,
        organizer: form.organizer,
        coverImage: coverImage ?? undefined,
        description: form.description,
        rules: form.rules,
        registrationStart: form.registrationStart + ' 00:00:00',
        registrationEnd: form.registrationEnd + ' 23:59:59',
        competitionStart: form.competitionStart + ' 00:00:00',
        competitionEnd: form.competitionEnd + ' 00:00:00',
        location: form.location,
        maxMembers: Number(form.maxMembers) || 1,
        maxTeams: form.maxTeams ? Number(form.maxTeams) : undefined,
        awards: awards.length > 0 ? JSON.stringify(awards) : undefined,
        attachments: attachments.length > 0 ? JSON.stringify(attachments) : undefined,
        status: 0,
      }
      if (isEdit) {
        await competitionApi.update(payload)
      } else {
        await competitionApi.create(payload)
      }
      navigate(-1)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '保存失败')
    }
  }

  async function handleSubmit() {
    if (!validate()) return
    setSubmitting(true)
    try {
      const payload = {
        ...(isEdit ? { id: editId } : {}),
        competitionName: form.name,
        organizer: form.organizer,
        coverImage: coverImage ?? undefined,
        description: form.description,
        rules: form.rules,
        registrationStart: form.registrationStart + ' 00:00:00',
        registrationEnd: form.registrationEnd + ' 23:59:59',
        competitionStart: form.competitionStart + ' 00:00:00',
        competitionEnd: form.competitionEnd + ' 00:00:00',
        location: form.location,
        maxMembers: Number(form.maxMembers) || 1,
        maxTeams: form.maxTeams ? Number(form.maxTeams) : undefined,
        awards: awards.length > 0 ? JSON.stringify(awards) : undefined,
        attachments: attachments.length > 0 ? JSON.stringify(attachments) : undefined,
        status: 1,
      }
      if (isEdit) {
        await competitionApi.update(payload)
      } else {
        await competitionApi.create(payload)
      }
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
  return (
    <>
      <motion.div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }} variants={fadeSlideUp} initial="hidden" animate="visible">
        <button className="btn ghost" onClick={() => navigate(-1)} style={{ width: '36px', height: '36px', padding: 0 }}>
          <ArrowLeft size={16} strokeWidth={1.5} />
        </button>
        <div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
            {isEdit ? '编辑竞赛' : '发布新竞赛'}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
            {isEdit ? '修改竞赛信息并保存' : '填写竞赛信息并提交审核'}
          </div>
        </div>
      </motion.div>

      {loadingData ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-tertiary)' }}>加载竞赛数据中...</div>
      ) : (

      <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '28px' }} variants={fadeSlideUp} initial="hidden" animate="visible">
        <motion.div variants={instant} initial="hidden" animate="visible">
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>竞赛名称 <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="glass-input" placeholder="请输入竞赛名称" value={form.name} onChange={(e) => updateField('name', e.target.value)} />
            {errors.name && <div style={errorStyle}>{errors.name}</div>}
          </div>

          {/* 封面图上传 */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>封面图</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleCoverUpload}
            />
            {coverImage ? (
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
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>主办单位 <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input className="glass-input" placeholder="请输入主办单位" value={form.organizer} onChange={(e) => updateField('organizer', e.target.value)} />
            {errors.organizer && <div style={errorStyle}>{errors.organizer}</div>}
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>竞赛描述</label>
            <textarea style={textareaStyle} placeholder="请输入竞赛描述" value={form.description} onChange={(e) => updateField('description', e.target.value)} />
          </div>

          <div style={fieldGroupStyle}>
            <label style={labelStyle}>竞赛规则</label>
            <textarea style={textareaStyle} placeholder="请输入竞赛规则" value={form.rules} onChange={(e) => updateField('rules', e.target.value)} />
          </div>

          {/* 自定义奖项管理 */}
          <div style={fieldGroupStyle}>
            <label style={labelStyle}>竞赛奖项</label>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '10px' }}>
              自定义该竞赛的奖项，学生录入成绩时可选择
            </div>
            {awards.map((award, index) => (
              <div key={index} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                marginBottom: '8px', padding: '10px 14px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.4)',
              }}>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', minWidth: '40px' }}>
                  等级{award.level}
                </span>
                <input
                  className="glass-input"
                  placeholder="奖项名称"
                  value={award.name}
                  onChange={(e) => {
                    const newAwards = [...awards]
                    newAwards[index] = { ...newAwards[index], name: e.target.value }
                    setAwards(newAwards)
                  }}
                  style={{ flex: 1, height: '36px' }}
                />
                <button
                  onClick={() => setAwards(awards.filter((_, i) => i !== index))}
                  style={{
                    width: '28px', height: '28px', borderRadius: '50%',
                    border: 'none', cursor: 'pointer', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.08)', color: 'var(--text-secondary)',
                  }}
                >
                  <X size={14} strokeWidth={2} />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                const nextLevel = awards.length > 0 ? Math.max(...awards.map(a => a.level)) + 1 : 1
                setAwards([...awards, { name: '', level: nextLevel }])
              }}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                padding: '10px', borderRadius: '10px', width: '100%',
                border: '1px dashed var(--accent)', cursor: 'pointer',
                background: 'rgba(99,102,241,0.04)', fontSize: '13px',
                color: 'var(--accent)', fontWeight: '500',
              }}
            >
              + 添加奖项
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr 1fr', gap: '20px', marginBottom: '28px' }}>
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
          </div>

          {/* 附件管理 - 仅编辑模式 */}
          {isEdit && (
            <div style={{ ...fieldGroupStyle, paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.3)' }}>
              <label style={labelStyle}>竞赛附件</label>
              <input
                ref={attachmentInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleAttachmentUpload}
              />

              {attachments.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                  {attachments.map((att, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: '10px',
                        background: 'rgba(255,255,255,0.3)',
                        border: '1px solid rgba(255,255,255,0.4)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <File size={16} strokeWidth={1.5} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                        <span style={{ fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {att.fileName}
                        </span>
                        {att.fileSize > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', flexShrink: 0 }}>
                            {(att.fileSize / 1024).toFixed(1)} KB
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteAttachment(index)}
                        style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          border: 'none', cursor: 'pointer', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'rgba(0,0,0,0.08)', color: 'var(--text-secondary)',
                          transition: 'all 0.2s',
                        }}
                      >
                        <X size={12} strokeWidth={2} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div
                onClick={() => !uploadingAttachment && attachmentInputRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', padding: '12px', borderRadius: '10px',
                  border: '1px dashed var(--accent)',
                  cursor: uploadingAttachment ? 'wait' : 'pointer',
                  background: 'rgba(99,102,241,0.04)',
                  transition: 'all 0.2s ease',
                }}
              >
                {uploadingAttachment ? (
                  <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>上传中...</span>
                ) : (
                  <>
                    <Upload size={18} strokeWidth={1.5} style={{ color: 'var(--accent)', opacity: 0.6 }} />
                    <span style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>点击上传附件</span>
                  </>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn ghost" onClick={handleSaveDraft} disabled={submitting}>
              保存草稿
            </button>
            <button className="btn filled-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? '提交中...' : '提交审核'}
            </button>
          </div>
        </motion.div>
      </motion.div>
      )}
    </>
  )
}
