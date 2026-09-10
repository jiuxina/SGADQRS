import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'motion/react'
import { X, Award } from 'lucide-react'
import { setGlobalEditGrade } from './editGradeDialogUtils'
import type { EditGradeOptions, EditGradeResult } from './editGradeDialogUtils'

interface EditGradeState extends EditGradeOptions {
  resolve: (value: EditGradeResult | null) => void
}

/** EditGrade 容器 — 需挂载在 App 根部 */
export function EditGradeContainer() {
  const [state, setState] = useState<EditGradeState | null>(null)
  const [score, setScore] = useState('')
  const [remark, setRemark] = useState('')
  const [ranking, setRanking] = useState('')
  const [awardLevel, setAwardLevel] = useState('')
  const scoreRef = useRef<HTMLInputElement>(null)

  const editGrade = useCallback((options: EditGradeOptions): Promise<EditGradeResult | null> => {
    return new Promise<EditGradeResult | null>((resolve) => {
      setState({ ...options, resolve })
      setScore(options.defaultScore != null ? String(options.defaultScore) : '')
      setRemark(options.defaultRemark ?? '')
      setRanking(options.defaultRanking != null ? String(options.defaultRanking) : '')
      setAwardLevel(options.defaultAwardLevel != null ? String(options.defaultAwardLevel) : '')
    })
  }, [])

  useEffect(() => {
    setGlobalEditGrade(editGrade)
    return () => { setGlobalEditGrade(null) }
  }, [editGrade])

  useEffect(() => {
    if (state) {
      const timer = setTimeout(() => scoreRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [state])

  const handleConfirm = useCallback(() => {
    const scoreNum = Number(score)
    if (score === '' || isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      return
    }
    state?.resolve({
      score: scoreNum,
      remark,
      ranking: ranking !== '' ? Number(ranking) : null,
      awardLevel: awardLevel !== '' ? Number(awardLevel) : null,
    })
    setState(null)
  }, [state, score, remark, ranking, awardLevel])

  const handleCancel = useCallback(() => {
    state?.resolve(null)
    setState(null)
  }, [state])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) handleConfirm()
    if (e.key === 'Escape') handleCancel()
  }, [handleConfirm, handleCancel])

  if (!state) return null

  return (
    // 不用 AnimatePresence 退出动画：退出动画被挂起时弹窗会以 opacity:0 残留并堆叠；关闭即卸载。
    state && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
          onClick={handleCancel}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            style={{
              width: window.innerWidth < 768 ? 'calc(100vw - 32px)' : '400px',
              background: 'var(--surface, rgba(255,255,255,0.95))',
              borderRadius: '18px',
              padding: '28px 24px 20px',
              position: 'relative',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={handleCancel}
              className="icon-btn"
              style={{
                position: 'absolute', top: '14px', right: '14px',
              }}
            >
              <X size={16} strokeWidth={1.5} />
            </button>

            {/* Icon */}
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <Award size={16} strokeWidth={1.5} color="var(--text-secondary)" />
            </div>

            {/* Title */}
            <div style={{
              fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)',
              textAlign: 'center', marginBottom: '8px',
            }}>
              {state.title || '编辑成绩'}
            </div>

            {/* Message */}
            <div style={{
              fontSize: '14px', color: 'var(--text-secondary)',
              textAlign: 'center', lineHeight: 1.6, marginBottom: '14px',
            }}>
              编辑 {state.studentName} 的成绩信息
            </div>

            {/* Score Input */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}>
                分数 <span style={{ color: 'var(--text-tertiary)', fontWeight: '400' }}>(0-100)</span>
              </label>
              <input
                ref={scoreRef}
                className="glass-input"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="请输入分数"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Ranking Input */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}>
                排名 <span style={{ color: 'var(--text-tertiary)', fontWeight: '400' }}>(可选)</span>
              </label>
              <input
                className="glass-input"
                type="number"
                min="1"
                step="1"
                value={ranking}
                onChange={(e) => setRanking(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="请输入排名"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>

            {/* Award Level Select */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}>
                奖项等级 <span style={{ color: 'var(--text-tertiary)', fontWeight: '400' }}>(可选)</span>
              </label>
              <select
                className="glass-input"
                value={awardLevel}
                onChange={(e) => setAwardLevel(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ width: '100%', boxSizing: 'border-box', height: '40px' }}
              >
                <option value="">请选择奖项</option>
                {(() => {
                  let list = state.awards
                  if (typeof list === 'string') { try { list = JSON.parse(list) } catch { list = [] } }
                  return Array.isArray(list) && list.length > 0 ? (
                    list.map((award: { name: string; level: number }) => (
                      <option key={award.level} value={award.level}>{award.name}</option>
                    ))
                  ) : null
                })() || (
                  <>
                    <option value="1">特等奖</option>
                    <option value="2">一等奖</option>
                    <option value="3">二等奖</option>
                    <option value="4">三等奖</option>
                    <option value="5">优秀奖</option>
                  </>
                )}
              </select>
            </div>

            {/* Remark Input */}
            <div style={{ marginBottom: '12px' }}>
              <label style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                marginBottom: '6px',
              }}>
                备注 <span style={{ color: 'var(--text-tertiary)', fontWeight: '400' }}>(可选)</span>
              </label>
              <textarea
                className="glass-input"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="请输入备注信息"
                rows={3}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  minHeight: '80px',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleCancel}
                style={{
                  flex: 1, height: '42px', borderRadius: '10px',
                  background: 'var(--glass-bg, rgba(0,0,0,0.04))',
                  border: '1px solid var(--border, rgba(0,0,0,0.08))',
                  color: 'var(--text-secondary)',
                  fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {state.cancelText || '取消'}
              </button>
              <button
                onClick={handleConfirm}
                style={{
                  flex: 1, height: '42px', borderRadius: '10px',
                  background: '#007AFF',
                  border: 'none',
                  color: '#fff',
                  fontSize: '14px', fontWeight: '600',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#0066D6')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#007AFF')}
              >
                {state.confirmText || '保存'}
              </button>
            </div>
          </motion.div>
        </motion.div>
    )
  )
}
