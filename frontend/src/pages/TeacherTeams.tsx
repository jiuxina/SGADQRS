import { useState, useEffect, useCallback } from 'react'
import { motion } from 'motion/react'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { registrationApi } from '../api'
import { useAuthStore } from '../store/authStore'
import type { TeamItem } from '../api/types'

const statusMap: Record<number, { cls: string; label: string }> = {
  0: { cls: 'pending', label: '组建中' },
  1: { cls: 'pending', label: '已提交' },
  2: { cls: 'pass', label: '已通过' },
  3: { cls: 'fail', label: '已拒绝' },
}

export default function TeacherTeams() {
  const user = useAuthStore((s) => s.user)
  const [teams, setTeams] = useState<TeamItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const result = await registrationApi.teamList({ current: 1, size: 50 })
      setTeams(result.records)
    } catch (err) { console.error('加载团队数据失败:', err) }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => { loadData() }, [loadData])

  const handleAudit = async (id: number, status: number) => {
    try { await registrationApi.auditTeam(id, status); loadData() }
    catch (err) { alert(err instanceof Error ? err.message : '操作失败') }
  }

  if (loading && teams.length === 0) return <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>加载中...</div>

  return (
    <>
      <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '0' }}
        variants={fadeSlideUp} initial="hidden" animate="visible">
        <div style={{ padding: '16px 18px 12px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            团队管理 <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>{teams.length} 个团队</span>
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>团队名称</th><th>竞赛</th><th>队长</th><th>成员数</th><th>状态</th><th style={{ width: '140px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => {
              const st = statusMap[team.status] || statusMap[0]
              return (
                <tr key={team.id}>
                  <td style={{ fontWeight: '600' }}>{team.teamName}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{team.competitionName || '-'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{team.leaderName || '-'}</td>
                  <td>{team.members?.length || 0}</td>
                  <td>
                    <span className={`glass-badge ${st.cls}`} style={{ fontSize: '11px', padding: '2px 8px' }}>{st.label}</span>
                  </td>
                  <td>
                    {(team.status === 0 || team.status === 1) ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn primary" style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={() => handleAudit(team.id, 2)}>通过</button>
                        <button className="btn ghost" style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--danger)' }}
                          onClick={() => handleAudit(team.id, 3)}>拒绝</button>
                      </div>
                    ) : <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>-</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {teams.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-tertiary)', fontSize: '14px' }}>暂无团队数据</div>
        )}
      </motion.div>
      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
