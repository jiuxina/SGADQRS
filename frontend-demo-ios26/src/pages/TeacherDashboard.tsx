import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search,
  Phone,
  Eye,
  Mail,
} from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp, panelSlideIn } from '../motion/variants'
import { mockTeacherTeams, mockWarnings, type TeacherCompetitionTeam } from '../data/mockData'

export default function TeacherDashboard() {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'pass' | 'fail' | 'pending' | 'reviewing'>('all')
  const [selectedTeam, setSelectedTeam] = useState<TeacherCompetitionTeam | null>(null)

  const highWarnings = mockWarnings.filter((w) => w.severity === 'high').length
  const teamsWithWarnings = mockTeacherTeams.filter((s) => s.warnings.length > 0).length
  const passCount = mockTeacherTeams.filter((s) => s.overallStatus === 'pass').length
  const avgScore = (mockTeacherTeams.reduce((s, t) => s + t.avgScore, 0) / mockTeacherTeams.length).toFixed(1)

  const filtered = mockTeacherTeams.filter((s) => {
    const matchSearch = s.teamName.includes(searchQuery) || s.leaderName.includes(searchQuery)
    const matchFilter = filter === 'all' || s.overallStatus === filter
    return matchSearch && matchFilter
  })

  const statusLabel = (s: string) =>
    s === 'pass' ? '通过' : s === 'fail' ? '未通过' : s === 'reviewing' ? '审查中' : '待审'

  return (
    <>
      {/* Top metrics row */}
      <motion.div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }} variants={staggerContainer} initial="hidden" animate="visible">
        {[
          { label: '队伍总数', value: mockTeacherTeams.length },
          { label: '已通过', value: passCount },
          { label: '有预警', value: teamsWithWarnings },
          { label: '高风险', value: highWarnings },
          { label: '平均评分', value: avgScore },
        ].map((item) => (
          <motion.div key={item.label} className="metric-card" style={{ padding: '16px' }} variants={staggerItem}>
            <div style={{ marginBottom: '10px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item.label}</span>
            </div>
            <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
              {item.value}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Two-column: Team Table + Detail/Warnings */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedTeam ? '1fr 360px' : '1fr', gap: '20px', marginTop: '24px' }}>
        {/* Team Table */}
        <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '0' }} variants={fadeSlideUp} initial="hidden" animate="visible">
          {/* Table header */}
          <div style={{ padding: '16px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
              参赛队伍
              <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>{filtered.length}队</span>
            </span>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="search-wrap" style={{ width: '180px' }}>
                <Search strokeWidth={1.5} />
                <input
                  className="glass-search"
                  placeholder="搜索队名或队长..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
            </div>
          </div>

          {/* Filter chips */}
          <div style={{ padding: '0 18px 12px' }}>
            <div className="chip-row">
              {(['all', 'pass', 'reviewing', 'pending', 'fail'] as const).map((f) => (
                <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                  {f === 'all' ? '全部' : f === 'pass' ? '通过' : f === 'reviewing' ? '审查中' : f === 'pending' ? '待审' : '未通过'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>队伍名称</th>
                <th>竞赛项目</th>
                <th>队长</th>
                <th>队员</th>
                <th>评分</th>
                <th>预警</th>
                <th>状态</th>
                <th style={{ width: '80px' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((team) => (
                <tr
                  key={team.id}
                  className="clickable-row"
                  onClick={() => setSelectedTeam(team)}
                  style={{
                    background: selectedTeam?.id === team.id ? 'rgba(0,122,255,0.04)' : undefined,
                  }}
                >
                  <td>
                    <div className={`status-dot ${team.overallStatus}`} />
                  </td>
                  <td style={{ fontWeight: '600' }}>{team.teamName}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{team.competition}</td>
                  <td>{team.leaderName}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {team.memberCount}/{team.maxMembers}
                  </td>
                  <td>
                    <span style={{ fontWeight: '700' }}>
                      {team.avgScore}
                    </span>
                  </td>
                  <td>
                    {team.warnings.length > 0 ? (
                      <span className="severity-badge medium">{team.warnings.length}项</span>
                    ) : (
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>无</span>
                    )}
                  </td>
                  <td>
                    <span className={`glass-badge ${team.overallStatus}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                      {statusLabel(team.overallStatus)}
                    </span>
                  </td>
                  <td>
                    <button
                      className="text-btn blue"
                      onClick={(e) => { e.stopPropagation(); navigate('/student/audit') }}
                      style={{ fontSize: '12px' }}
                    >
                      审阅
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Detail Panel (shown when team selected) */}
        <AnimatePresence>
          {selectedTeam && (
            <motion.div
              key="detail-panel"
              variants={panelSlideIn}
              initial="initial"
              animate="animate"
              exit="exit"
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
            {/* Team Detail */}
            <div className="detail-panel" style={{ padding: '20px' }}>
              <div className="detail-profile" style={{ marginBottom: '16px' }}>
                <div className="detail-avatar" style={{ width: 48, height: 48, fontSize: '20px' }}>
                  {selectedTeam.teamName.charAt(0)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedTeam.teamName}</span>
                    <span className={`glass-badge ${selectedTeam.overallStatus}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                      {statusLabel(selectedTeam.overallStatus)}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {selectedTeam.competition}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                    队长：{selectedTeam.leaderName} · {selectedTeam.phone}
                  </div>
                </div>
              </div>

              <div className="detail-metrics" style={{ marginBottom: '16px' }}>
                <div className="detail-metric" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>{selectedTeam.avgScore}</div>
                  <div className="detail-metric-label">评分</div>
                </div>
                <div className="detail-metric" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>{selectedTeam.memberCount}</div>
                  <div className="detail-metric-label">队员数</div>
                </div>
                <div className="detail-metric" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {selectedTeam.warnings.length}
                  </div>
                  <div className="detail-metric-label">预警数</div>
                </div>
              </div>

              {/* Registration progress */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>报名进度</span>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>
                    {Math.round((selectedTeam.memberCount / selectedTeam.maxMembers) * 100)}%
                  </span>
                </div>
                <div className="glass-progress">
                  <div className="glass-progress-fill blue" style={{ width: `${Math.min((selectedTeam.memberCount / selectedTeam.maxMembers) * 100, 100)}%` }} />
                </div>
              </div>

              {/* Warnings */}
              {selectedTeam.warnings.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>预警详情</div>
                  {selectedTeam.warnings.map((w, i) => (
                    <div key={i} className="glass-tile" style={{
                      marginBottom: '4px', fontSize: '12px',
                      color: 'var(--text-secondary)',
                    }}>
                      {w}
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn primary" style={{ flex: 1 }} onClick={() => navigate('/student/audit')}>
                  <Eye size={14} strokeWidth={1.5} /> 审阅
                </button>
                <button className="btn ghost" style={{ flex: 1 }}>
                  <Phone size={14} strokeWidth={1.5} /> 联系
                </button>
                <button className="btn ghost" style={{ flex: 1 }}>
                  <Mail size={14} strokeWidth={1.5} /> 消息
                </button>
              </div>
            </div>

            {/* Global Warnings */}
            <div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '0' }}>
              <div style={{ padding: '14px 16px 10px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>
                  全部预警
                  <span style={{ fontSize: '11px', fontWeight: '400', color: 'var(--text-secondary)', marginLeft: '6px' }}>{mockWarnings.length}条</span>
                </span>
              </div>
              {mockWarnings.slice(0, 6).map((warning, i) => {
                const team = mockTeacherTeams.find((s) => s.leaderName === warning.leaderName)
                return (
                  <div key={warning.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', cursor: 'pointer',
                    borderBottom: i < 5 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                  }}
                    onClick={() => team && setSelectedTeam(team)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>{team?.teamName || '未知'}</span>
                        <span className={`severity-badge ${warning.severity}`} style={{ fontSize: '10px' }}>
                          {warning.severity === 'high' ? '高' : '中'}
                        </span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {warning.message}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
