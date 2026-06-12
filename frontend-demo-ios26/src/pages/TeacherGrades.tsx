import { useState } from 'react'
import { motion } from 'motion/react'
import {
  Award,
  Upload,
  ChevronDown,
} from 'lucide-react'
import { staggerContainer, staggerItem, fadeSlideUp } from '../motion/variants'
import { mockCompetitions, mockResults, type CompetitionResult } from '../data/mockData'

const awardOptions: { value: CompetitionResult['awardLevel']; label: string }[] = [
  { value: 'special', label: '特等奖' },
  { value: 'first', label: '一等奖' },
  { value: 'second', label: '二等奖' },
  { value: 'third', label: '三等奖' },
  { value: 'excellence', label: '优秀奖' },
  { value: null, label: '无' },
]

const awardValueToLabel: Record<string, string> = {
  special: '特等奖',
  first: '一等奖',
  second: '二等奖',
  third: '三等奖',
  excellence: '优秀奖',
}

export default function TeacherGrades() {
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string>(mockCompetitions[0]?.id ?? '')
  const [results, setResults] = useState<CompetitionResult[]>([...mockResults])

  const selectedCompetition = mockCompetitions.find((c) => c.id === selectedCompetitionId)
  const filteredResults = results.filter((r) => r.competitionId === selectedCompetitionId)

  function handleScoreChange(resultId: string, value: string) {
    setResults((prev) =>
      prev.map((r) =>
        r.id === resultId ? { ...r, score: value === '' ? null : parseFloat(value) } : r
      )
    )
  }

  function handleAwardChange(resultId: string, value: string) {
    const awardLevel = value === '' ? null : (value as CompetitionResult['awardLevel'])
    setResults((prev) =>
      prev.map((r) =>
        r.id === resultId
          ? { ...r, awardLevel, awardName: awardLevel ? awardValueToLabel[awardLevel] ?? '' : '' }
          : r
      )
    )
  }

  function handlePublish() {
    setResults((prev) =>
      prev.map((r) =>
        r.competitionId === selectedCompetitionId
          ? { ...r, isPublished: true, publishTime: new Date().toISOString().split('T')[0] }
          : r
      )
    )
  }

  const selectStyle: React.CSSProperties = {
    width: '100%',
    height: '42px',
    padding: '0 14px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.55)',
    background: 'rgba(255, 255, 255, 0.32)',
    backdropFilter: 'blur(18px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(18px) saturate(1.5)',
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.55), inset 0 2px 4px rgba(0, 0, 0, 0.04), 0 0 0 0.5px rgba(255, 255, 255, 0.35)',
    fontSize: '14px',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
  }

  const inlineSelectStyle: React.CSSProperties = {
    height: '30px',
    padding: '0 8px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    background: 'rgba(255, 255, 255, 0.28)',
    fontSize: '12px',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
    minWidth: '80px',
  }

  const inlineInputStyle: React.CSSProperties = {
    width: '72px',
    height: '30px',
    padding: '0 8px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    background: 'rgba(255, 255, 255, 0.28)',
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'inherit',
    textAlign: 'center',
  }

  return (
    <>
      {/* Competition selector */}
      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '20px', marginBottom: '24px' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <Award size={18} strokeWidth={1.5} color="var(--accent)" />
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>成绩录入</div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '1px' }}>选择竞赛后录入或修改成绩</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              选择竞赛
            </label>
            <div style={{ position: 'relative' }}>
              <select
                style={selectStyle}
                value={selectedCompetitionId}
                onChange={(e) => setSelectedCompetitionId(e.target.value)}
              >
                {mockCompetitions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <ChevronDown size={14} strokeWidth={1.5} color="var(--gray-2)" style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>
          {selectedCompetition && (
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', paddingBottom: '10px', whiteSpace: 'nowrap' }}>
              {selectedCompetition.competitionStart} ~ {selectedCompetition.competitionEnd}
            </div>
          )}
        </div>
      </motion.div>

      {/* Results table */}
      <motion.div
        className="glass-card glass-card-vertical glass-card-static"
        style={{ padding: '0' }}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
      >
        {/* Table header */}
        <div style={{ padding: '16px 18px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
            成绩管理
            <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
              {filteredResults.length}条记录
            </span>
          </span>
          <button className="btn filled-primary" onClick={handlePublish}>
            <Upload size={14} strokeWidth={2} /> 发布成绩
          </button>
        </div>

        {/* Table */}
        <table className="data-table">
          <thead>
            <tr>
              <th>学生 / 队伍</th>
              <th>学号</th>
              <th>分数</th>
              <th>排名</th>
              <th>奖项</th>
              <th>发布状态</th>
              <th style={{ width: '80px' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredResults.map((result) => (
              <tr key={result.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: 'var(--gray-5)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '11px', fontWeight: '600', color: 'var(--gray-1)', flexShrink: 0,
                    }}>
                      {result.studentName.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '13px' }}>{result.studentName}</div>
                      {result.teamName && (
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '1px' }}>{result.teamName}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{result.studentId}</td>
                <td>
                  <input
                    style={inlineInputStyle}
                    type="number"
                    min={0}
                    max={100}
                    step={0.1}
                    value={result.score ?? ''}
                    onChange={(e) => handleScoreChange(result.id, e.target.value)}
                    placeholder="--"
                  />
                </td>
                <td>
                  <span style={{ fontWeight: '700', fontSize: '14px', color: result.ranking ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                    {result.ranking ? `#${result.ranking}` : '--'}
                  </span>
                </td>
                <td>
                  <select
                    style={inlineSelectStyle}
                    value={result.awardLevel ?? ''}
                    onChange={(e) => handleAwardChange(result.id, e.target.value)}
                  >
                    <option value="">无</option>
                    {awardOptions.filter((o) => o.value !== null).map((o) => (
                      <option key={o.value} value={o.value!}>{o.label}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <span
                    className={`glass-badge ${result.isPublished ? 'pass' : 'pending'}`}
                    style={{ fontSize: '11px', padding: '2px 8px' }}
                  >
                    {result.isPublished ? '已发布' : '未发布'}
                  </span>
                </td>
                <td>
                  <button className="text-btn blue" style={{ fontSize: '12px' }}>
                    保存
                  </button>
                </td>
              </tr>
            ))}
            {filteredResults.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '40px 0' }}>
                  该竞赛暂无成绩记录
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Summary bar */}
        {filteredResults.length > 0 && (
          <motion.div
            style={{
              padding: '12px 18px',
              display: 'flex',
              gap: '24px',
              borderTop: '1px solid rgba(0,0,0,0.04)',
            }}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {[
              { label: '平均分', value: (filteredResults.reduce((s, r) => s + (r.score ?? 0), 0) / filteredResults.filter((r) => r.score !== null).length || 0).toFixed(1) },
              { label: '最高分', value: Math.max(...filteredResults.map((r) => r.score ?? 0)).toFixed(1) },
              { label: '已发布', value: `${filteredResults.filter((r) => r.isPublished).length}/${filteredResults.length}` },
            ].map((item) => (
              <motion.div key={item.label} variants={staggerItem} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{item.label}</span>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)' }}>{item.value}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>

      <div style={{ paddingBottom: '40px' }} />
    </>
  )
}
