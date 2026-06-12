import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Check,
  ChevronRight,
  Trophy,
  Users,
  Award,
  ShieldCheck,
  FileText,
  Clock,
} from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp, expandCollapse } from '../motion/variants'
import { mockCompetitionTeams, mockReviewSections } from '../data/mockData'

const team = mockCompetitionTeams[0]

const recentAchievements = [
  { name: '全国大学生人工智能大赛', award: '一等奖', year: '2024', status: 'pass' as const },
  { name: '省级程序设计竞赛', award: '二等奖', year: '2024', status: 'pass' as const },
  { name: '校级创新创业大赛', award: '金奖', year: '2023', status: 'pass' as const },
  { name: '全国大学生数学建模竞赛', award: '三等奖', year: '2023', status: 'pass' as const },
  { name: 'ACM区域赛', award: '银牌', year: '2023', status: 'pass' as const },
]

const teamMembers = [
  { name: '张明辉', studentId: '2021010101', role: '队长 · 算法设计', status: 'pass' as const },
  { name: '李思雨', studentId: '2021010102', role: '模型训练', status: 'pass' as const },
  { name: '孙博文', studentId: '2021010301', role: '数据处理', status: 'pass' as const },
  { name: '周晓敏', studentId: '2021010302', role: '系统开发', status: 'pass' as const },
]

const reviewLog = [
  { time: '2025-06-10 14:32', action: '报名材料提交', user: '深度学习研究小组' },
  { time: '2025-06-09 09:15', action: '指导教师确认', user: '王建国教授' },
  { time: '2025-06-05 16:40', action: '项目方案上传', user: '张明辉' },
  { time: '2025-06-01 10:20', action: '队员信息审核', user: '系统' },
  { time: '2025-05-28 11:00', action: '院系初审核通过', user: '计算机学院' },
]

