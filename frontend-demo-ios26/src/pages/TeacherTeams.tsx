import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Search,
  Check,
  X,
  Eye,
  Users,
  Trophy,
  ChevronDown,
} from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp, expandCollapse } from '../motion/variants'
import { mockCompetitionTeams, type ReviewStatus } from '../data/mockData'

type StatusFilter = 'all' | ReviewStatus

const statusLabels: Record<string, string> = {
  all: '全部',
  pass: '通过',
  reviewing: '审查中',
  pending: '待审',
  fail: '未通过',
}

const statusBadgeClass: Record<string, string> = {
  pass: 'pass',
  fail: 'fail',
  pending: 'pending',
  reviewing: 'reviewing',
}

const statusDisplayText: Record<string, string> = {
  pass: '通过',
  fail: '未通过',
  pending: '待审',
  reviewing: '审查中',
}

export default function TeacherTeams() {
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const totalCount = mockCompetitionTeams.length
  const passCount = mockCompetitionTeams.filter((t) => t.status === 'pass').length
  const pendingCount = mockCompetitionTeams.filter((t) => t.status === 'pending').length
  const failCount = mockCompetitionTeams.filter((t) => t.status === 'fail').length

  const filtered = mockCompetitionTeams.filter((t) => {
    const matchSearch = t.teamName.includes(searchQuery) || t.leaderName.includes(searchQuery) || t.competition.includes(searchQuery)
    const matchFilter = filter === 'all' || t.status === filter
    return matchSearch && matchFilter
  })

  function handleToggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id))
  }

  return (
    <>
      {/* Top metrics row */}
      <motion.div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {[
          { label: '总队伍数', value: totalCount },
          { label: '已审核', value: passCount },
          { label: '待审核', value: pendingCount },
          { label: '已拒绝', value: failCount },
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

      {/* Team Table */}
      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '0', marginTop: '24px' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        {/* Table header */}
        <div style={{ padding: '16px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            队伍管理
            <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
              {filtered.length}队
            </span>
          </span>
          <div className="search-wrap" style={{ width: '200px' }}>
            <Search strokeWidth={1.5} />
            <input
              className="glass-search"
              placeholder="搜索队伍或竞赛..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ marginBottom: 0 }}
            />
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ padding: '0 18px 12px' }}>
          <div className="chip-row">
            {(['all', 'pass', 'reviewing', 'pending', 'fail'] as StatusFilter[]).map((f) => (
              <button key={f} className={`chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {statusLabels[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '36px' }}></th>
              <th>队伍名称</th>
              <th>所属竞赛</th>
              <th>队长</th>
              <th>队员数</th>
              <th>平均分</th>
              <th>状态</th>
              <th style={{ width: '180px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((team) => {
              const isExpanded = expandedId === team.id
              return (
                <motion.tr key={team.id} style={{ display: 'table-row' }}>
                  <td colSpan={8} style={{ padding: 0, borderBottom: 'none' }}>
                    {/* Main row */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '36px 1fr 1.2fr 0.7fr 0.6fr 0.6fr 0.7fr 180px',
                        alignItems: 'center',
                        padding: '12px 14px',
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(0,0,0,0.03)',
                        background: isExpanded ? 'rgba(0,122,255,0.03)' : undefined,
                        transition: 'background 0.15s',
                      }}
                      onClick={() => handleToggleExpand(team.id)}
                    >
                      <div>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
                          <ChevronDown size={14} color="var(--gray-3)" strokeWidth={1.5} />
                        </motion.div>
                      </div>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: 'var(--text-primary)' }}>{team.teamName}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{team.competition}</div>
                      <div style={{ fontSize: '13px' }}>{team.leaderName}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                        <Users size={12} strokeWidth={1.5} style={{ marginRight: '4px', verticalAlign: '-1px' }} />
                        {team.memberCount}
                      </div>
                      <div style={{ fontWeight: '700', fontSize: '13px' }}>{team.avgScore}</div>
                      <div>
                        <span className={`glass-badge ${statusBadgeClass[team.status]}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                          {statusDisplayText[team.status]}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button
                          className="text-btn blue"
                          onClick={(e) => { e.stopPropagation(); handleToggleExpand(team.id) }}
                          style={{ fontSize: '12px' }}
                        >
                          <Eye size={12} strokeWidth={1.5} style={{ marginRight: '2px' }} />
                          查看
                        </button>
                        {(team.status === 'pending' || team.status === 'reviewing') && (
                          <>
                            <button
                              className="text-btn"
                              style={{ fontSize: '12px', color: 'var(--success)' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Check size={12} strokeWidth={2} style={{ marginRight: '2px' }} />
                              通过
                            </button>
                            <button
                              className="text-btn danger"
                              onClick={(e) => e.stopPropagation()}
                              style={{ fontSize: '12px' }}
                            >
                              <X size={12} strokeWidth={2} style={{ marginRight: '2px' }} />
                              拒绝
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          variants={expandCollapse}
                          initial="collapsed"
                          animate="expanded"
                          exit="collapsed"
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{ padding: '16px 20px 20px 50px', background: 'rgba(0,0,0,0.012)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', maxWidth: '640px' }}>
                              {/* Team info */}
                              <div className="glass-tile" style={{ padding: '14px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '10px' }}>队伍信息</div>
                                <div className="info-list">
                                  <div className="info-row">
                                    <span className="info-label">队伍名称</span>
                                    <span className="info-value">{team.teamName}</span>
                                  </div>
                                  <div className="info-row">
                                    <span className="info-label">队长</span>
                                    <span className="info-value">{team.leaderName}</span>
                                  </div>
                                  <div className="info-row">
                                    <span className="info-label">学号</span>
                                    <span className="info-value">{team.leaderId}</span>
                                  </div>
                                  <div className="info-row">
                                    <span className="info-label">竞赛类型</span>
                                    <span className="info-value">{team.competitionType}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Review status */}
                              <div className="glass-tile" style={{ padding: '14px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '10px' }}>审核状态</div>
                                <div className="info-list">
                                  <div className="info-row">
                                    <span className="info-label">报名审核</span>
                                    <span className={`glass-badge ${statusBadgeClass[team.registrationAudit]}`} style={{ fontSize: '11px' }}>
                                      {statusDisplayText[team.registrationAudit]}
                                    </span>
                                  </div>
                                  <div className="info-row">
                                    <span className="info-label">资格审核</span>
                                    <span className={`glass-badge ${statusBadgeClass[team.qualificationAudit]}`} style={{ fontSize: '11px' }}>
                                      {statusDisplayText[team.qualificationAudit]}
                                    </span>
                                  </div>
                                  <div className="info-row">
                                    <span className="info-label">平均分</span>
                                    <span className="info-value" style={{ fontWeight: '800' }}>
                                      <Trophy size={12} strokeWidth={1.5} style={{ marginRight: '4px', verticalAlign: '-1px', color: 'var(--warning)' }} />
                                      {team.avgScore}
                                    </span>
                                  </div>
                                  <div className="info-row">
                                    <span className="info-label">综合状态</span>
                                    <span className={`glass-badge ${statusBadgeClass[team.status]}`} style={{ fontSize: '11px' }}>
                                      {statusDisplayText[team.status]}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </td>
                </motion.tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '40px 0' }}>
                  暂无队伍数据
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
