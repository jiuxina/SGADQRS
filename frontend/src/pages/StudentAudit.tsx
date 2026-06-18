import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { competitionApi, registrationApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { CompetitionItem, RegistrationItem } from '../api/types'

export default function StudentAudit() {
  const user = useAuthStore((s) => s.user)
  const [searchParams] = useSearchParams()
  const compId = searchParams.get('compId')
  const [competition, setCompetition] = useState<CompetitionItem | null>(null)
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!compId || !user) return
    setLoading(true)
    Promise.all([
      competitionApi.getById(Number(compId)),
      registrationApi.list({ current: 1, size: 50, competitionId: Number(compId), studentId: user.id }),
    ]).then(([comp, regResult]) => {
      setCompetition(comp)
      setRegistrations(regResult.records)
    }).catch(console.error).finally(() => setLoading(false))
  }, [compId, user])

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>加载中...</div>
  if (!competition) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>竞赛不存在</div>

  const statusMap: Record<number, { cls: string; label: string }> = {
    0: { cls: 'pending', label: '待审核' },
    1: { cls: 'pass', label: '已通过' },
    2: { cls: 'fail', label: '已拒绝' },
  }

  return (
    <>
      <motion.div variants={fadeSlideUp} initial="hidden" animate="visible" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
          {competition.competitionName}
        </h2>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          主办方：{competition.organizer} · 已报名 {competition.registrationCount} 人
        </div>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '20px' }}
          variants={fadeSlideUp} initial="hidden" animate="visible">
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>竞赛信息</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div>分类：{competition.categoryName || '-'}</div>
            <div>地点：{competition.location || '-'}</div>
            <div>每队人数：{competition.maxMembers}</div>
            <div>报名截止：{competition.registrationEnd}</div>
          </div>
          {competition.description && (
            <div style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              {competition.description}
            </div>
          )}
        </motion.div>

        <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '20px' }}
          variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.05 }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '12px' }}>我的报名状态</div>
          {registrations.map((reg) => {
            const st = statusMap[reg.status] || statusMap[0]
            return (
              <div key={reg.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', flex: 1 }}>
                  {reg.teamName ? `团队：${reg.teamName}` : '个人报名'}
                </span>
                <span className={`glass-badge ${st.cls}`} style={{ fontSize: '11px', padding: '2px 8px' }}>{st.label}</span>
              </div>
            )
          })}
          {registrations.length === 0 && (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '13px' }}>
              尚未报名此竞赛
            </div>
          )}
        </motion.div>
      </div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