export default function StudentAudit() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sectionIcons = [
    FileText, Users, Award, ShieldCheck,
    FileText, ShieldCheck, ShieldCheck, Trophy,
  ]

  return (
    <>
      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
        {/* Left: Team Profile Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Profile Card */}
          <motion.div className="detail-panel" variants={fadeSlideUp} initial="hidden" animate="visible">
            <div className="detail-profile">
              <div className="detail-avatar">{team.teamName.charAt(0)}</div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="detail-name">{team.teamName}</span>
                  <span className={`glass-badge ${team.status}`}>
                    {team.status === 'pass' ? '通过' : team.status === 'fail' ? '未通过' : '审查中'}
                  </span>
                </div>
                <div className="detail-meta">{team.competition}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  队长：{team.leaderName} · {team.competitionType} · 指导教师：王建国教授
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="detail-metrics">
              <div className="detail-metric">
                <div className="detail-metric-value">{team.avgScore}</div>
                <div className="detail-metric-label">评分 / 100</div>
              </div>
              <div className="detail-metric">
                <div className="detail-metric-value">{team.memberCount}</div>
                <div className="detail-metric-label">队员人数</div>
              </div>
              <div className="detail-metric">
                <div className="detail-metric-value" style={{ color: 'var(--accent)' }}>3</div>
                <div className="detail-metric-label">获奖次数</div>
              </div>
            </div>

            {/* Competition Stats */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>报名进度</span>
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>已完成</span>
              </div>
              <div className="glass-progress">
                <div className="glass-progress-fill blue" style={{ width: '100%' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                {[
                  { label: '参赛次数', value: 5 },
                  { label: '获奖率', value: '60%' },
                  { label: '积分', value: 280 },
                ].map((item) => (
                  <div key={item.label} style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.value}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Members */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>队伍成员</div>
              {teamMembers.map((member, i) => (
                <div key={i} className="glass-tile" style={{
                  display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px',
                  fontSize: '12px',
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', background: 'var(--gray-5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '10px', fontWeight: '600', color: 'var(--gray-1)', flexShrink: 0,
                  }}>
                    {member.name.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{member.name}</span>
                    <span style={{ color: 'var(--text-tertiary)', marginLeft: '6px' }}>{member.role}</span>
                  </div>
                  <span className={`glass-badge ${member.status}`} style={{ fontSize: '10px', padding: '1px 6px' }}>通过</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn filled-primary" style={{ width: '100%', height: '40px', fontSize: '14px' }}>
                通过审核
              </button>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
                <button style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'inherit',
                }}>
                  要求补充材料
                </button>
                <button style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '13px', color: 'var(--text-secondary)', fontFamily: 'inherit',
                }}>
                  驳回申请
                </button>
              </div>
            </div>
          </motion.div>

          {/* Team Info */}
          <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '16px' }} variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.12 }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>基本信息</div>
            <div className="info-list">
              {[
                { label: '所属学院', value: '计算机科学与技术学院' },
                { label: '竞赛类型', value: team.competitionType },
                { label: '队长', value: team.leaderName },
                { label: '学号', value: team.leaderId },
                { label: '报名时间', value: '2025年5月' },
                { label: '指导教师', value: '王建国教授' },
              ].map((item) => (
                <div className="info-row" key={item.label}>
                  <span className="info-label">{item.label}</span>
                  <span className="info-value">{item.value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: Review Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Review Sections Timeline */}
          <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '20px' }} variants={fadeSlideUp} initial="hidden" animate="visible">
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' }}>审查项目明细</div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '16px' }}>
              {mockReviewSections.filter(s => s.status === 'pass').length}/{mockReviewSections.length} 项已通过
            </div>
            <motion.div className="timeline" variants={staggerContainer} initial="hidden" animate="visible">
              {mockReviewSections.map((section, i) => {
                const IconComp = sectionIcons[i] || FileText
                const isExpanded = expandedId === section.id
                return (
                  <div className="timeline-item" key={section.id}>
                    <div className={`timeline-dot ${section.status === 'pass' ? 'completed' : section.status === 'reviewing' ? 'active' : 'pending'}`}>
                      {section.status === 'pass' ? (
                        <Check strokeWidth={2.5} size={11} />
                      ) : section.status === 'reviewing' ? (
                        <IconComp strokeWidth={1.5} size={11} />
                      ) : null}
                    </div>
                    <motion.div variants={staggerItem} style={{ flex: 1 }}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : section.id)}
                        style={{
                          display: 'block', width: '100%', background: 'none', border: 'none',
                          cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', padding: 0,
                        }}
                      >
                        <div className="timeline-card">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <div className="timeline-title">{section.label}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{section.score}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span className={`glass-badge ${section.status}`} style={{ fontSize: '11px', padding: '2px 8px' }}>
                                {section.status === 'pass' ? '通过' : section.status === 'fail' ? '未通过' : '审查中'}
                              </span>
                              <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
                                <ChevronRight size={14} color="var(--gray-3)" />
                              </motion.div>
                            </div>
                          </div>
                        </div>
                      </button>
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            variants={expandCollapse}
                            initial="collapsed"
                            animate="expanded"
                            exit="collapsed"
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.6, padding: '0 0 0 4px' }}>
                              {section.detail}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                )
              })}
            </motion.div>
          </motion.div>

          {/* Competition History */}
          <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '0' }} variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}>
            <div style={{ padding: '16px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>参赛获奖记录</span>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                共 {recentAchievements.length} 项
              </span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>竞赛名称</th>
                  <th>年份</th>
                  <th>奖项</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                {recentAchievements.map((item) => (
                  <tr key={item.name}>
                    <td style={{ fontWeight: '500' }}>{item.name}</td>
                    <td>{item.year}</td>
                    <td>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                        {item.award}
                      </span>
                    </td>
                    <td>
                      <span className="glass-badge pass" style={{ fontSize: '11px', padding: '2px 8px' }}>已认定</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          {/* Review Log */}
          <motion.div className="glass-card glass-card-vertical glass-card-static" style={{ padding: '0' }} variants={fadeSlideUp} initial="hidden" animate="visible" transition={{ delay: 0.15 }}>
            <div style={{ padding: '16px 18px 12px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>操作记录</span>
            </div>
            <motion.div variants={staggerContainer} initial="hidden" animate="visible">
              {reviewLog.map((log, i) => (
                <motion.div key={i} variants={staggerItem} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px',
                  borderBottom: i < reviewLog.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                }}>
                  <Clock size={14} color="var(--gray-2)" strokeWidth={1.5} style={{ flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>{log.action}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>{log.time} · {log.user}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </>
  )
}
